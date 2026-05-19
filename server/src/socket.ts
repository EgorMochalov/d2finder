import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import prisma from "./lib/prisma";
import { verifyToken } from "./lib/jwt";

const onlineUsers = new Map<string, string>();

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.engine.on("initial_headers", (headers: Record<string, string>) => {
    headers["Access-Control-Allow-Origin"] = "*";
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const user = verifyToken(token);
      (socket as any).userId = user.userId;
      (socket as any).username = user.username;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    console.log(`[WS] User connected: ${username} (${userId})`);

    onlineUsers.set(userId, username);
    io.emit("online:update", Array.from(onlineUsers.keys()));

    socket.join(`user:${userId}`);

    socket.on("join:chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("leave:chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("message:send", async (data: { chatType: string; chatId: string; content: string }) => {
      const message = await prisma.message.create({
        data: {
          chatType: data.chatType as any,
          chatId: data.chatId,
          senderId: userId,
          content: data.content,
        },
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
        },
      });

      io.to(`chat:${data.chatId}`).emit("message:new", message);

      if (data.chatType === "PRIVATE") {
        const otherUserId = data.chatId.replace(userId, "").replace("_", "");
        io.to(`user:${otherUserId}`).emit("notification", {
          type: "new_message",
          title: `New message from ${username}`,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WS] User disconnected: ${username}`);
      onlineUsers.delete(userId);
      io.emit("online:update", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}

export function getOnlineUsers(): Map<string, string> {
  return onlineUsers;
}
