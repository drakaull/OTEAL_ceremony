import { prisma } from "./prisma.js";
import type { CategoryPodium, PodiumPlace } from "./realtime/types.js";

/**
 * Computes the dense ranking (1,2,3 regardless of how many are tied at a rank)
 * for a category's nominees, based on vote counts.
 */
export async function computePodium(categoryId: string): Promise<CategoryPodium> {
  const nominees = await prisma.nominee.findMany({
    where: { categoryId },
    include: { _count: { select: { votes: true } } },
    orderBy: { order: "asc" },
  });

  const totalVotes = nominees.reduce((sum, n) => sum + n._count.votes, 0);

  const byVotesDesc = [...nominees].sort((a, b) => b._count.votes - a._count.votes);

  const places: PodiumPlace[] = [];
  let rank = 0;
  let previousVotes: number | null = null;

  for (const nominee of byVotesDesc) {
    const votes = nominee._count.votes;
    if (previousVotes === null || votes !== previousVotes) {
      rank += 1;
      previousVotes = votes;
      places.push({ rank, nominees: [] });
    }
    places[places.length - 1].nominees.push({
      id: nominee.id,
      name: nominee.name,
      imageUrl: nominee.imageUrl,
      votes,
      percentage: totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100),
    });
  }

  return { categoryId, places };
}

/** The top-3 dense ranks only, in reveal order: last place of the podium first, winner last. */
export function podiumRevealOrder(podium: CategoryPodium): PodiumPlace[] {
  return [...podium.places].slice(0, 3).reverse();
}
