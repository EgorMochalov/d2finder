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
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
      <Helmet>
        <title>Dota 2 Finder — Find Teammates & Teams</title>
        <meta name="description" content="Find teammates for Dota 2. Search by rank, role, region and language. Create teams, chat, and participate in clan wars." />
        <meta property="og:title" content="Dota 2 Finder" />
        <meta property="og:description" content="Find teammates for Dota 2. Search by rank, role, region and language." />
      </Helmet>
      <div className="text-center mb-16 md:mb-20">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl glass-tinted mb-6 shadow-glow">
          <Shield size={44} style={{ color: '#ffd700' }} />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
            {t('home.title')}
          </span>
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          {!user ? (
            <>
              <Link to="/register" className="btn-primary px-8 py-3 text-base">{t('home.getstarted')} <ArrowRight size={18} /></Link>
              <Link to="/login" className="btn-secondary px-8 py-3 text-base">{t('nav.signin')}</Link>
            </>
          ) : (
            <>
              <Link to="/search" className="btn-primary px-8 py-3 text-base">{t('home.feature1')} <ArrowRight size={18} /></Link>
              <Link to="/profile" className="btn-secondary px-8 py-3 text-base">{t('nav.profile')}</Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-16 max-w-lg mx-auto">
        <Link to="/search" className="glass rounded-2xl p-5 text-center glass-hover block">
          <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
            {playerCount !== null ? playerCount.toLocaleString() : '...'}
          </p>
          <p className="text-muted text-xs mt-1">{t('home.players_stat')}</p>
        </Link>
        <Link to="/teams" className="glass rounded-2xl p-5 text-center glass-hover block">
          <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent">
            {teamCount !== null ? teamCount.toLocaleString() : '...'}
          </p>
          <p className="text-muted text-xs mt-1">{t('home.teams_stat')}</p>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <Link key={f.label} to={f.to} className={`glass rounded-2xl p-6 glass-hover bg-gradient-to-b ${f.color} to-transparent block`}>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center mb-4"><f.icon size={20} className="text-accent" /></div>
            <h3 className="text-text font-semibold mb-1.5">{t(f.label)}</h3>
            <p className="text-muted text-sm leading-relaxed">{t(f.desc)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
