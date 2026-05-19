import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  team1Id: z.string(),
  team2Id: z.string(),
  message: z.string().max(500).optional(),
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const member = await prisma.teamMember.findFirst({
    where: { teamId: parsed.data.team1Id, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member) {
    res.status(403).json({ error: "Not authorized to challenge with this team" });
    return;
  }

  const clanWar = await prisma.clanWar.create({
    data: parsed.data,
    include: {
      team1: { include: { captain: { select: { id: true, username: true } } } },
      team2: { include: { captain: { select: { id: true, username: true } } } },
    },
  });

  const team2 = await prisma.team.findUnique({ where: { id: parsed.data.team2Id } });
  if (team2) {
    await prisma.notification.create({
      data: {
        userId: team2.captainId,
        type: "clan_war_challenge",
        title: "Clan War Challenge",
        content: `Your team has been challenged to a clan war!`,
        link: `/clanwars`,
      },
    });
  }

  res.status(201).json(clanWar);
});

router.get("/", async (req: Request, res: Response) => {
  const wars = await prisma.clanWar.findMany({
    include: {
      team1: { include: { captain: { select: { id: true, username: true } } } },
      team2: { include: { captain: { select: { id: true, username: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(wars);
});

router.patch("/:id/status", authenticate, async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!["ACCEPTED", "DECLINED"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const war = await prisma.clanWar.findUnique({ where: { id: String(req.params.id) }, include: { team2: true } });
  if (!war) {
    res.status(404).json({ error: "War not found" });
    return;
  }

  const member = await prisma.teamMember.findFirst({
    where: { teamId: war.team2Id, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updated = await prisma.clanWar.update({
    where: { id: String(req.params.id) },
    data: { status },
    include: {
      team1: { include: { captain: { select: { id: true, username: true } } } },
      team2: { include: { captain: { select: { id: true, username: true } } } },
    },
  });

  res.json(updated);
});

// Clan War Looking posts
const lookingSchema = z.object({
  teamId: z.string(),
  description: z.string().min(1).max(500),
  timeText: z.string().max(100).optional(),
  dateText: z.string().max(100).optional(),
  rankReq: z.string().max(100).optional(),
  mmrReq: z.number().int().optional(),
});

router.get("/looking", async (req: Request, res: Response) => {
  const { query, minMmr, maxMmr, dateFrom, dateTo, rankReq } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};
  if (query) {
    where.team = { OR: [
      { name: { contains: query, mode: "insensitive" } },
      { tag: { contains: query, mode: "insensitive" } },
    ]};
  }
  if (rankReq) where.rankReq = rankReq;

  const posts = await prisma.clanWarLooking.findMany({
    where,
    include: {
      team: { select: { id: true, name: true, tag: true, logoUrl: true, captainId: true, _count: { select: { members: true } }, captain: { select: { id: true, username: true } } } },
      author: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let filtered = posts;
  if (minMmr) filtered = filtered.filter((p) => p.mmrReq == null || p.mmrReq >= Number(minMmr));
  if (maxMmr) filtered = filtered.filter((p) => p.mmrReq == null || p.mmrReq <= Number(maxMmr));
  if (dateFrom) filtered = filtered.filter((p) => !p.dateText || new Date(p.dateText) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter((p) => !p.dateText || new Date(p.dateText) <= new Date(dateTo));

  res.json(filtered);
});

router.post("/looking", authenticate, async (req: Request, res: Response) => {
  const parsed = lookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const member = await prisma.teamMember.findFirst({
    where: { teamId: parsed.data.teamId, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const post = await prisma.clanWarLooking.create({
    data: { ...parsed.data, authorId: req.user!.userId },
    include: {
      team: { include: { captain: { select: { id: true, username: true } }, _count: { select: { members: true } } } },
      author: { select: { id: true, username: true } },
    },
  });
  res.status(201).json(post);
});

router.delete("/looking/:id", authenticate, async (req: Request, res: Response) => {
  const post = await prisma.clanWarLooking.findUnique({ where: { id: String(req.params.id) } });
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  const member = await prisma.teamMember.findFirst({
    where: { teamId: post.teamId, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member && post.authorId !== req.user!.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  await prisma.clanWarLooking.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});

export default router;
