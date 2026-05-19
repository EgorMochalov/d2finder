import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (req: Request, res: Response) => {
  const blocks = await prisma.blockedUser.findMany({
    where: { blockerId: req.user!.userId },
    include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
  });
  res.json(blocks);
});

router.post("/:userId", authenticate, async (req: Request, res: Response) => {
  const blockedId = String(req.params.userId);
  if (blockedId === req.user!.userId) {
    res.status(400).json({ error: "Cannot block yourself" });
    return;
  }
  const existing = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId: req.user!.userId, blockedId } },
  });
  if (existing) {
    res.status(409).json({ error: "Already blocked" });
    return;
  }
  const block = await prisma.blockedUser.create({
    data: { blockerId: req.user!.userId, blockedId },
    include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
  });
  res.status(201).json(block);
});

router.delete("/:userId", authenticate, async (req: Request, res: Response) => {
  const blockedId = String(req.params.userId);
  await prisma.blockedUser.deleteMany({
    where: { blockerId: req.user!.userId, blockedId },
  });
  res.json({ success: true });
});

export default router;
