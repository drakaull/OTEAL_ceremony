export type GamePhase = "LOBBY" | "INTRO" | "VOTING" | "VOTE_CLOSED" | "REVEALING" | "RECAP" | "ENDED";

export interface Nominee {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface CurrentCategory {
  id: string;
  title: string;
  nominees: Nominee[];
}

export interface PodiumNominee {
  id: string;
  name: string;
  imageUrl: string | null;
  votes: number;
  percentage: number;
}

export interface PodiumPlace {
  rank: number;
  nominees: PodiumNominee[];
}

export interface RecapEntry {
  categoryId: string;
  title: string;
  podium: PodiumPlace[];
}

export interface PublicState {
  phase: GamePhase;
  currentCategory: CurrentCategory | null;
  timerEndsAt: string | null;
  revealedPlaces: PodiumPlace[];
  totalPlaces: number;
  recap: RecapEntry[];
}

export interface VotesProgress {
  total: number;
  voted: number;
  voterPseudos: string[];
}

export interface WelcomePayload {
  participantId: string;
  pseudo: string;
  token: string;
  state: PublicState;
  myVote: string | null;
}

export type JoinAck =
  | { status: "joined" }
  | { status: "taken" }
  | { status: "reclaim_available"; participantId: string; pseudo: string }
  | { status: "error"; message: string };

export type SimpleAck = { status: "ok" } | { status: "error"; message: string };
