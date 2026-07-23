import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "../middleware/adminAuth.js";
import { rejectIfSetupLocked } from "../gameState.js";

export const uploadRouter = Router();
uploadRouter.use(requireAdmin);

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve("uploads")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("unsupported_file_type"));
      return;
    }
    cb(null, true);
  },
});

uploadRouter.post("/", upload.single("image"), async (req, res) => {
  if (await rejectIfSetupLocked(res)) return;
  if (!req.file) {
    res.status(400).json({ error: "file_required" });
    return;
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
