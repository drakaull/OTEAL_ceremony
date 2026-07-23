import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = req.header("x-admin-password");
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}
