import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);
const port = Number(process.env.PORT ?? 4000);

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
