import { prisma } from "./prisma.js";

/** Wipes categories/nominees/participants/votes and returns the game to LOBBY, ready for a future ceremony. */
export async function resetCeremony() {
  await prisma.category.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.gameState.update({
    where: { id: "singleton" },
    data: { phase: "LOBBY", currentCategoryId: null, revealStep: 0, timerEndsAt: null },
  });
}
