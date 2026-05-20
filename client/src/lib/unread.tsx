import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSocket } from './socket';
import { useAuth } from './auth';

interface UnreadContextType {
  unread: Record<string, number>;
  total: number;
  markRead: (chatId: string) => void;
  addUnread: (chatId: string) => void;
  setActiveChatId: (chatId: string | null) => void;
}

const UnreadContext = createContext<UnreadContextType | null>(null);

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setUnread({}); return; }
    const socket = getSocket();
    if (!socket) return;
    const handler = (msg: any) => {
      if (msg.senderId === user.id) return;
      if (msg.chatId === activeChatId) {
        setUnread((prev) => {
          if (!prev[msg.chatId]) return prev;
          const next = { ...prev };
          delete next[msg.chatId];
          return next;
        });
        return;
      }
      const key = msg.chatType === 'TEAM' ? msg.chatId : msg.senderId;
      setUnread((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    };
    socket.on('message:new', handler);
    return () => { socket.off('message:new', handler); };
  }, [user, activeChatId]);

  const markRead = useCallback((key: string) => {
    setUnread((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const addUnread = useCallback((key: string) => {
    setUnread((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }, []);

  const total = Object.values(unread).reduce((s, n) => s + n, 0);

  return (
    <UnreadContext.Provider value={{ unread, total, markRead, addUnread, setActiveChatId }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error('useUnread must be used within UnreadProvider');
  return ctx;
}
