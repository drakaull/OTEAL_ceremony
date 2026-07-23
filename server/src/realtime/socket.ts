import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { getGameState } from "../gameState.js";
import { buildPublicState } from "./publicState.js";
import { tryJoinByPseudo, reclaimParticipant, reconnectByToken, markDisconnected, listConnectedPseudos } from "./participants.js";
import {
  linkSocketToParticipant,
  unlinkSocket,
  getParticipantIdForSocket,
  markSocketAsAdmin,
  isSocketAdmin,
} from "./connectionStore.js";
import { castVote, VoteError } from "./vote.js";
import {
  startCeremony,
  startVoting,
  revealNext,
  nextCategory,
  endCeremony,
  resetCeremonyAndBroadcast,
  broadcastLobby,
  broadcastVotesProgress,
  GameFlowError,
} from "./gameFlow.js";

type Ack = (response: unknown) => void;

async function getMyVoteForCurrentCategory(participantId: string) {
  const state = await getGameState();
  if (!state.currentCategoryId) return null;
  const vote = await prisma.vote.findUnique({
    where: { participantId_categoryId: { participantId, categoryId: state.currentCategoryId } },
  });
  return vote?.nomineeId ?? null;
}

async function sendWelcomePayload(socket: Socket, participant: { id: string; pseudo: string; token: string }) {
  const [state, myVote] = await Promise.all([buildPublicState(), getMyVoteForCurrentCategory(participant.id)]);
  socket.emit("participant:welcome", {
    participantId: participant.id,
    pseudo: participant.pseudo,
    token: participant.token,
    state,
    myVote,
  });
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    // The main screen (and anyone else who hasn't joined as a participant yet) still
    // needs the current snapshot right away, not just on the next phase transition.
    buildPublicState().then((state) => socket.emit("state:update", state));
    listConnectedPseudos().then((pseudos) => socket.emit("lobby:participants", pseudos));

    socket.on("participant:join", async ({ pseudo }: { pseudo?: string }, ack: Ack) => {
      const trimmed = (pseudo ?? "").trim();
      if (!trimmed) {
        ack({ status: "error", message: "Pseudo requis." });
        return;
      }
      try {
        const result = await tryJoinByPseudo(trimmed);
        if (result.status === "taken") {
          ack({ status: "taken" });
          return;
        }
        if (result.status === "reclaim_available") {
          ack({ status: "reclaim_available", participantId: result.participantId, pseudo: result.pseudo });
          return;
        }
        linkSocketToParticipant(socket.id, result.participant.id);
        await sendWelcomePayload(socket, result.participant);
        await broadcastLobby(io);
        ack({ status: "joined" });
      } catch (err) {
        console.error(err);
        ack({ status: "error", message: "Erreur serveur." });
      }
    });

    socket.on("participant:reclaimConfirm", async ({ participantId }: { participantId?: string }, ack: Ack) => {
      if (!participantId) {
        ack({ status: "error", message: "Participant invalide." });
        return;
      }
      try {
        const participant = await reclaimParticipant(participantId);
        linkSocketToParticipant(socket.id, participant.id);
        await sendWelcomePayload(socket, participant);
        await broadcastLobby(io);
        ack({ status: "joined" });
      } catch (err) {
        console.error(err);
        ack({ status: "error", message: "Impossible de reprendre cette identité." });
      }
    });

    socket.on("participant:reconnectToken", async ({ token }: { token?: string }, ack: Ack) => {
      if (!token) {
        ack({ status: "not_found" });
        return;
      }
      try {
        const participant = await reconnectByToken(token);
        if (!participant) {
          ack({ status: "not_found" });
          return;
        }
        linkSocketToParticipant(socket.id, participant.id);
        await sendWelcomePayload(socket, participant);
        await broadcastLobby(io);
        ack({ status: "joined" });
      } catch (err) {
        console.error(err);
        ack({ status: "not_found" });
      }
    });

    socket.on("admin:authenticate", ({ password }: { password?: string }, ack: Ack) => {
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        ack({ status: "error", message: "Mot de passe incorrect." });
        return;
      }
      markSocketAsAdmin(socket.id);
      ack({ status: "ok" });
    });

    socket.on("vote:cast", async ({ categoryId, nomineeId }: { categoryId?: string; nomineeId?: string }, ack: Ack) => {
      const participantId = getParticipantIdForSocket(socket.id);
      if (!participantId) {
        ack({ status: "error", message: "Vous n'avez pas encore rejoint la partie." });
        return;
      }
      if (!categoryId || !nomineeId) {
        ack({ status: "error", message: "Vote invalide." });
        return;
      }
      try {
        await castVote(participantId, categoryId, nomineeId);
        ack({ status: "ok" });
        await broadcastVotesProgress(io);
      } catch (err) {
        if (err instanceof VoteError) {
          ack({ status: "error", message: err.message });
          return;
        }
        console.error(err);
        ack({ status: "error", message: "Erreur serveur." });
      }
    });

    const adminActions: Record<string, (io: Server) => Promise<void>> = {
      "admin:startCeremony": startCeremony,
      "admin:startVoting": startVoting,
      "admin:reveal": revealNext,
      "admin:nextCategory": nextCategory,
      "admin:endCeremony": endCeremony,
      "admin:reset": resetCeremonyAndBroadcast,
    };

    for (const [eventName, handler] of Object.entries(adminActions)) {
      socket.on(eventName, async (_payload: unknown, ack: Ack) => {
        if (!isSocketAdmin(socket.id)) {
          ack({ status: "error", message: "Action réservée à l'admin." });
          return;
        }
        try {
          await handler(io);
          ack({ status: "ok" });
        } catch (err) {
          if (err instanceof GameFlowError) {
            ack({ status: "error", message: err.message });
            return;
          }
          console.error(err);
          ack({ status: "error", message: "Erreur serveur." });
        }
      });
    }

    socket.on("disconnect", async () => {
      try {
        const participantId = unlinkSocket(socket.id);
        if (participantId) {
          await markDisconnected(participantId);
          await broadcastLobby(io);
        }
      } catch (err) {
        console.error("Error handling disconnect", err);
      }
    });
  });
}
