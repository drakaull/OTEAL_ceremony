import type { Server } from "socket.io";
import { prisma } from "../prisma.js";
import { getGameState } from "../gameState.js";
import { computePodium, podiumRevealOrder } from "../podium.js";
import { buildPublicState } from "./publicState.js";
import { listConnectedPseudos } from "./participants.js";
import { resetCeremony } from "../ceremonyReset.js";
import { clearAllParticipantLinks } from "./connectionStore.js";

const VOTE_DURATION_SECONDS = Number(process.env.VOTE_DURATION_SECONDS ?? 30);

let voteTimeout: NodeJS.Timeout | null = null;

class GameFlowError extends Error {}

async function updateGameState(data: Parameters<typeof prisma.gameState.update>[0]["data"]) {
  return prisma.gameState.update({ where: { id: "singleton" }, data });
}

export async function broadcastState(io: Server) {
  const state = await buildPublicState();
  io.emit("state:update", state);
}

export async function broadcastLobby(io: Server) {
  const pseudos = await listConnectedPseudos();
  io.emit("lobby:participants", pseudos);
}

/** Tells every connected client its participant identity is gone (Participant rows were wiped) so it re-shows the pseudo entry screen instead of silently failing on the next action. */
function forceParticipantsToRejoin(io: Server) {
  clearAllParticipantLinks();
  io.emit("participant:forceRejoin");
}

export async function broadcastVotesProgress(io: Server) {
  const state = await getGameState();
  if (state.phase !== "VOTING" || !state.currentCategoryId) return;

  const [total, voted] = await Promise.all([
    prisma.participant.count({ where: { connected: true } }),
    prisma.vote.findMany({
      where: { categoryId: state.currentCategoryId, participant: { connected: true } },
      select: { participant: { select: { pseudo: true } } },
    }),
  ]);

  io.emit("votes:progress", {
    total,
    voted: voted.length,
    voterPseudos: voted.map((v) => v.participant.pseudo),
  });
}

function clearVoteTimer() {
  if (voteTimeout) {
    clearTimeout(voteTimeout);
    voteTimeout = null;
  }
}

export async function startCeremony(io: Server) {
  const state = await getGameState();
  if (state.phase !== "LOBBY") throw new GameFlowError("La cérémonie a déjà démarré.");

  const firstCategory = await prisma.category.findFirst({ orderBy: { order: "asc" } });
  if (!firstCategory) throw new GameFlowError("Aucune catégorie configurée.");

  await updateGameState({
    phase: "INTRO",
    currentCategoryId: firstCategory.id,
    revealStep: 0,
    timerEndsAt: null,
  });
  await broadcastState(io);
}

export async function startVoting(io: Server) {
  const state = await getGameState();
  if (state.phase !== "INTRO") throw new GameFlowError("Impossible de lancer le vote maintenant.");

  const timerEndsAt = new Date(Date.now() + VOTE_DURATION_SECONDS * 1000);
  await updateGameState({ phase: "VOTING", timerEndsAt });
  await broadcastState(io);
  await broadcastVotesProgress(io);

  clearVoteTimer();
  voteTimeout = setTimeout(() => {
    closeVote(io).catch((err) => console.error("Failed to auto-close vote", err));
  }, VOTE_DURATION_SECONDS * 1000);
}

export async function closeVote(io: Server) {
  const state = await getGameState();
  if (state.phase !== "VOTING") return;

  clearVoteTimer();
  await updateGameState({ phase: "VOTE_CLOSED", timerEndsAt: null });
  await broadcastState(io);
}

export async function revealNext(io: Server) {
  const state = await getGameState();
  if (state.phase !== "VOTE_CLOSED" && state.phase !== "REVEALING") {
    throw new GameFlowError("Impossible de révéler maintenant.");
  }
  if (!state.currentCategoryId) throw new GameFlowError("Aucune catégorie en cours.");

  const podium = await computePodium(state.currentCategoryId);
  const order = podiumRevealOrder(podium);
  const nextStep = state.revealStep + 1;
  if (nextStep > order.length) throw new GameFlowError("Tout le podium est déjà révélé.");

  await updateGameState({ phase: "REVEALING", revealStep: nextStep });
  await broadcastState(io);
}

export async function nextCategory(io: Server) {
  const state = await getGameState();
  if (state.phase !== "REVEALING") throw new GameFlowError("Impossible de passer à la catégorie suivante maintenant.");
  if (!state.currentCategoryId) throw new GameFlowError("Aucune catégorie en cours.");

  const current = await prisma.category.findUnique({ where: { id: state.currentCategoryId } });
  if (!current) throw new GameFlowError("Catégorie introuvable.");

  const next = await prisma.category.findFirst({
    where: { order: { gt: current.order } },
    orderBy: { order: "asc" },
  });

  if (next) {
    await updateGameState({
      phase: "INTRO",
      currentCategoryId: next.id,
      revealStep: 0,
      timerEndsAt: null,
    });
  } else {
    await updateGameState({ phase: "RECAP", currentCategoryId: null, revealStep: 0, timerEndsAt: null });
  }
  await broadcastState(io);
}

export async function endCeremony(io: Server) {
  const state = await getGameState();
  if (state.phase !== "RECAP") throw new GameFlowError("Impossible de terminer maintenant.");
  await updateGameState({ phase: "ENDED" });
  await broadcastState(io);
}

export async function resetCeremonyAndBroadcast(io: Server) {
  const state = await getGameState();
  if (state.phase !== "ENDED") throw new GameFlowError("La cérémonie doit être terminée avant la remise à zéro.");

  clearVoteTimer();
  await resetCeremony();
  forceParticipantsToRejoin(io);
  await broadcastState(io);
  await broadcastLobby(io);
}

/**
 * Emergency "start this ceremony over" for the admin: usable at any phase, keeps the
 * configured categories/nominees (unlike resetCeremonyAndBroadcast, which is for wiping
 * everything between two different evenings), just clears participants/votes and returns
 * to LOBBY.
 */
export async function cancelCeremony(io: Server) {
  clearVoteTimer();
  await prisma.participant.deleteMany({}); // cascades to Vote
  await updateGameState({ phase: "LOBBY", currentCategoryId: null, revealStep: 0, timerEndsAt: null });
  forceParticipantsToRejoin(io);
  await broadcastState(io);
  await broadcastLobby(io);
}

export { GameFlowError };
