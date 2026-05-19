import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const [users, teams] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
  ]);
  res.json({ users, teams });
});

export default router;
