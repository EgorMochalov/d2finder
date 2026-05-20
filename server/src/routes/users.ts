import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { sanitizePlaystyleTags } from "../lib/playstyleTags";

const router = Router();

router.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      teamMembers: { include: { team: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash, steamId, ...safe } = user;
  res.json({
    ...safe,
    playstyleTags: JSON.parse(safe.playstyleTags || "[]"),
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      rank: true,
      rolePrefs: true,
      region: true,
      languages: true,
      bio: true,
      playstyleTags: true,
      isLooking: true,
      lookingExpiry: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    ...user,
    playstyleTags: JSON.parse(user.playstyleTags || "[]"),
  });
});

const updateSchema = z.object({
  avatarUrl: z.string().url().optional(),
  rank: z.number().int().min(0).max(15000).optional(),
  rolePrefs: z.array(z.string()).optional(),
  region: z.string().optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(500).optional(),
  playstyleTags: z.array(z.string()).max(4).optional(),
});

router.patch("/me", authenticate, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    res.status(400).json({ error: firstError || "Invalid input" });
    return;
  }

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      if (key === "rolePrefs" || key === "languages") {
        data[key] = JSON.stringify(value);
      } else if (key === "playstyleTags") {
        data[key] = JSON.stringify(sanitizePlaystyleTags(value));
      } else {
        data[key] = value;
      }
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
  });

  const { passwordHash, ...safe } = user;
  res.json({
    ...safe,
    playstyleTags: JSON.parse(safe.playstyleTags || "[]"),
  });
});

router.post("/looking", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      isLooking: true,
      lookingExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  res.json({ isLooking: user.isLooking, lookingExpiry: user.lookingExpiry });
});

router.post("/looking/stop", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { isLooking: false, lookingExpiry: null },
  });
  res.json({ isLooking: user.isLooking });
});

export default router;
