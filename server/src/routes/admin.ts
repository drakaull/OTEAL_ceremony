import { Router } from "express";

export const adminRouter = Router();

adminRouter.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }
  res.json({ ok: true });
});
