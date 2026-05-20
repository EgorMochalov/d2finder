import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth';
import { SOCKET_URL } from './config';

const socketRef = { current: null as Socket | null };
const onlineUsersRef = { current: new Set<string>() };

export function useSocket() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!SOCKET_URL) {
      console.error('[WS] VITE_SOCKET_URL не задан');
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on('online:update', (userIds: string[]) => {
      onlineUsersRef.current = new Set(userIds);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef.current;
}

export function getSocket() {
  return socketRef.current;
}

export function useOnlineUsers() {
  const [online, setOnline] = useState<Set<string>>(onlineUsersRef.current);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (userIds: string[]) => {
      onlineUsersRef.current = new Set(userIds);
      setOnline(new Set(userIds));
    };

    socket.on('online:update', handler);
    return () => { socket.off('online:update', handler); };
  }, []);

  return online;
}

export function isOnline(userId: string): boolean {
  return onlineUsersRef.current.has(userId);
}
