import express from "express";
import cors from "cors";
import path from "path";
import { isOriginAllowed } from "./lib/cors";
import { createServer } from "http";
import prisma from "./lib/prisma";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import teamRoutes from "./routes/teams";
import searchRoutes from "./routes/search";
import notificationRoutes from "./routes/notifications";
import clanWarRoutes from "./routes/clanwars";
import chatRoutes from "./routes/chats";
import blockRoutes from "./routes/blocks";
import statsRoutes from "./routes/stats";
import uploadRoutes from "./routes/upload";
import { setupSocket } from "./socket";
import { startCronJobs } from "./cron";
import { errorHandler } from "./middleware/errorHandler";
import { seed } from "./seed";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

app.use(cors({
  origin: (origin, cb) => {
    cb(null, isOriginAllowed(origin));
  },
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/clanwars", clanWarRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

app.post("/api/seed", async (req, res) => {
  const key = req.headers["x-seed-key"];
  if (!key || key !== process.env.SEED_KEY) {
    return res.status(403).json({ error: "Invalid seed key" });
  }
  try {
    await seed();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

setupSocket(httpServer);
startCronJobs();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
