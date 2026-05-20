import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function NotificationsPage() {
  const { t } = useI18n();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifs(); }, []);

  async function loadNotifs() {
    setLoading(true);
    try { setNotifs(await api.notifications.list()); } catch {}
    setLoading(false);
  }

  async function handleRead(id: string) {
    try { await api.notifications.read(id); loadNotifs(); } catch {}
  }

  async function handleReadAll() {
    try { await api.notifications.readAll(); loadNotifs(); } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>Notifications — Dota 2 Finder</title>
        <meta property="og:title" content="Notifications — Dota 2 Finder" />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-2"><Bell size={24} /> {t('notif.title')}</h1>
        {notifs.some((n) => !n.read) && (
          <button onClick={handleReadAll} className="text-xs text-accent hover:underline flex items-center gap-1"><CheckCheck size={14} /> {t('notif.read_all')}</button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('notif.none')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifs.map((n) => (
            <Link
              key={n.id}
              to={n.link || '#'}
              className={`flex items-start gap-4 p-4 rounded-xl transition ${
                n.read ? 'glass opacity-60' : 'glass-tinted'
              } glass-hover`}
              onClick={() => { if (!n.read) handleRead(n.id); }}
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.read ? 'text-muted' : 'text-text font-medium'}`}>{n.title}</p>
                {n.content && <p className="text-muted text-xs mt-0.5">{n.content}</p>}
                <p className="text-muted/40 text-[10px] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              <ArrowRight size={16} className="text-muted shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
