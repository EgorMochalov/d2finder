import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authenticate } from "../middleware/auth";
import prisma from "../lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error("Only images allowed"));
  },
});

const router = Router();

function fullUrl(req: Request, filePath: string): string {
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}${filePath}`;
}

router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const fullAvatarUrl = fullUrl(req, avatarUrl);

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatarUrl: fullAvatarUrl },
    });

    res.json({ avatarUrl: fullAvatarUrl });
  }
);

router.post(
  "/team-logo",
  authenticate,
  upload.single("logo"),
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const teamId = req.body.teamId as string;
    if (!teamId) return res.status(400).json({ error: "teamId required" });

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (team.captainId !== req.user!.userId) return res.status(403).json({ error: "Only captain can upload logo" });

    const logoUrl = `/uploads/${req.file.filename}`;
    const fullLogoUrl = fullUrl(req, logoUrl);
    await prisma.team.update({ where: { id: teamId }, data: { logoUrl: fullLogoUrl } });
    res.json({ logoUrl: fullLogoUrl });
  }
);

export default router;
