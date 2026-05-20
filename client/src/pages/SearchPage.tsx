import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useDebounce } from '../lib/useDebounce';
import { useOnlineUsers } from '../lib/socket';
import { useToast } from '../components/Toast';
import { Search as SearchIcon, Star, MapPin, X, SlidersHorizontal, MessageCircle, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { ROLE_PREFS, roleLabelEn } from '../lib/positions';
import { filterManageableTeams } from '../lib/teamUtils';
import { getRankTier } from '../lib/rankStyle';
import {
  PLAYSTYLE_TAG_IDS,
  playstyleTagKey,
  parsePlaystyleTags,
  playstyleMatchPercent,
  type PlaystyleTagId,
} from '../lib/playstyleTags';

const REGIONS = ['Europe West', 'Europe East', 'Russia', 'US East', 'US West', 'SE Asia', 'China', 'South America', 'Australia', 'Japan'];
const LANGUAGES = ['English', 'Russian', 'Chinese', 'Spanish', 'Portuguese', 'German', 'French', 'Ukrainian', 'Polish', 'Turkish'];

export default function SearchPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const onlineUsers = useOnlineUsers();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showF, setShowF] = useState(true);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [invTgt, setInvTgt] = useState<any>(null);
  const [invErr, setInvErr] = useState('');
  const [filters, setFilters] = useState({ rankMin: '', rankMax: '', region: '', position: '', language: '', query: '', playstyle: '' });
  const myPlaystyle = parsePlaystyleTags(user?.playstyleTags);

  const debouncedFilters = useDebounce(filters, 400);

  useEffect(() => { doSearch(); }, [debouncedFilters]);
  useEffect(() => { if (user) loadMyTeams(); }, [user]);

  async function loadMyTeams() {
    try { const all = await api.teams.list(); setMyTeams(filterManageableTeams(all, user!.id)); } catch (err: any) { toast('error', err.message || 'Error'); }
  }

  async function doSearch() {
    setLoading(true);
    try {
      const p: Record<string, string> = {};
      Object.entries(debouncedFilters).forEach(([k, v]) => { if (v) p[k] = v; });
      setPlayers(await api.search.teammates(p));
    } catch (err: any) { toast('error', err.message || 'Error'); } finally { setLoading(false); }
  }

  function apply(k: string, v: string) { setFilters((p) => ({ ...p, [k]: p[k as keyof typeof p] === v ? '' : v })); }
  function clearF() { setFilters({ rankMin: '', rankMax: '', region: '', position: '', language: '', query: '', playstyle: '' }); }

  function togglePlaystyleFilter(id: PlaystyleTagId) {
    setFilters((p) => {
      const list = p.playstyle ? p.playstyle.split(',').filter(Boolean) : [];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...p, playstyle: next.join(',') };
    });
  }

  function isPlaystyleFilterActive(id: PlaystyleTagId) {
    return filters.playstyle.split(',').filter(Boolean).includes(id);
  }

  async function handleInvite(tid: string) {
    setInvErr('');
    try { await api.teams.invite(tid, invTgt.id); toast('success', t('team_detail.invited')); setInvTgt(null); } catch (err: any) { setInvErr(err.message); }
  }

  const hasF = Object.values(filters).some(Boolean);

  function handleFilterChange(key: string, value: string) {
    setFilters((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Search Players — Dota 2 Finder</title>
        <meta property="og:title" content="Search Players — Dota 2 Finder" />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-text tracking-wide">{t('search.title')}</h1>
        <button onClick={() => setShowF(!showF)} className="md:hidden flex items-center gap-1 text-muted hover:text-text text-sm"><SlidersHorizontal size={16} /> {showF ? t('common.hide') : t('search.filters')}</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`${showF ? 'block' : 'hidden'} md:block w-full md:w-72 shrink-0`}>
          <div data-tour="search-filters" className="glass rounded-2xl p-5 md:sticky md:top-20">
            <div className="flex items-center justify-between mb-4"><h2 className="text-text font-semibold text-sm flex items-center gap-2"><SlidersHorizontal size={16} /> {t('search.filters')}</h2>{hasF && <button onClick={clearF} className="text-xs text-accent hover:underline">{t('search.clear')}</button>}</div>
            <div className="space-y-5">
              <div><label className="field-label">{t('common.search')}</label><div className="relative"><input type="text" value={filters.query} onChange={(e) => handleFilterChange('query', e.target.value)} placeholder={t('placeholders.search_username')} className="glass-input w-full rounded-xl pl-8 pr-3 py-2 text-sm" /><SearchIcon size={14} className="absolute left-2.5 top-2.5 text-muted" /></div></div>
              <div><label className="text-muted text-xs block mb-1.5">{t('search.mmr')}</label><div className="flex gap-2"><input type="number" value={filters.rankMin} onChange={(e) => handleFilterChange('rankMin', e.target.value)} placeholder={t('search.from')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" /><input type="number" value={filters.rankMax} onChange={(e) => handleFilterChange('rankMax', e.target.value)} placeholder={t('search.to')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" /></div></div>
               <div><label className="text-muted text-xs block mb-1.5">{t('search.position')}</label><div className="flex flex-wrap gap-1.5">{ROLE_PREFS.map((p) => <button key={p} onClick={() => apply('position', p)} className={`px-2.5 py-1 rounded-lg text-xs border transition ${filters.position === p ? 'bg-accent-dim border-accent/40 text-accent' : 'glass-input border-white/5 text-muted hover:text-text'}`}>{roleLabelEn(p)}</button>)}</div></div>
              <div><label className="text-muted text-xs block mb-1.5">{t('search.region')}</label><div className="flex flex-wrap gap-1.5">{REGIONS.map((r) => <button key={r} onClick={() => apply('region', r)} className={`px-2.5 py-1 rounded-lg text-xs border transition ${filters.region === r ? 'bg-blue-dim border-blue/40 text-blue' : 'glass-input border-white/5 text-muted hover:text-text'}`}>{r}</button>)}</div></div>
              <div><label className="field-label">{t('search.language')}</label><select value={filters.language} onChange={(e) => handleFilterChange('language', e.target.value)} className="glass-select w-full rounded-xl px-3 py-2 text-sm"><option value="">{t('placeholders.any')}</option>{LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}</select></div>
              <div>
                <label className="field-label flex items-center gap-1.5"><Sparkles size={14} className="text-accent" /> {t('search.playstyle')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLAYSTYLE_TAG_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePlaystyleFilter(id)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                        isPlaystyleFilterActive(id) ? 'chip-playstyle' : 'glass-input border-white/5 text-muted hover:text-text'
                      }`}
                    >
                      {t(playstyleTagKey(id))}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={doSearch} className="btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"><SearchIcon size={16} /> {t('search.search')}</button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {hasF && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).filter(([, v]) => v).flatMap(([k, v]) => {
                if (k === 'playstyle') {
                  return v.split(',').filter(Boolean).map((tag) => (
                    <span key={`ps-${tag}`} className="chip chip-playstyle text-xs flex items-center gap-1">
                      {t(playstyleTagKey(tag as PlaystyleTagId))}
                      <button type="button" onClick={() => togglePlaystyleFilter(tag as PlaystyleTagId)}><X size={12} /></button>
                    </span>
                  ));
                }
                return (
                  <span key={k} className="chip chip-accent text-xs flex items-center gap-1">
                    {k}: {v}
                    <button type="button" onClick={() => setFilters((p) => ({ ...p, [k]: '' }))}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : players.length === 0 ? (
            <EmptyState icon={SearchIcon} title={t('search.none')} hint={t('search.none_hint')} />
          ) : (
            <div className="space-y-3">
              <p className="text-muted text-sm">{players.length} {t('common.players')} {t('common.found')}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {players.map((p, i) => {
                  const tier = getRankTier(p.rank || 0);
                  const pTags = parsePlaystyleTags(p.playstyleTags);
                  const match = playstyleMatchPercent(pTags, myPlaystyle);
                  return (
                  <Link key={p.id} to={`/profile/${p.id}`} className="player-card block stagger-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start gap-2.5 md:gap-3">
                      <div className="relative shrink-0">
                        <AvatarImg src={p.avatarUrl} alt={p.username || ''} className="w-10 h-10 md:w-11 md:h-11 text-base md:text-lg" />
                        {onlineUsers.has(p.id) && <span className="online-dot" title="Online" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-text font-semibold truncate text-sm">{p.username}</span>
                              {p.isLooking && <span className="looking-badge">{t('profile.looking')}</span>}
                              {match !== null && match > 0 && (
                                <span className="match-badge" title={t('search.match')}>{match}%</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted text-[11px] mt-1 flex-wrap">
                              <span className={tier.className}>{tier.label}</span>
                              <Star size={11} className="text-gold shrink-0" />
                              <span>{p.rank || 0}</span>
                              <span className="text-muted/40">{t('common.mmr')}</span>
                              {p.region && <><span className="text-muted/30">·</span><MapPin size={11} className="shrink-0" /><span>{p.region}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.preventDefault()}>
                            {user && user.id !== p.id && (<>{myTeams.length > 0 && <button onClick={() => setInvTgt(p)} className="p-1.5 rounded-lg text-muted hover:text-green hover:bg-surface-hover transition" title={t('search.invite')}><UserPlus size={14} /></button>}<button onClick={() => navigate(`/chat?user=${p.id}`)} className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-surface-hover transition" title={t('search.message')}><MessageCircle size={14} /></button></>)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                           {(p.rolePrefs as string[]).map((r: string) => <span key={r} className="chip">{roleLabelEn(r)}</span>)}
                          {pTags.map((tag) => (
                            <span key={tag} className="chip-playstyle">{t(playstyleTagKey(tag as PlaystyleTagId))}</span>
                          ))}
                        </div>
                        {p.bio && <p className="text-muted text-[11px] mt-1.5 line-clamp-2 leading-relaxed">{p.bio}</p>}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!invTgt} onClose={() => { setInvTgt(null); setInvErr(''); }} title={`${t('search.invite')} ${invTgt?.username || ''}`}>
        <p className="text-muted text-sm mb-4">{t('teams.invite')}:</p>
        <div className="space-y-2 mb-4">{myTeams.map((team: any) => <button key={team.id} onClick={() => handleInvite(team.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-white/5 glass-hover text-left"><AvatarImg src={team.logoUrl} alt={team.tag} className="w-10 h-10 text-sm" square /><div><p className="text-text text-sm font-medium">{team.name}</p><p className="text-muted text-xs">[{team.tag}] · {team._count?.members || team.members?.length || 0} {t('common.members')}</p></div></button>)}</div>
        {invErr && <p className="text-accent text-xs flex items-center gap-1 mb-3"><AlertCircle size={12} /> {invErr}</p>}
        <button onClick={() => { setInvTgt(null); setInvErr(''); }} className="btn-ghost w-full py-2.5 rounded-xl text-sm">{t('common.cancel')}</button>
      </Modal>
    </div>
  );
}
