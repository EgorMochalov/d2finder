import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useToast } from '../components/Toast';
import { Users, UserPlus, Send, Check, X, AlertCircle, LogOut, Trash2, Camera } from 'lucide-react';
import Modal, { ConfirmModal } from '../components/Modal';

export default function TeamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [showInv, setShowInv] = useState(false);
  const [invUser, setInvUser] = useState('');
  const [invErr, setInvErr] = useState('');
  const [showRemove, setShowRemove] = useState<string | null>(null);
  const [showLeave, setShowLeave] = useState(false);
  const [showDisband, setShowDisband] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => { if (id) loadTeam(); }, [id]);

  async function loadTeam() {
    try { const t = await api.teams.get(id!); setTeam(t); } catch {} finally { setLoading(false); }
  }

  async function handleJoin() {
    setJoinErr('');
    try { await api.teams.joinRequest(id!, joinMsg || undefined); toast('success', t('team_detail.join_sent')); setShowJoin(false); setJoinMsg(''); } catch (err: any) { setJoinErr(err.message); }
  }

  async function handleInvite() {
    setInvErr('');
    if (!invUser.trim()) { setInvErr(t('team_detail.enter_username')); return; }
    try { const u = await api.search.teammates({ query: invUser }); if (u.length === 0) { setInvErr(t('team_detail.user_not_found')); return; } await api.teams.invite(id!, u[0].id); toast('success', t('team_detail.invited')); setShowInv(false); setInvUser(''); } catch (err: any) { setInvErr(err.message); }
  }

  async function handleRequest(reqId: string, action: 'accept' | 'decline') {
    try { await api.teams.handleJoinRequest(id!, reqId, action); loadTeam(); } catch {}
  }

  async function handleRemove(uid: string) {
    try { await api.teams.removeMember(id!, uid); toast('success', t('team_detail.member_removed')); loadTeam(); } catch {}
  }

  async function handleLeave() {
    try { await api.teams.leave(id!); toast('success', t('team_detail.left')); navigate('/teams'); } catch (err: any) { toast('error', err.message); }
  }

  async function handleDisband() {
    try { await api.teams.disband(id!); toast('success', t('team_detail.disbanded')); navigate('/my-teams'); } catch {}
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const result = await api.upload.teamLogo(file, id!);
      setTeam((prev: any) => ({ ...prev, logoUrl: result.logoUrl }));
    } catch {} finally { setLogoUploading(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div></div>;
  if (!team) return <div className="text-center py-20 text-muted">{t('team_detail.not_found')}</div>;

  const isCaptain = team.captainId === user?.id;
  const isMember = team.members?.some((m: any) => m.userId === user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="glass rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-accent/10 via-blue/10 to-transparent p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <AvatarImg src={team.logoUrl} alt={team.tag} className="w-16 h-16 text-2xl" square />
              {isCaptain && <>
                <button onClick={() => document.getElementById('team-logo-input')?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full glass-strong flex items-center justify-center text-muted hover:text-text transition shadow-lg" disabled={logoUploading}><Camera size={13} /></button>
                <input id="team-logo-input" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">{team.name}</h1>
              <p className="text-muted text-sm flex items-center gap-2 mt-0.5"><span className="chip">[{team.tag}]</span> {t('team_detail.captain')}: {team.captain?.username}</p>
            </div>
          </div>
          {team.description && <p className="text-text/70 mt-4 text-sm leading-relaxed">{team.description}</p>}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-text font-semibold flex items-center gap-2"><Users size={18} /> {t('team_detail.members')} ({team.members?.length || 0})</h2>
            <div className="flex gap-2 flex-wrap">
              {!isMember && user && <button onClick={() => setShowJoin(true)} className="btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2"><UserPlus size={15} /> {t('team_detail.join')}</button>}
              {isCaptain && <button onClick={() => setShowInv(true)} className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2"><UserPlus size={15} /> {t('team_detail.invite')}</button>}
              {isMember && !isCaptain && <button onClick={() => setShowLeave(true)} className="btn-ghost px-4 py-2 rounded-xl text-sm flex items-center gap-2 text-accent"><LogOut size={15} /> {t('team_detail.leave')}</button>}
              {isCaptain && <button onClick={() => setShowDisband(true)} className="btn-ghost px-4 py-2 rounded-xl text-sm flex items-center gap-2 text-accent"><Trash2 size={15} /> {t('team_detail.disband')}</button>}
            </div>
          </div>

          <div className="space-y-2">
            {team.members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/5 glass-hover">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${m.userId}`}><AvatarImg src={m.user?.avatarUrl} alt={m.user?.username || ''} className="w-10 h-10 text-sm hover:ring-2 ring-accent/50 transition" /></Link>
                  <div>
                    <Link to={`/profile/${m.userId}`} className="text-text font-medium text-sm hover:text-accent transition">{m.user?.username}</Link>
                    <p className="text-muted text-xs">{m.role === 'CAPTAIN' ? t('team_detail.role_captain') : m.role === 'VICE_CAPTAIN' ? t('team_detail.role_vice') : t('team_detail.role_member')}</p>
                  </div>
                </div>
                {isCaptain && m.role !== 'CAPTAIN' && <button onClick={() => setShowRemove(m.userId)} className="text-muted hover:text-accent transition p-2 rounded-lg hover:bg-surface-hover"><X size={16} /></button>}
              </div>
            ))}
          </div>

          {isCaptain && team.joinRequests?.filter((r: any) => r.status === 'PENDING').length > 0 && (
            <div className="mt-8">
              <h3 className="text-text font-semibold mb-3 flex items-center gap-2"><Send size={16} /> {t('team_detail.requests')} ({team.joinRequests.filter((r: any) => r.status === 'PENDING').length})</h3>
              <div className="space-y-2">
                {team.joinRequests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-white/5">
                    <div className="flex items-center gap-3">
                      <AvatarImg src={req.user?.avatarUrl} alt={req.user?.username || ''} className="w-10 h-10 text-sm" />
                      <div>
                        <Link to={`/profile/${req.userId}`} className="text-text font-medium text-sm hover:text-accent transition">{req.user?.username}</Link>
                        {req.message && <p className="text-muted text-xs mt-0.5">{req.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleRequest(req.id, 'accept')} className="p-2 rounded-lg bg-green-dim text-green hover:bg-green/20 transition"><Check size={16} /></button>
                      <button onClick={() => handleRequest(req.id, 'decline')} className="p-2 rounded-lg bg-accent-dim text-accent hover:bg-accent/20 transition"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showJoin} onClose={() => { setShowJoin(false); setJoinErr(''); }} title={t('team_detail.join_title')}>
        <p className="text-muted text-sm mb-4">{t('team_detail.join_req', { name: team.name })}</p>
        <div className="space-y-4">
          <div><label className="field-label">{t('team_detail.message_opt')}</label><textarea value={joinMsg} onChange={(e) => setJoinMsg(e.target.value)} placeholder={t('placeholders.why_join')} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" rows={3} /></div>
          {joinErr && <p className="text-accent text-xs flex items-center gap-1"><AlertCircle size={12} /> {joinErr}</p>}
          <div className="flex gap-3"><button onClick={handleJoin} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('team_detail.send')}</button><button onClick={() => setShowJoin(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('team_detail.cancel')}</button></div>
        </div>
      </Modal>

      <Modal open={showInv} onClose={() => { setShowInv(false); setInvErr(''); }} title={t('team_detail.invite_title')}>
        <div className="space-y-4">
          <div><label className="text-muted text-xs block mb-1.5">{t('register.username')}</label><input type="text" value={invUser} onChange={(e) => setInvUser(e.target.value)} placeholder={t('team_detail.invite_placeholder')} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${invErr ? 'error' : ''}`} /></div>
          {invErr && <p className="text-accent text-xs flex items-center gap-1"><AlertCircle size={12} /> {invErr}</p>}
          <div className="flex gap-3"><button onClick={handleInvite} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">{t('team_detail.invite')}</button><button onClick={() => setShowInv(false)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm">{t('team_detail.cancel')}</button></div>
        </div>
      </Modal>

      <ConfirmModal open={!!showRemove} onClose={() => setShowRemove(null)} onConfirm={() => { if (showRemove) handleRemove(showRemove); setShowRemove(null); }} title={t('team_detail.remove_member')} message={t('team_detail.remove_confirm')} confirmText={t('common.delete')} danger />
      <ConfirmModal open={showLeave} onClose={() => setShowLeave(false)} onConfirm={handleLeave} title={t('team_detail.leave')} message={t('team_detail.leave_confirm')} confirmText={t('team_detail.leave')} danger />
      <ConfirmModal open={showDisband} onClose={() => setShowDisband(false)} onConfirm={handleDisband} title={t('team_detail.disband')} message={t('team_detail.disband_confirm')} confirmText={t('team_detail.disband')} danger />
    </div>
  );
}
