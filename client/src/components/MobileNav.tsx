import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { Search, Users, MessageCircle, Swords, Home } from 'lucide-react';

const links = [
  { to: '/', labelKey: 'nav.home' as const, icon: Home },
  { to: '/search', labelKey: 'nav.players' as const, icon: Search },
  { to: '/teams', labelKey: 'nav.teams' as const, icon: Users },
  { to: '/chat', labelKey: 'nav.chat' as const, icon: MessageCircle },
  { to: '/clanwars', labelKey: 'nav.clanwars' as const, icon: Swords },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {links.map(({ to, labelKey, icon: Icon }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
                isActive ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
