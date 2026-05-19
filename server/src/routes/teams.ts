import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const createTeamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(30, "Name too long"),
  tag: z.string().min(2, "Tag must be at least 2 characters").max(6, "Tag too long").regex(/^[A-Za-z0-9\u0400-\u04FF]+$/, "Tag: only letters and numbers"),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
});

function getFirstError(error: any): string {
  const fieldErrors = error?.flatten?.()?.fieldErrors;
  if (fieldErrors) {
    const values = Object.values(fieldErrors).flat();
    return (values[0] as string) || "Invalid input";
  }
  return error?.message || "Invalid input";
}

router.post("/", authenticate, async (req: Request, res: Response) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: getFirstError(parsed.error) });
    return;
  }

  const captainId = req.user!.userId;

  const existing = await prisma.team.findFirst({
    where: { OR: [{ name: parsed.data.name }, { tag: parsed.data.tag }] },
  });
  if (existing) {
    res.status(409).json({ error: "Team name or tag already taken" });
    return;
  }

  const team = await prisma.team.create({
    data: {
      ...parsed.data,
      captainId,
      members: {
        create: { userId: captainId, role: "CAPTAIN" },
      },
    },
    include: { members: { include: { user: true } }, captain: true },
  });

  res.status(201).json(team);
});

router.get("/", async (req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    include: {
      captain: { select: { id: true, username: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
    },
  });
  res.json(teams);
});

router.get("/:id", async (req: Request, res: Response) => {
  const team = await prisma.team.findUnique({
    where: { id: String(req.params.id) },
    include: {
      captain: { select: { id: true, username: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true, rank: true } } } },
      joinRequests: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
    },
  });
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(team);
});

router.post("/:id/invite", authenticate, async (req: Request, res: Response) => {
  const { userId } = req.body;
  const teamId = String(req.params.id);

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const existing = await prisma.teamInvitation.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (existing) {
    res.status(409).json({ error: "Invitation already exists" });
    return;
  }

  const invitation = await prisma.teamInvitation.create({
    data: { teamId, userId },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "team_invite",
      title: "Team Invitation",
      content: `You've been invited to join a team`,
      link: `/teams/${teamId}`,
    },
  });

  res.status(201).json(invitation);
});

router.post("/:id/join-request", authenticate, async (req: Request, res: Response) => {
  const teamId = String(req.params.id);
  const { message } = req.body;

  const existingReq = await prisma.teamJoinRequest.findUnique({
    where: { teamId_userId: { teamId, userId: req.user!.userId } },
  });
  if (existingReq) {
    res.status(409).json({ error: "Request already exists" });
    return;
  }

  const request = await prisma.teamJoinRequest.create({
    data: { teamId, userId: req.user!.userId, message },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (team) {
    await prisma.notification.create({
      data: {
        userId: team.captainId,
        type: "join_request",
        title: "Join Request",
        content: `Someone wants to join your team`,
        link: `/teams/${teamId}`,
      },
    });
  }

  res.status(201).json(request);
});

router.post("/:id/join-request/:requestId/:action", authenticate, async (req: Request, res: Response) => {
  const action = String(req.params.action);

  if (action !== "accept" && action !== "decline") {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const joinRequest = await prisma.teamJoinRequest.findUnique({
    where: { id: String(req.params.requestId) },
  });
  if (!joinRequest) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const joinRequestTeam = await prisma.team.findUnique({ where: { id: joinRequest.teamId } });

  const member = await prisma.teamMember.findFirst({
    where: { teamId: joinRequest.teamId, userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
  });
  if (!member) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  if (action === "accept") {
    await prisma.$transaction([
      prisma.teamMember.create({ data: { teamId: joinRequest.teamId, userId: joinRequest.userId } }),
      prisma.teamJoinRequest.update({ where: { id: joinRequest.id }, data: { status: "ACCEPTED" } }),
      prisma.notification.create({
        data: {
          userId: joinRequest.userId,
          type: "join_accepted",
          title: "Request Accepted",
          content: `Your request to join ${joinRequestTeam!.name} was accepted!`,
          link: `/teams/${joinRequest.teamId}`,
        },
      }),
    ]);
  } else {
    await prisma.teamJoinRequest.update({ where: { id: joinRequest.id }, data: { status: "DECLINED" } });
  }

  res.json({ success: true });
});

router.delete("/:id/member/:userId", authenticate, async (req: Request, res: Response) => {
  const member = await prisma.teamMember.findFirst({
    where: { teamId: String(req.params.id), userId: req.user!.userId, role: "CAPTAIN" },
  });
  if (!member) {
    res.status(403).json({ error: "Only captain can remove members" });
    return;
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: String(req.params.id), userId: String(req.params.userId) } },
  });
  res.json({ success: true });
});

router.post("/:id/leave", authenticate, async (req: Request, res: Response) => {
  const teamId = String(req.params.id);
  const userId = req.user!.userId;

  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  if (!member) {
    res.status(404).json({ error: "Not a member of this team" });
    return;
  }
  if (member.role === "CAPTAIN") {
    res.status(400).json({ error: "Captain cannot leave. Transfer captain or disband the team." });
    return;
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });
  res.json({ success: true });
});

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  const teamId = String(req.params.id);

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: req.user!.userId, role: "CAPTAIN" },
  });
  if (!member) {
    res.status(403).json({ error: "Only captain can disband the team" });
    return;
  }

  await prisma.team.delete({ where: { id: teamId } });
  res.json({ success: true });
});

