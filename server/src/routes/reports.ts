import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const createSchema = z.object({
  reportedUserId: z.string().optional(),
  reportedTeamId: z.string().optional(),
  reason: z.enum(["SPAM", "HARASSMENT", "IMPERSONATION", "CHEATING", "INAPPROPRIATE", "OTHER"]),
  description: z.string().max(1000).optional(),
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { reportedUserId, reportedTeamId, reason, description } = parsed.data;

  if (!reportedUserId && !reportedTeamId) {
    res.status(400).json({ error: "Specify reportedUserId or reportedTeamId" });
    return;
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user!.userId,
      reportedUserId,
      reportedTeamId,
      reason,
      description,
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "new_report",
      title: `New report: ${reason}`,
      content: description?.slice(0, 100),
      link: "/admin/reports",
    })),
  });

  res.status(201).json(report);
});

router.get("/", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, username: true, avatarUrl: true } },
      reportedUser: { select: { id: true, username: true, avatarUrl: true } },
      reportedTeam: { select: { id: true, name: true, tag: true } },
    },
  });

  res.json(reports);
});

router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { status } = req.body;
  if (!["RESOLVED", "DISMISSED"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const report = await prisma.report.update({
    where: { id: String(req.params.id) },
    data: { status },
  });

  res.json(report);
});

export default router;
