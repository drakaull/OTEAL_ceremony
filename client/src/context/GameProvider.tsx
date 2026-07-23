import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { socket } from "../lib/socket";
import type { JoinAck, PublicState, SimpleAck, VotesProgress, WelcomePayload } from "../types";

const TOKEN_KEY = "oteal_participant_token";

type JoinStatus = "idle" | "checking-token" | "need-pseudo" | "reclaim-offer" | "taken" | "joined" | "error";

interface ReclaimOffer {
  participantId: string;
  pseudo: string;
}

interface GameContextValue {
  connected: boolean;
  state: PublicState | null;
  lobbyParticipants: string[];
  votesProgress: VotesProgress | null;

  participant: { id: string; pseudo: string } | null;
  joinStatus: JoinStatus;
  reclaimOffer: ReclaimOffer | null;
  joinError: string | null;
  myVote: string | null;
  join: (pseudo: string) => void;
  confirmReclaim: () => void;
  cancelReclaim: () => void;
  castVote: (categoryId: string, nomineeId: string) => Promise<SimpleAck>;

  isAdmin: boolean;
  adminError: string | null;
  authenticateAdmin: (password: string) => Promise<boolean>;
  adminAction: (event: "admin:startCeremony" | "admin:startVoting" | "admin:reveal" | "admin:nextCategory" | "admin:endCeremony") => Promise<SimpleAck>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(socket.connected);
  const [state, setState] = useState<PublicState | null>(null);
  const [lobbyParticipants, setLobbyParticipants] = useState<string[]>([]);
  const [votesProgress, setVotesProgress] = useState<VotesProgress | null>(null);

  const [participant, setParticipant] = useState<{ id: string; pseudo: string } | null>(null);
  const [joinStatus, setJoinStatus] = useState<JoinStatus>("idle");
  const [reclaimOffer, setReclaimOffer] = useState<ReclaimOffer | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const attemptedTokenReconnect = useRef(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && !attemptedTokenReconnect.current) {
        attemptedTokenReconnect.current = true;
        setJoinStatus("checking-token");
        socket.emit("participant:reconnectToken", { token }, (ack: { status: string }) => {
          if (ack.status !== "joined") {
            localStorage.removeItem(TOKEN_KEY);
            setJoinStatus("need-pseudo");
          }
        });
      } else if (!token) {
        setJoinStatus("need-pseudo");
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onWelcome(payload: WelcomePayload) {
      localStorage.setItem(TOKEN_KEY, payload.token);
      setParticipant({ id: payload.participantId, pseudo: payload.pseudo });
      setState(payload.state);
      setMyVote(payload.myVote);
      setJoinStatus("joined");
      setJoinError(null);
      setReclaimOffer(null);
    }
    function onStateUpdate(next: PublicState) {
      setState(next);
    }
    function onLobby(pseudos: string[]) {
      setLobbyParticipants(pseudos);
    }
    function onVotesProgress(progress: VotesProgress) {
      setVotesProgress(progress);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("participant:welcome", onWelcome);
    socket.on("state:update", onStateUpdate);
    socket.on("lobby:participants", onLobby);
    socket.on("votes:progress", onVotesProgress);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("participant:welcome", onWelcome);
      socket.off("state:update", onStateUpdate);
      socket.off("lobby:participants", onLobby);
      socket.off("votes:progress", onVotesProgress);
    };
  }, []);

  // Reset per-category vote when the current category changes.
  useEffect(() => {
    if (!state?.currentCategory) setMyVote(null);
  }, [state?.currentCategory?.id]);

  function join(pseudo: string) {
    setJoinError(null);
    socket.emit("participant:join", { pseudo }, (ack: JoinAck) => {
      if (ack.status === "taken") {
        setJoinStatus("taken");
      } else if (ack.status === "reclaim_available") {
        setReclaimOffer({ participantId: ack.participantId, pseudo: ack.pseudo });
        setJoinStatus("reclaim-offer");
      } else if (ack.status === "error") {
        setJoinError(ack.message);
        setJoinStatus("need-pseudo");
      }
      // "joined" is handled by the participant:welcome event.
    });
  }

  function confirmReclaim() {
    if (!reclaimOffer) return;
    socket.emit("participant:reclaimConfirm", { participantId: reclaimOffer.participantId }, (ack: JoinAck) => {
      if (ack.status === "error") {
        setJoinError(ack.message);
        setJoinStatus("need-pseudo");
        setReclaimOffer(null);
      }
    });
  }

  function cancelReclaim() {
    setReclaimOffer(null);
    setJoinStatus("need-pseudo");
  }

  function castVote(categoryId: string, nomineeId: string): Promise<SimpleAck> {
    return new Promise((resolve) => {
      socket.emit("vote:cast", { categoryId, nomineeId }, (ack: SimpleAck) => {
        if (ack.status === "ok") setMyVote(nomineeId);
        resolve(ack);
      });
    });
  }

  function authenticateAdmin(password: string): Promise<boolean> {
    return new Promise((resolve) => {
      socket.emit("admin:authenticate", { password }, (ack: SimpleAck) => {
        if (ack.status === "ok") {
          setIsAdmin(true);
          setAdminError(null);
          resolve(true);
        } else {
          setAdminError(ack.message);
          resolve(false);
        }
      });
    });
  }

  function adminAction(event: "admin:startCeremony" | "admin:startVoting" | "admin:reveal" | "admin:nextCategory" | "admin:endCeremony"): Promise<SimpleAck> {
    return new Promise((resolve) => {
      socket.emit(event, {}, (ack: SimpleAck) => {
        if (ack.status === "error") setAdminError(ack.message);
        resolve(ack);
      });
    });
  }

  const value: GameContextValue = {
    connected,
    state,
    lobbyParticipants,
    votesProgress,
    participant,
    joinStatus,
    reclaimOffer,
    joinError,
    myVote,
    join,
    confirmReclaim,
    cancelReclaim,
    castVote,
    isAdmin,
    adminError,
    authenticateAdmin,
    adminAction,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
