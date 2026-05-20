import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/teammates", async (req: Request, res: Response) => {
  const { rankMin, rankMax, region, position, language, query, playstyle } = req.query;

  const tagFilters: Record<string, unknown>[] = [];
  if (playstyle) {
    const tags = String(playstyle).split(",").map((t) => t.trim()).filter(Boolean);
    for (const tag of tags) {
      tagFilters.push({ playstyleTags: { contains: `"${tag}"` } });
    }
  }

  const where: Record<string, unknown> = {
    isLooking: true,
    ...(tagFilters.length > 0 ? { AND: tagFilters } : {}),
  };

  if (rankMin || rankMax) {
    where.rank = {};
    if (rankMin) (where.rank as Record<string, unknown>).gte = Number(rankMin);
    if (rankMax) (where.rank as Record<string, unknown>).lte = Number(rankMax);
  }

  if (region) {
    where.region = region;
  }

  if (position) {
    where.rolePrefs = { contains: position as string };
  }

  if (language) {
    where.languages = { contains: language };
  }

  if (query) {
    where.username = { contains: query as string, mode: "insensitive" };
  }

  const users = await prisma.user.findMany({
    where,
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
    take: 50,
    orderBy: { rank: "desc" },
  });

  const parsed = users.map((u) => ({
    ...u,
    rolePrefs: JSON.parse(u.rolePrefs || "[]"),
    languages: JSON.parse(u.languages || "[]"),
    playstyleTags: JSON.parse(u.playstyleTags || "[]"),
  }));

  res.json(parsed);
});

router.get("/teams", async (req: Request, res: Response) => {
  const { query, minRank, maxRank } = req.query;

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { name: { contains: query as string, mode: "insensitive" } },
      { tag: { contains: query as string, mode: "insensitive" } },
    ];
  }

  let teams = await prisma.team.findMany({
    where,
    include: {
      captain: { select: { id: true, username: true, avatarUrl: true, rank: true } },
      members: {
        include: { user: { select: { rank: true } } },
      },
      _count: { select: { members: true } },
    },
    take: 50,
  });

  const result = teams.map((t) => {
    const memberRanks = t.members
      .map((m) => m.user.rank ?? 0)
      .concat(t.captain.rank ?? 0);
    const avgRank = memberRanks.length > 0
      ? Math.round(memberRanks.reduce((a, b) => a + b, 0) / memberRanks.length)
      : 0;
    return {
      ...t,
      captainRank: t.captain.rank ?? 0,
      avgRank,
      currentMembers: t._count.members + 1,
    };
  });

  if (minRank || maxRank) {
    const min = Number(minRank) || 0;
    const max = Number(maxRank) || 10000;
    res.json(result.filter((t) => t.avgRank >= min && t.avgRank <= max));
  } else {
    res.json(result);
  }
});

export default router;
