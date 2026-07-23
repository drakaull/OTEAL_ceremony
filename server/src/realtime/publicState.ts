import { prisma } from "../prisma.js";
import { getGameState } from "../gameState.js";
import { computePodium, podiumRevealOrder } from "../podium.js";

export async function buildPublicState() {
  const state = await getGameState();

  const currentCategory = state.currentCategoryId
    ? await prisma.category.findUnique({
        where: { id: state.currentCategoryId },
        include: { nominees: { orderBy: { order: "asc" } } },
      })
    : null;

  let revealedPlaces: Awaited<ReturnType<typeof podiumRevealOrder>> = [];
  let totalPlaces = 0;
  if (currentCategory && (state.phase === "REVEALING" || state.phase === "VOTE_CLOSED")) {
    const podium = await computePodium(currentCategory.id);
    const order = podiumRevealOrder(podium);
    totalPlaces = order.length;
    revealedPlaces = order.slice(0, state.revealStep);
  }

  let recap: Array<{ categoryId: string; title: string; podium: Awaited<ReturnType<typeof computePodium>>["places"] }> = [];
  if (state.phase === "RECAP" || state.phase === "ENDED") {
    const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
    recap = await Promise.all(
      categories.map(async (c) => {
        const podium = await computePodium(c.id);
        return { categoryId: c.id, title: c.title, podium: podium.places.slice(0, 3) };
      }),
    );
  }

  return {
    phase: state.phase,
    currentCategory: currentCategory
      ? {
          id: currentCategory.id,
          title: currentCategory.title,
          nominees: currentCategory.nominees.map((n) => ({ id: n.id, name: n.name, imageUrl: n.imageUrl })),
        }
      : null,
    timerEndsAt: state.timerEndsAt,
    revealedPlaces,
    totalPlaces,
    recap,
  };
}

export type PublicState = Awaited<ReturnType<typeof buildPublicState>>;
