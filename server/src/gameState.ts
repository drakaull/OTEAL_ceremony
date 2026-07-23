import type { Response } from "express";
import { prisma } from "./prisma.js";

const SINGLETON_ID = "singleton";

export async function getGameState() {
  const existing = await prisma.gameState.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.gameState.create({ data: { id: SINGLETON_ID } });
}

export async function isSetupLocked() {
  const state = await getGameState();
  return state.phase !== "LOBBY";
}

/** Returns true (and writes a 409 response) if the ceremony has started and setup should be blocked. */
export async function rejectIfSetupLocked(res: Response): Promise<boolean> {
  if (await isSetupLocked()) {
    res.status(409).json({ error: "setup_locked", message: "La cérémonie a déjà démarré : configuration verrouillée." });
    return true;
  }
  return false;
}
