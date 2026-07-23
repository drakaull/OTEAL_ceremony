import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { adminRouter } from "./routes/admin.js";
import { categoriesRouter } from "./routes/categories.js";
import { nomineesRouter } from "./routes/nominees.js";
import { uploadRouter } from "./routes/upload.js";
import { exportRouter } from "./routes/export.js";
import { registerSocketHandlers } from "./realtime/socket.js";
import { UPLOADS_DIR } from "./config.js";

// This runs live during a one-off party: a crash mid-ceremony can't be "restarted later".
// Log and keep serving rather than let one unexpected error take the whole evening down.
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*" }));
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin", adminRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/nominees", nomineesRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/export", exportRouter);

// In production the built client SPA is served by this same process (one Railway
// service, no separate static host needed) — built at ../client/dist relative to
// this compiled file (server/dist/index.js).
const clientDist = path.resolve(import.meta.dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(400).json({ error: "bad_request", message: err.message });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? "*" },
});
registerSocketHandlers(io);

const port = Number(process.env.PORT ?? 4000);

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
