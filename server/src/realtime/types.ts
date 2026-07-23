export type GamePhase =
  | "LOBBY"
  | "INTRO"
  | "VOTING"
  | "VOTE_CLOSED"
  | "REVEALING"
  | "RECAP"
  | "ENDED";

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

export interface CategoryPodium {
  categoryId: string;
  places: PodiumPlace[];
}
