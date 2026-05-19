import express from "express";
import cors from "cors";
import path from "path";
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

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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
