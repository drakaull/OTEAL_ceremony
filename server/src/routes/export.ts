import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { requireAdmin } from "../middleware/adminAuth.js";
import { getGameState } from "../gameState.js";
import { getCeremonyRecap } from "../recap.js";
import { CeremonyReport } from "../pdf/CeremonyReport.js";
import { UPLOADS_DIR } from "../config.js";

export const exportRouter = Router();
exportRouter.use(requireAdmin);

function resolveImagePath(url: string): string | undefined {
  if (!url.startsWith("/uploads/")) return undefined;
  const absolute = path.resolve(UPLOADS_DIR, path.basename(url));
  return fs.existsSync(absolute) ? absolute : undefined;
}

exportRouter.get("/pdf", async (_req, res) => {
  const state = await getGameState();
  if (state.phase !== "RECAP" && state.phase !== "ENDED") {
    res.status(409).json({ error: "not_ready", message: "La cérémonie n'est pas encore terminée." });
    return;
  }

  const categories = await getCeremonyRecap();
  const element = React.createElement(CeremonyReport, { categories, resolveImagePath });
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="palmares-ceremonie.pdf"');
  res.send(Buffer.from(buffer));
});
