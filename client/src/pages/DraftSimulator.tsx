import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { RotateCcw, Undo2, Search, X } from 'lucide-react';
import { HEROES, ALL_PHASES, getHeroImageUrl } from '../lib/heroes';
import type { Hero } from '../types';

function imgErr(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.target as HTMLImageElement;
  if (!img.dataset.retried) {
    img.dataset.retried = 'true';
    img.src = img.src.replace('/icons/', '/').replace('.png', '_icon.png');
    return;
  }
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.hero-fallback')) {
    const fb = document.createElement('span');
    fb.className = 'hero-fallback text-xs font-bold text-muted/60';
    fb.textContent = img.alt?.[0]?.toUpperCase() || '?';
    parent.insertBefore(fb, img);
  }
}

function HeroPortrait({ hero, size = 'sm', label }: { hero: Hero | null; size?: 'sm' | 'lg'; label?: string }) {
  const cls = size === 'lg' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12';
  if (!hero) return <div className={`${cls} rounded-lg border border-white/5 bg-surface/20 shrink-0`} />;
  return (
    <div className={`${cls} rounded-lg bg-surface border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden`} title={hero.name}>
      <img src={getHeroImageUrl(hero)} alt={hero.name} className="w-full h-full object-cover" loading="lazy" onError={imgErr} />
      {label && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-accent text-[8px] font-bold flex items-center justify-center text-white z-10">{label}</span>}
    </div>
  );
}

function BanPortrait({ hero, label }: { hero: Hero | null; label?: string }) {
  if (!hero) return <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/5 bg-surface/20 shrink-0" />;
  return (
    <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg bg-surface border border-white/5 flex items-center justify-center opacity-40 shrink-0 overflow-hidden">
      <img src={getHeroImageUrl(hero)} alt={hero.name} className="w-full h-full object-cover" loading="lazy" onError={imgErr} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[14px] h-[2px] bg-accent rotate-45 absolute rounded-full" />
        <div className="w-[14px] h-[2px] bg-accent -rotate-45 absolute rounded-full" />
      </div>
      {label && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-accent text-[8px] font-bold flex items-center justify-center text-white z-10">{label}</span>}
    </div>
  );
}

function TeamSidebar({ team, label, picks, bans, highlight }: {
  team: 'radiant' | 'dire'; label: string;
  picks: (Hero | null)[]; bans: (Hero | null)[];
  highlight: boolean;
}) {
  const { t } = useI18n();
  const isR = team === 'radiant';
  return (
    <div className={`glass rounded-xl p-3 md:p-4 ${highlight ? (isR ? 'ring-1 ring-green/40 shadow-glow' : 'ring-1 ring-accent/40') : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${isR ? 'bg-green' : 'bg-accent'} shrink-0`} />
        <span className={`text-xs md:text-sm font-bold uppercase tracking-wider ${isR ? 'text-green' : 'text-accent'}`}>{label}</span>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">{t('draft.picks')}</p>
        <div className="flex flex-wrap gap-1.5">
          {picks.map((h, i) => <HeroPortrait key={i} hero={h} />)}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">{t('draft.bans')}</p>
        <div className="flex flex-wrap gap-1.5">
          {bans.map((h, i) => <BanPortrait key={i} hero={h} />)}
        </div>
      </div>
    </div>
  );
}

export default function DraftSimulator() {
  const { t } = useI18n();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [radiantBans, setRadiantBans] = useState<(Hero | null)[]>(Array(7).fill(null));
  const [direBans, setDireBans] = useState<(Hero | null)[]>(Array(7).fill(null));
  const [radiantPicks, setRadiantPicks] = useState<(Hero | null)[]>(Array(5).fill(null));
  const [direPicks, setDirePicks] = useState<(Hero | null)[]>(Array(5).fill(null));
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [tab, setTab] = useState<'all' | 'str' | 'agi' | 'int'>('all');
  const [search, setSearch] = useState('');

  const banned = new Set([...radiantBans, ...direBans].filter(Boolean).map((h) => h!.id));
  const picked = new Set([...radiantPicks, ...direPicks].filter(Boolean).map((h) => h!.id));
  const unavailable = new Set([...banned, ...picked]);

  const currentPhase = ALL_PHASES[phaseIndex];
  const isDone = phaseIndex >= ALL_PHASES.length;

  const byTab = HEROES.filter((h) => tab === 'all' || h.attr === tab);
  const filteredHeroes = (search ? byTab.filter((h) => h.name.toLowerCase().includes(search.toLowerCase())) : byTab)
    .sort((a, b) => a.attr === b.attr ? 0 : a.attr === 'str' ? -1 : b.attr === 'str' ? 1 : a.attr === 'agi' ? -1 : 1);

  function handleSelect(hero: Hero) { if (!unavailable.has(hero.id)) setSelectedHero(hero); }

  function handleAction() {
    if (!selectedHero || isDone) return;
    const ph = ALL_PHASES[phaseIndex];
    const isR = ph.team === 'Radiant';
    if (ph.type === 'ban') {
      const bans = [...(isR ? radiantBans : direBans)];
      bans[bans.findIndex((b) => b === null)] = selectedHero;
      isR ? setRadiantBans(bans) : setDireBans(bans);
    } else {
      const picks = [...(isR ? radiantPicks : direPicks)];
      picks[picks.findIndex((p) => p === null)] = selectedHero;
      isR ? setRadiantPicks(picks) : setDirePicks(picks);
    }
    setSelectedHero(null);
    setPhaseIndex((i) => i + 1);
  }

  function undo() {
    if (phaseIndex <= 0) return;
    const prevPhase = ALL_PHASES[phaseIndex - 1];
    const isR = prevPhase.team === 'Radiant';
    if (prevPhase.type === 'ban') {
      const idx = prevPhase.ban - 1;
      if (isR) {
        const bans = [...radiantBans]; bans[idx] = null; setRadiantBans(bans);
      } else {
        const bans = [...direBans]; bans[idx] = null; setDireBans(bans);
      }
    } else {
      const idx = prevPhase.pick - 1;
      if (isR) {
        const picks = [...radiantPicks]; picks[idx] = null; setRadiantPicks(picks);
      } else {
        const picks = [...direPicks]; picks[idx] = null; setDirePicks(picks);
      }
    }
    setSelectedHero(null);
    setPhaseIndex((i) => i - 1);
  }

  function reset() {
    setRadiantBans(Array(7).fill(null)); setDireBans(Array(7).fill(null));
    setRadiantPicks(Array(5).fill(null)); setDirePicks(Array(5).fill(null));
    setSelectedHero(null); setPhaseIndex(0);
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text">{t('draft.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={phaseIndex <= 0}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 ${phaseIndex <= 0 ? 'opacity-25 cursor-not-allowed' : 'btn-ghost'}`}>
            <Undo2 size={14} /> {t('draft.undo')}</button>
          <button onClick={reset} className="btn-ghost px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"><RotateCcw size={14} /> {t('draft.reset')}</button>
        </div>
      </div>

      {/* Draft order timeline - all steps */}
      <div className="mb-6 glass rounded-2xl p-3 md:p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-full w-fit justify-between">
          {ALL_PHASES.map((ph, i) => {
            const isR = ph.team === 'Radiant';
            return (
              <div key={i} className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap border
                ${i <= phaseIndex ? (isR ? 'bg-green/20 text-green border-green/30' : 'bg-accent/20 text-accent border-accent/30') : 'bg-surface/20 text-muted/30 border-white/5'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isR ? 'bg-green' : 'bg-accent'} ${i <= phaseIndex ? '' : 'opacity-20'}`} />
                <span>{ph.type === 'ban' ? `${t('draft.ban_short')}${ph.ban}` : `${t('draft.pick_short')}${ph.pick}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isDone ? (
        <div className="text-center py-16">
          <p className="text-2xl text-gold font-bold mb-2">{t('draft.complete')}</p>
          <p className="text-muted text-sm">{t('draft.reset')}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Radiant - left sidebar on desktop, top on mobile */}
          <div className="w-full lg:w-48 xl:w-56 shrink-0">
            <TeamSidebar team="radiant" label={t('draft.radiant')} picks={radiantPicks} bans={radiantBans} highlight={currentPhase.team === 'Radiant'} />
          </div>

          {/* Hero grid + action - center */}
          <div className="flex-1 min-w-0 w-full">
            <div className="glass rounded-2xl p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="relative flex-1 min-w-[120px] max-w-[200px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="glass-input w-full rounded-lg pl-8 pr-7 py-1.5 text-xs" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"><X size={13} /></button>}
                </div>
                {(['all', 'str', 'agi', 'int'] as const).map((a) => (
                  <button key={a} onClick={() => setTab(a)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${tab === a ? 'bg-accent-dim text-accent border border-accent/30' : 'glass text-muted hover:text-text border border-white/5'}`}>{a === 'all' ? t('draft.all') : a === 'str' ? t('draft.str') : a === 'agi' ? t('draft.agi') : t('draft.int')}</button>
                ))}
              </div>

              {/* Action bar - always visible between filters and grid */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-3 p-2 rounded-xl bg-surface/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${currentPhase.team === 'Radiant' ? 'bg-green' : 'bg-accent'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${currentPhase.team === 'Radiant' ? 'text-green' : 'text-accent'}`}>
                      {currentPhase.team === 'Radiant' ? t('draft.radiant') : t('draft.dire')}
                    </p>
                    <p className="text-[10px] text-muted/70">
                      {currentPhase.type === 'ban' ? `${t('draft.ban')} #${currentPhase.ban}` : `${t('draft.pick')} #${currentPhase.pick}`}
                    </p>
                  </div>
                </div>
                {selectedHero && (
                  <div className="flex items-center gap-1.5 bg-surface/30 rounded-lg px-2.5 py-1.5 border border-white/5">
                    <div className="w-5 h-5 rounded overflow-hidden bg-surface/50"><img src={getHeroImageUrl(selectedHero)} alt="" className="w-full h-full object-cover" onError={imgErr} /></div>
                    <span className="text-text/80 text-[11px] font-medium">{selectedHero.name}</span>
                  </div>
                )}
                <button onClick={handleAction} disabled={!selectedHero}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition shrink-0
                    ${!selectedHero ? 'opacity-25 cursor-not-allowed' : currentPhase.team === 'Radiant' ? 'bg-green/15 text-green border border-green/20 hover:bg-green/25' : 'bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25'}`}>
                  {currentPhase.type === 'ban' ? t('draft.ban') : t('draft.pick')}
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 max-h-[320px] md:max-h-[400px] overflow-y-auto px-0.5">
                {filteredHeroes.map((hero) => {
                  const isS = selectedHero?.id === hero.id;
                  const isU = unavailable.has(hero.id);
                  return <button key={hero.id} onClick={() => handleSelect(hero)} disabled={isU}
                    className={`p-1 rounded border text-center transition flex flex-col items-center gap-0.5
                      ${isS ? 'border-gold bg-gold/20 ring-1 ring-gold scale-110 z-10' : ''}
                      ${isU && !isS ? 'border-white/5 bg-surface/20 opacity-25 cursor-not-allowed' : ''}
                      ${!isU && !isS ? 'border-white/5 bg-surface hover:border-white/20 hover:bg-surface/30 hover:scale-105' : ''}`}>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded overflow-hidden bg-surface/50 flex items-center justify-center text-xs">
                      <img src={getHeroImageUrl(hero)} alt={hero.name} className="w-full h-full object-cover object-top" loading="lazy" onError={imgErr} />
                    </div>
                    <span className="text-[7px] md:text-[8px] text-muted truncate w-full leading-tight">{hero.name}</span>
                  </button>;
                })}
              </div>
            </div>
          </div>

          {/* Dire - right sidebar on desktop, bottom on mobile */}
          <div className="w-full lg:w-48 xl:w-56 shrink-0">
            <TeamSidebar team="dire" label={t('draft.dire')} picks={direPicks} bans={direBans} highlight={currentPhase.team === 'Dire'} />
          </div>
        </div>
      )}
    </div>
  );
}
