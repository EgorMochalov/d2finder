import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import prisma from "./lib/prisma";
import { verifyToken } from "./lib/jwt";
import { isOriginAllowed } from "./lib/cors";
import {
  MAX_MESSAGE_LENGTH,
  privateChatPeerId,
  isValidPrivateChatId,
  teamIdFromChatId,
} from "./lib/chat";

const onlineUsers = new Map<string, string>();

async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return !!member;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        cb(null, isOriginAllowed(origin));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
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
      try {
        const content = data.content?.trim();
        if (!content || content.length > MAX_MESSAGE_LENGTH) return;

        if (data.chatType === "PRIVATE") {
          if (!isValidPrivateChatId(data.chatId, userId)) return;

          const otherId = privateChatPeerId(data.chatId, userId);
          const blocked = await prisma.blockedUser.findFirst({
            where: {
              OR: [
                { blockerId: userId, blockedId: otherId },
                { blockerId: otherId, blockedId: userId },
              ],
            },
          });
          if (blocked) return;
        }

        if (data.chatType === "TEAM") {
          const teamId = teamIdFromChatId(data.chatId);
          if (!teamId || !(await isTeamMember(teamId, userId))) return;
        }

        const message = await prisma.message.create({
          data: {
            chatType: data.chatType as "PRIVATE" | "TEAM",
            chatId: data.chatId,
            senderId: userId,
            content,
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
          },
        });

        io.to(`chat:${data.chatId}`).emit("message:new", message);

        if (data.chatType === "PRIVATE") {
          const otherUserId = privateChatPeerId(data.chatId, userId);
          if (otherUserId) {
            io.to(`user:${otherUserId}`).emit("notification", {
              type: "new_message",
              title: `New message from ${username}`,
            });
          }
        }
      } catch (err) {
        console.error("[WS] message:send error:", err);
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("online:update", Array.from(onlineUsers.keys()));
    });
  });

  return io;
}

export function getOnlineUsers(): Map<string, string> {
  return onlineUsers;
}
