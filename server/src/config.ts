import path from "node:path";

// In production these should point at a persistent volume (e.g. /data/uploads),
// set via env vars; locally they default to a folder next to the server code.
export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? "uploads");
