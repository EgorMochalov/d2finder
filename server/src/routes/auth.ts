import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { signToken } from "../lib/jwt";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Zа-яА-Я0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  login: z.string(),
  password: z.string(),
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors).flat()[0];
    res.status(400).json({ error: firstError || "Invalid input" });
    return;
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    res.status(409).json({ error: "Username or email already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = signToken({ userId: user.id, username: user.username });

  res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  const { login, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: login }, { email: login }] },
  });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, username: user.username });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
});

export default router;
