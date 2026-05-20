import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useOnlineUsers } from '../lib/socket';
import AvatarImg from '../components/AvatarImg';
import Modal from '../components/Modal';
import RankPicker from '../components/RankPicker';
import ReportButton from '../components/ReportButton';
import Modal from '../components/Modal';
import { UserPlus, MessageCircle, Shield, Camera, Save, Star, MapPin, Globe, Square, Play, AlertCircle, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { ROLE_PREFS, roleLabelKey } from '../lib/positions';
import { filterManageableTeams } from '../lib/teamUtils';
import {
  PLAYSTYLE_TAG_IDS,
  MAX_PLAYSTYLE_TAGS,
  playstyleTagKey,
  parsePlaystyleTags,
  togglePlaystyleTag,
  type PlaystyleTagId,
} from '../lib/playstyleTags';

const REGIONS = ['Europe West', 'Europe East', 'Russia', 'US East', 'US West', 'SE Asia', 'China', 'South America', 'Australia', 'Japan'];
const LANGUAGES = ['English', 'Russian', 'Chinese', 'Spanish', 'Portuguese', 'German', 'French', 'Ukrainian', 'Polish', 'Turkish'];

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const userId = id || me?.id || '';
  const isOwn = !id || id === me?.id;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rank, setRank] = useState<number>(0);
  const [rolePrefs, setRolePrefs] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [playstyleTags, setPlaystyleTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteErr, setInviteErr] = useState('');
  const [timer, setTimer] = useState('');

  useEffect(() => { loadProfile(); }, [userId]);
  useEffect(() => { if (profile?.lookingExpiry) { updateTimer(); const i = setInterval(updateTimer, 60000); return () => clearInterval(i); } }, [profile?.lookingExpiry]);
  useEffect(() => { if (me && !isOwn) loadMyTeams(); }, [me, isOwn]);

  function updateTimer() {
    if (!profile?.lookingExpiry) return;
    const startTime = new Date(profile.lookingExpiry).getTime() - 24 * 60 * 60 * 1000;
    const elapsed = Math.floor((Date.now() - startTime) / 60000);
    if (elapsed <= 0) { setTimer(`0${t('common.min_short')}`); return; }
    const h = Math.floor(elapsed / 60), m = elapsed % 60;
    setTimer(h > 0 ? `${h}${t('common.hour_short')} ${m}${t('common.min_short')}` : `${m}${t('common.min_short')}`);
  }

  async function loadProfile() {
    try {
      const d = await api.users.get(userId);
      setProfile(d);
      setRank(d.rank || 0);
      try { setRolePrefs(JSON.parse(d.rolePrefs || '[]')); } catch { setRolePrefs([]); }
      setRegion(d.region || '');
      try { setLanguages(JSON.parse(d.languages || '[]')); } catch { setLanguages([]); }
      setBio(d.bio || '');
      setPlaystyleTags(parsePlaystyleTags(d.playstyleTags));
    } catch (err: any) { toast('error', err.message || 'Error'); } finally { setLoading(false); }
  }

  async function loadMyTeams() {
    try { const all = await api.teams.list(); setMyTeams(filterManageableTeams(all, me!.id)); } catch (err: any) { toast('error', err.message); }
  }

  async function handleInvite(tid: string) {
    setInviteErr('');
    try { await api.teams.invite(tid, userId); toast('success', t('team_detail.invited')); setShowInvite(false); } catch (err: any) { setInviteErr(err.message); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.users.update({ rank, rolePrefs, region, languages, bio, playstyleTags });
      setEditing(false); await refreshUser(); await loadProfile();
    } catch (err: any) { toast('error', err.message); } finally { setSaving(false); }
  }

  async function toggleLooking() {
    try { if (profile.isLooking) await api.users.stopLooking(); else await api.users.startLooking(); await loadProfile(); } catch {}
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload.avatar(file);
      setProfile((prev: any) => ({ ...prev, avatarUrl: result.avatarUrl }));
    } catch {} finally { setUploading(false); }
  }

  function toggleChip(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  if (loading) return <div className="text-center py-20 text-muted text-sm">{t('common.loading')}</div>;
  if (!profile) return <div className="text-center py-20 text-muted"><p className="mb-4">{t('profile.not_found')}</p><Link to="/" className="btn-ghost px-4 py-2 rounded-xl text-sm">{t('common.go_home')}</Link></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Profile — Dota 2 Finder</title>
        <meta property="og:title" content="Profile — Dota 2 Finder" />
      </Helmet>
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-blue/10 to-gold/5" />
        <div className="relative p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            <AvatarImg src={profile.avatarUrl} alt={profile.username || ''} className="w-20 h-20 md:w-24 md:h-24 text-3xl md:text-4xl ring-2 ring-accent/30 shadow-xl" />
            {isOwn && <>
              <button onClick={() => document.getElementById('avatar-input')?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full glass-strong flex items-center justify-center text-muted hover:text-text transition shadow-lg" disabled={uploading}><Camera size={13} /></button>
              <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </>}
            {profile.isLooking && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green animate-pulse ring-2 ring-[#0d0d1a]" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-text">{profile.username}</h1>
              {profile.rank ? <span className="chip chip-accent text-xs">{profile.rank} {t('common.mmr')}</span> : <span className="chip text-xs">{t('profile.unranked')}</span>}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {me && !isOwn ? <>
                {myTeams.length > 0 && <button onClick={() => setShowInvite(true)} className="btn-ghost px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"><UserPlus size={14} /> {t('profile.invite')}</button>}
                <button onClick={() => navigate(`/chat?user=${userId}`)} className="btn-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"><MessageCircle size={14} /> {t('profile.message')}</button>
                <ReportButton reportedUserId={userId} />
              </> : null}
              {isOwn && <Link to="/my-teams" className="btn-ghost px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"><Shield size={14} /> {t('profile.my_teams')}</Link>}
            </div>
          </div>
          {profile.isLooking && <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl shrink-0"><div className="w-2 h-2 rounded-full bg-green animate-pulse" /><span className="text-text text-xs font-semibold">{t('profile.looking')}</span><span className="text-gold text-xs font-bold tabular-nums">({timer})</span></div>}
        </div>
      </div>

      {editing ? (
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-text mb-5">{t('profile.edit_title')}</h2>
          <div className="space-y-5">
            <div><label className="field-label">{t('profile.rank')}</label><RankPicker value={rank} onChange={setRank} /></div>

            <div><label className="field-label">{t('profile.roles')}</label>
              <div className="flex flex-wrap gap-1.5">{ROLE_PREFS.map((p) => <button key={p} type="button" onClick={() => setRolePrefs(toggleChip(rolePrefs, p))} className={`px-3 py-1.5 rounded-lg text-xs border transition ${rolePrefs.includes(p) ? 'bg-accent-dim border-accent/30 text-accent' : 'glass-input border-white/5 text-muted hover:text-text'}`}>{t(roleLabelKey(p))}</button>)}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div><label className="field-label">{t('profile.region')}</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="glass-select w-full rounded-xl px-4 py-2.5 text-sm"><option value="">—</option>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              </div>
            </div>

            <div><label className="field-label">{t('profile.languages')}</label>
              <div className="flex flex-wrap gap-1.5">{LANGUAGES.map((l) => <button key={l} type="button" onClick={() => setLanguages(toggleChip(languages, l))} className={`px-3 py-1.5 rounded-lg text-xs border transition ${languages.includes(l) ? 'bg-blue-dim border-blue/30 text-blue' : 'glass-input border-white/5 text-muted hover:text-text'}`}>{l}</button>)}</div>
            </div>

            <div>
              <label className="field-label flex items-center gap-1.5"><Sparkles size={14} className="text-accent" /> {t('profile.playstyle')}</label>
              <p className="text-muted text-xs mb-2">{t('profile.playstyle_desc')}</p>
              <div className="flex flex-wrap gap-1.5">
                {PLAYSTYLE_TAG_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlaystyleTags((prev) => togglePlaystyleTag(prev, id))}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition text-left ${
                      playstyleTags.includes(id)
                        ? 'chip-playstyle border-violet-400/40'
                        : 'glass-input border-white/5 text-muted hover:text-text'
                    }`}
                  >
                    {t(playstyleTagKey(id))}
                  </button>
                ))}
              </div>
              {playstyleTags.length >= MAX_PLAYSTYLE_TAGS && (
                <p className="text-muted text-[10px] mt-1.5">{t('profile.playstyle_max')}</p>
              )}
            </div>

            <div><label className="field-label">{t('profile.bio')}</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder={t('placeholders.bio')} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" /></div>
            <div className="flex gap-3 pt-2"><button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2"><Save size={15} /> {saving ? t('common.loading') : t('profile.save')}</button><button onClick={() => { setEditing(false); loadProfile(); }} className="btn-ghost px-6 py-2.5 rounded-xl text-sm">{t('profile.cancel')}</button></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4">
              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2"><Star size={12} /> {t('profile.rank')}</p>
              <p className="text-text text-base font-bold">{profile.rank ? `${profile.rank}` : '—'}</p>
              <p className="text-muted text-xs">{profile.rank ? t('common.mmr') : t('profile.unranked')}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2"><Shield size={12} /> {t('profile.roles')}</p>
              {rolePrefs.length > 0 ? <div className="flex flex-wrap gap-1">{rolePrefs.map((r: string) => <span key={r} className="chip">{t(roleLabelKey(r))}</span>)}</div> : <p className="text-text text-sm">—</p>}
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2"><MapPin size={12} /> {t('profile.region')}</p>
              <p className="text-text text-sm font-medium">{region || '—'}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2"><Globe size={12} /> {t('profile.languages')}</p>
              {languages.length > 0 ? <div className="flex flex-wrap gap-1">{languages.map((l: string) => <span key={l} className="chip">{l}</span>)}</div> : <p className="text-text text-sm">—</p>}
            </div>
          </div>

          {playstyleTags.length > 0 && (
            <div className="glass rounded-xl p-4 mb-6">
              <p className="text-muted text-[10px] uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5"><Sparkles size={12} /> {t('profile.playstyle')}</p>
              <div className="flex flex-wrap gap-1.5">
                {playstyleTags.map((id) => (
                  <span key={id} className="chip-playstyle">{t(playstyleTagKey(id as PlaystyleTagId))}</span>
                ))}
              </div>
            </div>
          )}

          {bio && <div className="glass rounded-xl p-4 mb-6"><p className="text-muted text-[10px] uppercase tracking-wider font-semibold mb-2">{t('profile.bio')}</p><p className="text-text text-sm leading-relaxed">{bio}</p></div>}

          {isOwn && (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setEditing(true)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm">{t('profile.edit')}</button>
              <button data-tour="looking-toggle" onClick={toggleLooking} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${profile.isLooking ? 'btn-ghost' : 'bg-green-dim text-green border border-green/20 hover:bg-green/20'}`}>
                {profile.isLooking ? <><Square size={15} /> {t('profile.stop_looking')}</> : <><Play size={15} /> {t('profile.start_looking')}</>}
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={showInvite} onClose={() => { setShowInvite(false); setInviteErr(''); }} title={t('profile.invite_to', { name: profile?.username || '' })}>
        {myTeams.length === 0 ? <p className="text-muted text-sm">{t('profile.no_teams_invite')}</p> : <>
          <p className="text-muted text-sm mb-4">{t('teams.invite')}:</p>
          <div className="space-y-2 mb-4">{myTeams.map((tm: any) => <button key={tm.id} onClick={() => handleInvite(tm.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface border border-white/5 glass-hover text-left"><AvatarImg src={tm.logoUrl} alt={tm.tag} className="w-10 h-10 text-sm" square /><div><p className="text-text text-sm font-medium">{tm.name}</p><p className="text-muted text-xs">[{tm.tag}] · {tm._count?.members || tm.members?.length || 0} {t('common.members')}</p></div></button>)}</div>
          {inviteErr && <p className="text-accent text-xs flex items-center gap-1 mb-3"><AlertCircle size={12} /> {inviteErr}</p>}
        </>}
        <button onClick={() => { setShowInvite(false); setInviteErr(''); }} className="btn-ghost w-full py-2.5 rounded-xl text-sm">{t('common.cancel')}</button>
      </Modal>
    </div>
  );
}
