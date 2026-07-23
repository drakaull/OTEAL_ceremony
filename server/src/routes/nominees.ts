import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { rejectIfSetupLocked } from "../gameState.js";

export const nomineesRouter = Router();
nomineesRouter.use(requireAdmin);

nomineesRouter.patch("/:id", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  const { name, imageUrl, order } = req.body as { name?: string; imageUrl?: string | null; order?: number };
  const nominee = await prisma.nominee.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(order !== undefined ? { order } : {}),
    },
  });
  res.json(nominee);
});

nomineesRouter.delete("/:id", async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  await prisma.nominee.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
