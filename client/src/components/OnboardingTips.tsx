import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { X, Search, Users, MessageCircle, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIPS_KEY = 'onboarding_done';

export default function OnboardingTips() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(TIPS_KEY) === '1');

  if (dismissed) return null;

  const tips = [
    { icon: Play, label: t('onboarding.status'), desc: t('onboarding.status_desc'), to: '/profile', color: 'from-green/10 via-green/5' },
    { icon: Search, label: t('onboarding.search'), desc: t('onboarding.search_desc'), to: '/search', color: 'from-blue/10 via-blue/5' },
    { icon: Users, label: t('onboarding.team'), desc: t('onboarding.team_desc'), to: '/teams', color: 'from-accent/10 via-accent/5' },
    { icon: MessageCircle, label: t('onboarding.chat'), desc: t('onboarding.chat_desc'), to: '/chat', color: 'from-gold/10 via-gold/5' },
  ];

  function handleDismiss() {
    localStorage.setItem(TIPS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text font-semibold text-sm flex items-center gap-2"><ArrowRight size={16} className="text-accent" /> {t('onboarding.title')}</h2>
        <button onClick={handleDismiss} className="text-muted hover:text-text p-1"><X size={16} /></button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tips.map((tip) => (
          <Link key={tip.label} to={tip.to}
            className={`glass rounded-2xl p-4 glass-hover bg-gradient-to-b ${tip.color} to-transparent block`}>
            <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center mb-3"><tip.icon size={18} className="text-accent" /></div>
            <p className="text-text font-semibold text-sm mb-1">{tip.label}</p>
            <p className="text-muted text-xs leading-relaxed">{tip.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
