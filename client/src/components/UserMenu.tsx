import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import AvatarImg from './AvatarImg';
import { User, Shield, Bell, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="avatar w-9 h-9 text-sm hover:ring-2 ring-accent/50 transition cursor-pointer overflow-hidden">
        <AvatarImg src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-2xl overflow-hidden shadow-2xl z-50 animate-slide-up border border-white/5">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-text text-sm font-semibold truncate">{user.username}</p>
            <p className="text-muted text-xs truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link to="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface-hover transition">
              <User size={16} /> {t('nav.profile')}
            </Link>
            <Link to="/my-teams" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface-hover transition">
              <Shield size={16} /> {t('nav.my')}
            </Link>
            <Link to="/notifications" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface-hover transition">
              <Bell size={16} /> {t('notif.title')}
            </Link>
          </div>
          <div className="border-t border-white/5 py-1">
            <button onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-accent hover:bg-accent-dim transition">
              <LogOut size={16} /> {t('nav.signout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