router.get("/my/invitations", authenticate, async (req: Request, res: Response) => {
  const invitations = await prisma.teamInvitation.findMany({
    where: { userId: req.user!.userId, status: "PENDING" },
    include: {
      team: { select: { id: true, name: true, tag: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(invitations);
});

router.get("/my/sent-invitations", authenticate, async (req: Request, res: Response) => {
  const myTeamIds = await prisma.teamMember.findMany({
    where: { userId: req.user!.userId, role: { in: ["CAPTAIN", "VICE_CAPTAIN"] } },
    select: { teamId: true },
  });

  const invitations = await prisma.teamInvitation.findMany({
    where: {
      teamId: { in: myTeamIds.map((t) => t.teamId) },
      status: "PENDING",
    },
    include: {
      team: { select: { id: true, name: true, tag: true, logoUrl: true } },
      user: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(invitations);
});

router.get("/my/requests", authenticate, async (req: Request, res: Response) => {
  const requests = await prisma.teamJoinRequest.findMany({
    where: { userId: req.user!.userId, status: "PENDING" },
    include: {
      team: { select: { id: true, name: true, tag: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
});

router.patch("/invitations/:id/:action", authenticate, async (req: Request, res: Response) => {
  const action = String(req.params.action);
  if (action !== "accept" && action !== "decline") {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!invitation || invitation.userId !== req.user!.userId) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invitation.status !== "PENDING") {
    res.status(400).json({ error: "Invitation already processed" });
    return;
  }

  if (action === "accept") {
    await prisma.$transaction([
      prisma.teamMember.create({ data: { teamId: invitation.teamId, userId: invitation.userId } }),
      prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } }),
    ]);
  } else {
    await prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: "DECLINED" } });
  }

  res.json({ success: true });
});

router.delete("/requests/:id", authenticate, async (req: Request, res: Response) => {
  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!request || request.userId !== req.user!.userId) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  await prisma.teamJoinRequest.update({
    where: { id: request.id },
    data: { status: "CANCELLED" },
  });
  res.json({ success: true });
});

router.delete("/invitations/:id", authenticate, async (req: Request, res: Response) => {
  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: String(req.params.id) },
    include: { team: true },
  });
  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }
  if (invitation.team.captainId !== req.user!.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.teamInvitation.update({
    where: { id: invitation.id },
    data: { status: "CANCELLED" },
  });
  res.json({ success: true });
});

export default router;
