import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useOrg } from "./OrgContext";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const { currentOrg } = useOrg();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect socket
    if (!socketRef.current) {
      socketRef.current = io(window.location.origin, {
        transports: ["websocket", "polling"],
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  // Join/leave org rooms when switching orgs
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentOrg) return;

    socket.emit("join:org", currentOrg._id);

    return () => {
      socket.emit("leave:org", currentOrg._id);
    };
  }, [currentOrg]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket | null => {
  const { socket } = useContext(SocketContext);
  return socket;
};
