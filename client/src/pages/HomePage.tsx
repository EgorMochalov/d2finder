import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import { Search, Users, MessageCircle, Swords, ArrowRight, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [teamCount, setTeamCount] = useState<number | null>(null);

  useEffect(() => {
    api.stats.get().then((s) => { setPlayerCount(s.users); setTeamCount(s.teams); }).catch(() => {});
  }, []);

  const features = [
    { icon: Search, label: 'home.feature1', desc: 'home.feature1_desc', color: 'from-blue/10 via-blue/5', to: '/search' },
    { icon: Users, label: 'home.feature2', desc: 'home.feature2_desc', color: 'from-accent/10 via-accent/5', to: '/teams' },
    { icon: Swords, label: 'home.feature3', desc: 'home.feature3_desc', color: 'from-gold/10 via-gold/5', to: '/clanwars' },
    { icon: MessageCircle, label: 'home.feature4', desc: 'home.feature4_desc', color: 'from-green/10 via-green/5', to: '/chat' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <Helmet>
        <title>Dota 2 Finder — Find Teammates & Teams</title>
        <meta name="description" content="Find teammates for Dota 2. Search by rank, role, region and language. Create teams, chat, and participate in clan wars." />
        <meta property="og:title" content="Dota 2 Finder" />
        <meta property="og:description" content="Find teammates for Dota 2. Search by rank, role, region and language." />
      </Helmet>

      <section className="hero-panel text-center mb-12 md:mb-16 animate-slide-up">
        <div className="hero-logo mb-6">
          <Shield size={40} className="text-gold drop-shadow-lg" strokeWidth={1.5} />
        </div>
        <p className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-3 font-display">Dota 2 · LFG</p>
        <p className="text-muted/80 text-sm mb-4 max-w-md mx-auto">{t('home.playstyle_hook')}</p>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-gold via-white to-accent bg-clip-text text-transparent">
            {t('home.title')}
          </span>
        </h1>
        <p className="text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 relative z-10">
          {!user ? (
            <>
              <Link to="/register" className="btn-primary px-8 py-3 text-base font-display tracking-wide">{t('home.getstarted')} <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn-secondary px-8 py-3 text-base">{t('nav.signin')}</Link>
            </>
          ) : (
            <>
              <Link to="/search" className="btn-primary px-8 py-3 text-base font-display tracking-wide">{t('home.feature1')} <ArrowRight size={18} /></Link>
              <Link to="/profile" className="btn-secondary px-8 py-3 text-base">{t('nav.profile')}</Link>
            </>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-12 max-w-lg mx-auto">
        <Link to="/search" className="glass hero-stat rounded-2xl p-5 text-center glass-hover block">
          <p className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
            {playerCount !== null ? playerCount.toLocaleString() : '—'}
          </p>
          <p className="text-muted text-xs mt-1 uppercase tracking-wider">{t('home.players_stat')}</p>
        </Link>
        <Link to="/teams" className="glass hero-stat rounded-2xl p-5 text-center glass-hover block">
          <p className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
            {teamCount !== null ? teamCount.toLocaleString() : '—'}
          </p>
          <p className="text-muted text-xs mt-1 uppercase tracking-wider">{t('home.teams_stat')}</p>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <Link
            key={f.label}
            to={f.to}
            className={`glass feature-card rounded-2xl p-6 glass-hover bg-gradient-to-b ${f.color} to-transparent block stagger-enter`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center mb-4 border border-white/5">
              <f.icon size={22} className="text-accent" />
            </div>
            <h3 className="font-display text-text font-semibold text-lg mb-1.5 tracking-wide">{t(f.label)}</h3>
            <p className="text-muted text-sm leading-relaxed relative z-10">{t(f.desc)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
