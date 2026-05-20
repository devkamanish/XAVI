import { Server as SocketServer } from "socket.io";
import { Server as HTTPServer } from "http";
import config from "../config";

export const setupSocket = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join organization room for scoped real-time updates
    socket.on("join:org", (orgId: string) => {
      socket.join(orgId);
      console.log(`👤 Socket ${socket.id} joined org: ${orgId}`);
    });

    // Leave organization room
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
