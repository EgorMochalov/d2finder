import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useDebounce } from '../lib/useDebounce';
import { useToast } from '../components/Toast';
import { Search, Users, Plus, SlidersHorizontal, X, LogIn, MessageCircle, Swords, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { TeamCardSkeleton } from '../components/Skeleton';

export default function TeamsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showF, setShowF] = useState(true);
  const [query, setQuery] = useState('');
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [chalTeam, setChalTeam] = useState<any>(null);
  const [chalMyTeam, setChalMyTeam] = useState('');
  const [chalMsg, setChalMsg] = useState('');
  const [joinTeam, setJoinTeam] = useState<any>(null);
  const [joinMsg, setJoinMsg] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [lastCreatedTeamId, setLastCreatedTeamId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 400);
  const debouncedMinRank = useDebounce(minRank, 400);
  const debouncedMaxRank = useDebounce(maxRank, 400);

  useEffect(() => { loadTeams(debouncedQuery, debouncedMinRank, debouncedMaxRank); if (user) loadMyTeams(); }, [user, debouncedQuery, debouncedMinRank, debouncedMaxRank]);

  async function loadTeams(q?: string, minR?: string, maxR?: string) {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (q) params.query = q;
      if (minR) params.minRank = minR;
      if (maxR) params.maxRank = maxR;
      setTeams(await api.search.teams(params));
    } catch {} finally { setLoading(false); }
  }

  async function loadMyTeams() {
    try { setMyTeams(await api.teams.list()); } catch {}
  }

  function isMember(team: any): boolean {
    if (!user) return false;
    return team.members?.some((m: any) => m.userId === user.id);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErrs({});
    if (name.length < 2 || tag.length < 2) { setErrs({ form: t('teams.validation') }); return; }
    try {
      const team = await api.teams.create({ name, tag, description: desc });
      setLastCreatedTeamId(team.id);
      toast('success', t('teams.created'));
      setShowCreate(false); setName(''); setTag(''); setDesc('');
      loadTeams(debouncedQuery);
    } catch (err: any) {
      const msg = err.message;
      if (msg.includes('name')) setErrs({ name: msg });
      else if (msg.includes('tag')) setErrs({ tag: msg });
      else setErrs({ form: msg });
    }
  }

  async function handleChallenge() {
    if (!chalTeam || !chalMyTeam) return;
    try { await api.clanWars.challenge(chalMyTeam, chalTeam.id, chalMsg); toast('success', t('clanwars.challenge_sent')); setChalTeam(null); setChalMsg(''); } catch (err: any) { toast('error', err.message); }
  }

  async function handleJoin() {
    setJoinErr('');
    if (!joinTeam) return;
    try {
      await api.teams.joinRequest(joinTeam.id, joinMsg || undefined);
      toast('success', t('team_detail.join_sent'));
      setJoinTeam(null);
      setJoinMsg('');
    } catch (err: any) {
      setJoinErr(err.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text flex items-center gap-2"><Users size={24} /> {t('teams.title')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowF(!showF)} className="md:hidden text-muted hover:text-text transition text-sm flex items-center gap-1"><SlidersHorizontal size={16} /> {showF ? t('common.hide') : t('teams.filters')}</button>
          {user && <button data-tour="create-team" onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"><Plus size={18} /> {t('teams.create')}</button>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`${showF ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0`}>
          <div className="glass rounded-2xl p-5 md:sticky md:top-20">
            <h2 className="text-text font-semibold mb-4 text-sm flex items-center gap-2"><SlidersHorizontal size={16} /> {t('teams.filters')}</h2>
            <div className="space-y-4">
              <div><label className="text-muted text-xs block mb-1.5">{t('common.search')}</label><div className="relative"><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('teams.search_placeholder')} className="glass-input w-full rounded-xl pl-8 pr-3 py-2 text-sm" /><Search size={14} className="absolute left-2.5 top-2.5 text-muted" /></div></div>
              <div><label className="text-muted text-xs block mb-1.5">{t('search.mmr')}</label><div className="flex gap-2"><input type="number" value={minRank} onChange={(e) => setMinRank(e.target.value)} placeholder={t('search.from')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" /><input type="number" value={maxRank} onChange={(e) => setMaxRank(e.target.value)} placeholder={t('search.to')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" /></div></div>
              <button onClick={() => loadTeams(query, minRank, maxRank)} className="btn-primary w-full py-2 rounded-xl text-sm flex items-center justify-center gap-2"><Search size={15} /> {t('teams.search')}</button>
              {query || minRank || maxRank ? <button onClick={() => { setQuery(''); setMinRank(''); setMaxRank(''); loadTeams(); }} className="btn-ghost w-full py-2 rounded-xl text-sm">{t('teams.clear')}</button> : null}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {query && <div className="flex items-center gap-2 mb-4"><span className="chip chip-accent text-xs flex items-center gap-1">{t('common.search')}: {query}<button onClick={() => { setQuery(''); loadTeams(); }}><X size={12} /></button></span></div>}

          <Modal open={showCreate} onClose={() => { setShowCreate(false); setErrs({}); }} title={t('teams.create_title')}>
            <form data-tour="team-modal" onSubmit={handleCreate} className="space-y-4">
              <div><label className="field-label">{t('teams.name')}</label><input data-tour="team-name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${errs.name ? 'error' : ''}`} />{errs.name && <p className="text-accent text-xs mt-1">{errs.name}</p>}</div>
              <div><label className="field-label">{t('teams.tag')}</label><input data-tour="team-tag-input" type="text" value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} placeholder={t('placeholders.tag')} maxLength={6} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm uppercase ${errs.tag ? 'error' : ''}`} />{errs.tag && <p className="text-accent text-xs mt-1">{errs.tag}</p>}</div>
              <div><label className="field-label">{t('teams.desc')}</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('placeholders.team_desc')} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" rows={3} /></div>
              {errs.form && <div className="flex items-start gap-2 bg-accent-dim border border-accent/20 text-accent rounded-xl p-3 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /> {errs.form}</div>}
              <div className="flex gap-3 pt-2"><button data-tour="team-submit-btn" type="submit" className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('teams.create')}</button><button type="button" onClick={() => { setShowCreate(false); setErrs({}); }} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('common.cancel')}</button></div>
            </form>
          </Modal>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <TeamCardSkeleton key={i} />)}
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 text-muted"><Users size={48} className="mx-auto mb-3 opacity-30" /><p>{t('teams.none')}</p>{user && <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 px-6 py-2 rounded-xl text-sm">{t('teams.create_one')}</button>}</div>
          ) : (
            <div className="space-y-3">
              <p className="text-muted text-sm">{t('common.teams_found', { count: String(teams.length) })}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {teams.map((team: any, i: number) => (
                  <div key={team.id} className="glass rounded-xl p-5 glass-hover flex flex-col stagger-enter" style={{ animationDelay: `${i * 0.05}s` }}>
                    <Link to={`/teams/${team.id}`} className="block flex-1" data-tour={team.id === lastCreatedTeamId ? 'team-card-mine' : undefined} onClick={() => setLastCreatedTeamId(null)}>
                      <div className="flex items-start gap-3 mb-3">
                        <AvatarImg src={team.logoUrl} alt={team.tag} className="w-12 h-12 text-lg" square />
                        <div className="min-w-0 flex-1"><h3 className="text-text font-semibold truncate">{team.name}</h3><p className="text-muted text-xs">[{team.tag}] · {team._count?.members || team.members?.length || 0} {t('common.members')}</p></div>
                      </div>
                      {team.description && <p className="text-muted text-sm line-clamp-2 leading-relaxed">{team.description}</p>}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-muted"><Users size={12} /> {t('teams.captain')}: {team.captain?.username}</div>
                      {team.avgRank !== undefined && <div className="flex items-center gap-2 mt-1.5 text-xs text-muted"><span className="text-gold">★</span> {t('teams.avg_rank')}: {team.avgRank}{team.captainRank ? ` · ${t('teams.captain_rank')}: ${team.captainRank}` : ''}</div>}
                    </Link>
                    {user && !isMember(team) && (
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 mt-auto">
                        <button onClick={(e) => { e.preventDefault(); setJoinTeam(team); setJoinMsg(''); setJoinErr(''); }}
                          className="btn-ghost flex-1 min-w-0 px-1.5 py-1 rounded-lg text-[10px] lg:text-xs flex items-center justify-center gap-0.5"><LogIn size={11} className="shrink-0" /><span className="truncate">{t('teams.join')}</span></button>
                        <button onClick={(e) => { e.preventDefault(); navigate(`/chat?user=${team.captainId}`); }}
                          className="btn-ghost flex-1 min-w-0 px-1.5 py-1 rounded-lg text-[10px] lg:text-xs flex items-center justify-center gap-0.5"><MessageCircle size={11} className="shrink-0" /><span className="truncate">{t('search.message')}</span></button>
                        {myTeams.length > 0 && <button onClick={(e) => { e.preventDefault(); setChalTeam(team); setChalMyTeam(myTeams[0]?.id || ''); }}
                          className="btn-ghost flex-1 min-w-0 px-1.5 py-1 rounded-lg text-[10px] lg:text-xs flex items-center justify-center gap-0.5"><Swords size={11} className="shrink-0" /><span className="truncate">{t('clanwars.challenge')}</span></button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal open={!!chalTeam} onClose={() => { setChalTeam(null); setChalMsg(''); }} title={`${t('clanwars.challenge')} ${chalTeam?.name || ''}`}>
        <div className="space-y-4">
          <div><label className="field-label">{t('clanwars.your_team')}</label><select value={chalMyTeam} onChange={(e) => setChalMyTeam(e.target.value)} className="glass-select w-full rounded-xl px-4 py-2.5 text-sm">{myTeams.map((t: any) => <option key={t.id} value={t.id}>{t.name} [{t.tag}]</option>)}</select></div>
          <div><label className="field-label">{t('clanwars.message')}</label><textarea value={chalMsg} onChange={(e) => setChalMsg(e.target.value)} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" rows={3} placeholder={t('placeholders.challenge_msg')} /></div>
          <div className="flex gap-3"><button onClick={handleChallenge} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('clanwars.send')}</button><button onClick={() => setChalTeam(null)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('common.cancel')}</button></div>
        </div>
      </Modal>
      <Modal open={!!joinTeam} onClose={() => { setJoinTeam(null); setJoinMsg(''); setJoinErr(''); }} title={`${t('team_detail.join_title')} ${joinTeam?.name || ''}`}>
        <div className="space-y-4">
          <p className="text-muted text-sm">{t('team_detail.join_req', { name: joinTeam?.name || '' })}</p>
          <div><label className="field-label">{t('teams.request_msg')}</label><textarea value={joinMsg} onChange={(e) => setJoinMsg(e.target.value)} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" rows={3} placeholder={t('placeholders.why_join')} /></div>
          {joinErr && <p className="text-accent text-xs flex items-center gap-1"><AlertCircle size={12} /> {joinErr}</p>}
          <div className="flex gap-3"><button onClick={handleJoin} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('team_detail.join')}</button><button onClick={() => setJoinTeam(null)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('common.cancel')}</button></div>
        </div>
      </Modal>
    </div>
  );
}
