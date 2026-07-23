/** In-memory bookkeeping of live socket connections. Not persisted: rebuilt as clients (re)join. */

const socketIdToParticipantId = new Map<string, string>();
const participantIdToSocketId = new Map<string, string>();
const adminSocketIds = new Set<string>();

export function linkSocketToParticipant(socketId: string, participantId: string) {
  socketIdToParticipantId.set(socketId, participantId);
  participantIdToSocketId.set(participantId, socketId);
}

export function unlinkSocket(socketId: string): string | undefined {
  const participantId = socketIdToParticipantId.get(socketId);
  socketIdToParticipantId.delete(socketId);
  adminSocketIds.delete(socketId);
  if (participantId && participantIdToSocketId.get(participantId) === socketId) {
    participantIdToSocketId.delete(participantId);
  }
  return participantId;
}

export function getParticipantIdForSocket(socketId: string): string | undefined {
  return socketIdToParticipantId.get(socketId);
}

export function getSocketIdForParticipant(participantId: string): string | undefined {
  return participantIdToSocketId.get(participantId);
}

export function markSocketAsAdmin(socketId: string) {
  adminSocketIds.add(socketId);
}

export function isSocketAdmin(socketId: string): boolean {
  return adminSocketIds.has(socketId);
}
