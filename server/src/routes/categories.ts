import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { rejectIfSetupLocked } from "../gameState.js";

export const categoriesRouter = Router();
categoriesRouter.use(requireAdmin);

categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { nominees: { orderBy: { order: "asc" } } },
  });
  res.json(categories);
});

categoriesRouter.post("/", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  const { title } = req.body as { title?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: "title_required" });
    return;
  }
  const count = await prisma.category.count();
  const category = await prisma.category.create({
    data: { title: title.trim(), order: count },
  });
  res.status(201).json(category);
});

categoriesRouter.patch("/:id", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  const { title, order } = req.body as { title?: string; order?: number };
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(order !== undefined ? { order } : {}),
    },
  });
  res.json(category);
});

categoriesRouter.delete("/:id", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

categoriesRouter.post("/:id/nominees", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  const { name, imageUrl } = req.body as { name?: string; imageUrl?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name_required" });
    return;
  }
  const count = await prisma.nominee.count({ where: { categoryId: req.params.id } });
  const nominee = await prisma.nominee.create({
    data: {
      categoryId: req.params.id,
      name: name.trim(),
      imageUrl: imageUrl ?? null,
      order: count,
    },
  });
  res.status(201).json(nominee);
});
