import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { getGameState } from "../gameState.js";
import { resetCeremony } from "../ceremonyReset.js";

export const adminRouter = Router();

adminRouter.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }
  res.json({ ok: true });
});

adminRouter.get("/status", requireAdmin, async (_req, res) => {
  const state = await getGameState();
  res.json({ phase: state.phase });
});

/** Wipes categories/nominees/participants/votes and returns to LOBBY, ready for a future ceremony. */
adminRouter.post("/reset", requireAdmin, async (_req, res) => {
  const state = await getGameState();
  if (state.phase !== "ENDED") {
    res.status(409).json({ error: "not_ended", message: "La cérémonie doit être terminée avant la remise à zéro." });
    return;
  }

  await resetCeremony();
  res.json({ ok: true });
});
