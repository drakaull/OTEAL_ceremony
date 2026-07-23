import { prisma } from "../prisma.js";
import { getGameState } from "../gameState.js";

export class VoteError extends Error {}

/** Casts or changes a participant's vote for the current category. Only allowed while voting is open. */
export async function castVote(participantId: string, categoryId: string, nomineeId: string) {
  const state = await getGameState();
  if (state.phase !== "VOTING" || state.currentCategoryId !== categoryId) {
    throw new VoteError("Le vote n'est pas ouvert pour cette catégorie.");
  }

  const nominee = await prisma.nominee.findUnique({ where: { id: nomineeId } });
  if (!nominee || nominee.categoryId !== categoryId) {
    throw new VoteError("Nommé invalide pour cette catégorie.");
  }

  await prisma.vote.upsert({
    where: { participantId_categoryId: { participantId, categoryId } },
    create: { participantId, categoryId, nomineeId },
    update: { nomineeId },
  });
}
