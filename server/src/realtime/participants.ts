import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";

export type JoinResult =
  | { status: "new"; participant: { id: string; pseudo: string; token: string } }
  | { status: "reclaim_available"; participantId: string; pseudo: string }
  | { status: "taken" };

/**
 * Attempts to join with a fresh pseudo (no reconnection token on this device).
 * - Unused pseudo -> creates a new participant.
 * - Pseudo belongs to a currently disconnected participant -> offers reclaim (client must confirm).
 * - Pseudo belongs to a currently connected participant -> rejected as taken.
 */
export async function tryJoinByPseudo(pseudo: string): Promise<JoinResult> {
  const trimmed = pseudo.trim();
  const existing = await prisma.participant.findUnique({ where: { pseudo: trimmed } });

  if (!existing) {
    const participant = await prisma.participant.create({
      data: { pseudo: trimmed, token: randomUUID(), connected: true },
    });
    return { status: "new", participant };
  }

  if (existing.connected) {
    return { status: "taken" };
  }

  return { status: "reclaim_available", participantId: existing.id, pseudo: existing.pseudo };
}

/** Confirms a reclaim offered by tryJoinByPseudo, issuing a fresh token for this device. */
export async function reclaimParticipant(participantId: string) {
  return prisma.participant.update({
    where: { id: participantId },
    data: { connected: true, token: randomUUID() },
  });
}

/** Restores a session from a token stored on the client (same browser/device reconnecting). */
export async function reconnectByToken(token: string) {
  const participant = await prisma.participant.findUnique({ where: { token } });
  if (!participant) return null;
  return prisma.participant.update({
    where: { id: participant.id },
    data: { connected: true },
  });
}

export async function markDisconnected(participantId: string) {
  // updateMany (not update): the participant may have already been wiped by an admin
  // reset while this socket was still connected — that must not throw.
  await prisma.participant.updateMany({
    where: { id: participantId },
    data: { connected: false },
  });
}

export async function listConnectedPseudos() {
  const participants = await prisma.participant.findMany({
    where: { connected: true },
    select: { pseudo: true },
    orderBy: { createdAt: "asc" },
  });
  return participants.map((p) => p.pseudo);
}
