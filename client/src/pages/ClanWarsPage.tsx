import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useToast } from '../components/Toast';
import { useDebounce } from '../lib/useDebounce';
import { Plus, Trash2, Clock, Shield, Users, Swords, AlertCircle, Search, X, SlidersHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Modal from '../components/Modal';
import RankPicker from '../components/RankPicker';

const CW_RANKS = ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'];

export default function ClanWarsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [showPost, setShowPost] = useState(false);
  const [pTeam, setPTeam] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pTime, setPTime] = useState('');
  const [pDate, setPDate] = useState('');
  const [pRank, setPRank] = useState(0);
  const [pMmr, setPMmr] = useState('');
  const [postErrors, setPostErrors] = useState<Record<string, string>>({});
  const [showF, setShowF] = useState(true);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ query: '', minMmr: '', maxMmr: '', dateFrom: '', dateTo: '', rankReq: '' });
  const debouncedFilters = useDebounce(filters, 400);

  useEffect(() => { loadPosts(); if (user) loadMyTeams(); }, [user, debouncedFilters]);

  async function loadMyTeams() {
    try { const all = await api.teams.list(); const my = all.filter((t: any) => t.members?.some((m: any) => m.userId === user!.id)); setMyTeams(my); if (my.length > 0 && !pTeam) setPTeam(my[0].id); } catch {}
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      Object.entries(debouncedFilters).forEach(([k, v]) => { if (v) params[k] = v; });
      const p = await api.clanWars.looking.list(params);
      setPosts(p);
    } catch {}
    setLoading(false);
  }

  function clearF() { setFilters({ query: '', minMmr: '', maxMmr: '', dateFrom: '', dateTo: '', rankReq: '' }); }

  const hasF = Object.values(filters).some(Boolean);

  async function handleCreatePost() {
    const e: Record<string, string> = {};
    if (!pTeam) e.pTeam = t('register.required');
    if (!pDesc.trim()) e.pDesc = t('register.required');
    setPostErrors(e);
    if (Object.keys(e).length > 0) return;
    try {
      await api.clanWars.looking.create({ teamId: pTeam, description: pDesc, timeText: pTime || undefined, dateText: pDate || undefined, rankReq: pRank ? String(pRank) : undefined, mmrReq: pMmr ? Number(pMmr) : undefined });
      setShowPost(false); setPDesc(''); setPTime(''); setPDate(''); setPRank(0); setPMmr(''); setPostErrors({});
      loadPosts();
    } catch (err: any) { toast('error', err.message); }
  }

  async function handleDeletePost(id: string) {
    try { await api.clanWars.looking.delete(id); loadPosts(); } catch (err: any) { toast('error', err.message); }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Clan Wars — Dota 2 Finder</title>
        <meta property="og:title" content="Clan Wars — Dota 2 Finder" />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-2"><Swords size={24} /> {t('clanwars.looking')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowF(!showF)} className="md:hidden flex items-center gap-1 text-muted hover:text-text text-sm"><SlidersHorizontal size={16} /> {showF ? t('common.hide') : t('search.filters')}</button>
          {user && <button onClick={() => setShowPost(true)} className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"><Plus size={16} /> {t('clanwars.post')}</button>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`${showF ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0`}>
          <div className="glass rounded-2xl p-5 md:sticky md:top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text font-semibold text-sm flex items-center gap-2"><SlidersHorizontal size={16} /> {t('search.filters')}</h2>
              {hasF && <button onClick={clearF} className="text-xs text-accent hover:underline">{t('search.clear')}</button>}
            </div>
            <div className="space-y-5">
              <div>
                <label className="field-label">{t('teams.search')}</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" value={filters.query} onChange={(e) => setFilters((p) => ({ ...p, query: e.target.value }))} placeholder={t('teams.search_placeholder')} className="glass-input w-full rounded-xl pl-9 pr-3 py-2 text-sm" />
                  {filters.query && <button onClick={() => setFilters((p) => ({ ...p, query: '' }))} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text"><X size={14} /></button>}
                </div>
              </div>

              <div>
                <label className="text-muted text-xs block mb-1.5">{t('search.mmr')}</label>
                <div className="flex gap-2">
                  <input type="number" value={filters.minMmr} onChange={(e) => setFilters((p) => ({ ...p, minMmr: e.target.value }))} placeholder={t('search.from')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
                  <input type="number" value={filters.maxMmr} onChange={(e) => setFilters((p) => ({ ...p, maxMmr: e.target.value }))} placeholder={t('search.to')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-muted text-xs block mb-1.5">{t('clanwars.date')}</label>
                <div className="space-y-2">
                  <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
                  <input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-muted text-xs block mb-1.5">{t('clanwars.rank')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {CW_RANKS.map((r) => (
                    <button key={r} onClick={() => setFilters((p) => ({ ...p, rankReq: p.rankReq === r ? '' : r }))}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition ${filters.rankReq === r ? 'bg-accent-dim border-accent/40 text-accent' : 'glass-input border-white/5 text-muted hover:text-text'}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {hasF && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
                <span key={k} className="chip chip-accent text-xs flex items-center gap-1">{k}: {v}<button onClick={() => setFilters((p) => ({ ...p, [k]: '' }))}><X size={12} /></button></span>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted">
                <Swords size={48} className="mx-auto mb-3 opacity-30" />
                <p>{t('clanwars.none')}</p>
              </div>
            ) : posts.map((p: any) => (
              <div key={p.id} className="glass rounded-xl p-5 border border-accent/10 glass-hover">
                <div className="flex items-center gap-3 mb-3">
                  <AvatarImg src={p.team?.logoUrl} alt={p.team?.tag || ''} className="w-10 h-10 text-sm" square />
                  <div className="min-w-0 flex-1">
                    <p className="text-text font-semibold text-sm truncate">{p.team?.name}</p>
                    <p className="text-muted text-xs"><Users size={11} className="inline" /> {p.team?._count?.members || 0} {t('common.members')}</p>
                  </div>
                </div>
                <p className="text-text text-sm mb-3 leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.dateText && <span className="chip chip-gold flex items-center gap-1"><Clock size={11} /> {new Date(p.dateText).toLocaleDateString()}</span>}
                  {p.timeText && <span className="chip flex items-center gap-1"><Clock size={11} /> {p.timeText}</span>}
                  {p.rankReq && <span className="chip chip-accent flex items-center gap-1"><Shield size={11} /> {p.rankReq}</span>}
                  {p.mmrReq != null && <span className="chip chip-gold flex items-center gap-1">{p.mmrReq} MMR</span>}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <p className="text-muted text-[11px]">by {p.author?.username}</p>
                  {(user && (p.authorId === user.id || myTeams.some((mt: any) => mt.id === p.teamId))) && (
                    <button onClick={() => handleDeletePost(p.id)} className="text-muted hover:text-accent transition p-1"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showPost} onClose={() => setShowPost(false)} title={t('clanwars.looking_for')}>
        <div className="space-y-4">
          <div><label className="field-label">{t('clanwars.your_team')}</label>
            <select value={pTeam} onChange={(e) => { setPTeam(e.target.value); setPostErrors((prev) => ({ ...prev, pTeam: '' })); }} className={`glass-select w-full rounded-xl px-4 py-2.5 text-sm ${postErrors.pTeam ? 'error' : ''}`}>{myTeams.map((tm: any) => <option key={tm.id} value={tm.id}>{tm.name} [{tm.tag}]</option>)}</select>
            {postErrors.pTeam && <p className="text-accent text-xs mt-1">{postErrors.pTeam}</p>}
          </div>
          <div><label className="field-label">{t('clanwars.message')}</label>
            <textarea value={pDesc} onChange={(e) => { setPDesc(e.target.value); setPostErrors((prev) => ({ ...prev, pDesc: '' })); }} placeholder={t('clanwars.looking_for')} className={`glass-textarea w-full rounded-xl px-4 py-2.5 text-sm ${postErrors.pDesc ? 'error' : ''}`} rows={3} />
            {postErrors.pDesc && <p className="text-accent text-xs mt-1">{postErrors.pDesc}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">{t('clanwars.date')}</label>
              <input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
            <div><label className="field-label">{t('clanwars.time')}</label>
              <input type="time" value={pTime} onChange={(e) => setPTime(e.target.value)} className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>
          <div><label className="field-label">{t('clanwars.rank')}</label>
            <RankPicker value={pRank} onChange={setPRank} allowPlus />
          </div>
          <div><label className="field-label">{t('clanwars.mmr')}</label>
            <input type="number" value={pMmr} onChange={(e) => setPMmr(e.target.value)} placeholder={t('placeholders.mmr')} className="glass-input w-full rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreatePost} className="btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"><Plus size={16} /> {t('clanwars.post')}</button>
            <button onClick={() => setShowPost(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('common.cancel')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
