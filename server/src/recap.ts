import { prisma } from "./prisma.js";
import { computePodium } from "./podium.js";

export interface CategoryRecap {
  categoryId: string;
  title: string;
  podium: Awaited<ReturnType<typeof computePodium>>["places"];
}

/** Final top-3 podium for every category, in ceremony order. */
export async function getCeremonyRecap(): Promise<CategoryRecap[]> {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return Promise.all(
    categories.map(async (c) => {
      const podium = await computePodium(c.id);
      return { categoryId: c.id, title: c.title, podium: podium.places.slice(0, 3) };
    }),
  );
}
