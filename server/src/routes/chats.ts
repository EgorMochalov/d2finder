import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/team/:teamId", authenticate, async (req: Request, res: Response) => {
  const teamId = String(req.params.teamId);
  const chatId = `team:${teamId}`;

  const messages = await prisma.message.findMany({
    where: { chatType: "TEAM", chatId },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  res.json({ chatId, messages });
});

router.get("/private/:userId", authenticate, async (req: Request, res: Response) => {
  const meId = req.user!.userId;
  const otherId = String(req.params.userId);
  const chatId = [meId, otherId].sort().join("_");

  const messages = await prisma.message.findMany({
    where: { chatType: "PRIVATE", chatId },
    include: {
      sender: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  res.json({ chatId, messages, otherUserId: otherId });
});

router.get("/contacts", authenticate, async (req: Request, res: Response) => {
  const meId = req.user!.userId;

  const messages = await prisma.message.findMany({
    where: { chatType: "PRIVATE", chatId: { contains: meId } },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const contactMap = new Map<string, { userId: string; username: string; lastMessage: string; lastTime: Date }>();

  for (const msg of messages) {
    const ids = msg.chatId.split("_");
    const otherId = ids[0] === meId ? ids[1] : ids[0];
    if (otherId === meId) continue;
    if (!contactMap.has(otherId)) {
      const otherUser = msg.sender.id === otherId ? msg.sender : null;
      contactMap.set(otherId, {
        userId: otherId,
        username: otherUser?.username || "Unknown",
        lastMessage: msg.content,
        lastTime: msg.createdAt,
      });
    }
  }

  const contacts = await Promise.all(
    Array.from(contactMap.entries()).map(async ([id, contact]) => {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, avatarUrl: true },
      });
      return { ...contact, username: user?.username || contact.username };
    })
  );

  res.json(contacts);
});

export default router;
