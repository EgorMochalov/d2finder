import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useUnread } from '../lib/unread';
import { Search, Users, Ghost, MessageCircle, Swords, Languages } from 'lucide-react';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

const LINKS = [
  { to: '/search', label: 'nav.players', icon: Search },
  { to: '/teams', label: 'nav.teams', icon: Users },
  { to: '/clanwars', label: 'nav.clanwars', icon: Swords },
  { to: '/chat', label: 'nav.chat', icon: MessageCircle },
  { to: '/draft', label: 'nav.draft', icon: Ghost },
];

export default function NavBar() {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { total } = useUnread();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/5" style={{ isolation: 'isolate', willChange: 'transform' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent via-accent/90 to-gold/40 flex items-center justify-center shadow-glow transition group-hover:scale-105">
            <span className="text-white text-xs font-black font-display">{t('nav.logo_short')}</span>
          </div>
          <span className="hidden sm:inline font-display text-lg font-bold text-text tracking-wide">{t('nav.logo_full')}</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition ${
                isActive(l.to) ? 'text-text bg-surface-hover' : 'text-muted hover:text-text hover:bg-surface-hover'
              }`}>
              <l.icon size={15} /> {t(l.label)}
              {l.to === '/chat' && total > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center shadow-glow">{total > 9 ? '9+' : total}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost px-4 py-1.5 rounded-xl text-sm">{t('nav.signin')}</Link>
              <Link to="/register" className="btn-primary px-4 py-1.5 rounded-xl text-sm">{t('nav.register')}</Link>
            </div>
          )}
          <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs text-muted hover:text-text hover:bg-surface-hover transition">
            <Languages size={14} /> {lang === 'ru' ? t('nav.lang_en') : t('nav.lang_ru')}
          </button>
        </div>
      </div>
    </nav>
  );
}
