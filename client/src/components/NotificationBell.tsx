import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { getSocket } from '../lib/socket';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationBell() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setNotifs([]);
      return;
    }
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const onNotif = () => loadNotifs();
    socket.on('notification', onNotif);
    return () => { socket.off('notification', onNotif); };
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifs() {
    try { setNotifs(await api.notifications.list()); } catch {}
  }

  async function handleRead(id: string) {
    try { await api.notifications.read(id); loadNotifs(); } catch {}
  }

  async function handleReadAll() {
    try { await api.notifications.readAll(); loadNotifs(); } catch {}
  }

  const unread = notifs.filter((n: any) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative w-9 h-9 rounded-full glass-strong flex items-center justify-center text-muted hover:text-text transition hover:scale-105">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shadow-glow" style={{ fontSize: '9px', lineHeight: 1 }}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl overflow-hidden shadow-2xl z-50 animate-slide-up border border-white/5">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-text text-sm font-semibold">{t('notif.title')}</span>
            {unread > 0 && <button onClick={handleReadAll} className="text-[11px] text-accent hover:underline flex items-center gap-1"><CheckCheck size={12} /> {t('notif.read_all')}</button>}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">{t('notif.none')}</div>
            ) : (
              notifs.slice(0, 10).map((n: any) => (
                <Link key={n.id} to={n.link || '#'} onClick={() => { if (!n.read) handleRead(n.id); setOpen(false); }}
                  className={`flex items-start gap-3 px-4 py-3 transition glass-hover ${n.read ? '' : 'bg-accent-dim/30'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs ${n.read ? 'text-muted' : 'text-text font-medium'}`}>{n.title}</p>
                    {n.content && <p className="text-muted/60 text-[10px] mt-0.5">{n.content}</p>}
                  </div>
                </Link>
              ))
            )}
          </div>
          {notifs.length > 10 && (
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="block text-center text-xs text-accent py-3 border-t border-white/5 hover:bg-surface-hover transition">
              {t('notif.see_all')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
