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
import { registerSocketHandlers } from "./realtime/socket.js";

const uploadsDir = path.resolve("uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*" }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin", adminRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/nominees", nomineesRouter);
app.use("/api/upload", uploadRouter);

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
