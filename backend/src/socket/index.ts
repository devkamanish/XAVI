import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import config from "../config";
import { verifyAccessToken } from "../utils/jwt";
import Membership from "../models/Membership";

export const setupSocket = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"],
    },
  });

  
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyAccessToken(token as string);
      socket.data = socket.data || {};
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    
    socket.on("join:org", async (orgId: string) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
          console.warn(`⚠️ Security warning: Socket ${socket.id} attempted to join room without userId`);
          return;
        }

        
        const membership = await Membership.findOne({
          user: userId,
          organization: orgId,
          status: "active",
        });

        if (!membership) {
          console.warn(`⚠️ Security warning: Socket ${socket.id} (user: ${userId}) attempted unauthorized room join for org: ${orgId}`);
          socket.emit("error", { message: "Unauthorized to join this room" });
          return;
        }

        socket.join(orgId);
        console.log(`👤 Socket ${socket.id} joined org: ${orgId}`);
      } catch (error) {
        console.error("Socket join:org error:", error);
      }
    });

    
    socket.on("leave:org", (orgId: string) => {
      socket.leave(orgId);
      console.log(`👤 Socket ${socket.id} left org: ${orgId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
