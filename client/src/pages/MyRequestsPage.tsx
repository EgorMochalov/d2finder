import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { useToast } from '../components/Toast';
import { Shield, ChevronRight, Check, X, UserPlus, Send, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Modal, { ConfirmModal } from '../components/Modal';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);  // received
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);  // sent by me
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReq, setCancelReq] = useState<string | null>(null);
  const [cancelSent, setCancelSent] = useState<string | null>(null);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    try {
      const [all, invs, sent, reqs] = await Promise.all([
        api.teams.list(),
        api.teams.myInvitations(),
        api.teams.mySentInvitations(),
        api.teams.myRequests(),
      ]);
      setTeams(all.filter((t: any) => t.members?.some((m: any) => m.userId === user!.id)));
      setInvitations(invs);
      setSentInvitations(sent);
      setRequests(reqs);
    } catch {} finally { setLoading(false); }
  }

  async function handleRespondInv(id: string, action: 'accept' | 'decline') {
    try {
      await api.teams.respondInvitation(id, action);
      toast('success', action === 'accept' ? t('my.invitation_accepted') : t('my.invitation_declined'));
      loadData();
    } catch (err: any) { toast('error', err.message); }
  }

  async function handleCancelRequest(id: string) {
    try {
      await api.teams.cancelRequest(id);
      toast('success', t('my.request_cancelled'));
      setCancelReq(null);
      loadData();
    } catch (err: any) { toast('error', err.message); }
  }

  async function handleCancelSentInvitation(id: string) {
    try {
      await api.teams.cancelInvitation(id);
      toast('success', t('my.invitation_cancelled'));
      setCancelSent(null);
      loadData();
    } catch (err: any) { toast('error', err.message); }
  }

  if (!user) return <div className="max-w-sm mx-auto px-4 py-20 text-center"><Shield size={40} className="mx-auto mb-4 opacity-30" /><p className="text-muted mb-4">{t('my.signin')}</p><Link to="/login" className="btn-primary inline-block px-6 py-2 rounded-xl text-sm">{t('nav.signin')}</Link></div>;
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>My Teams — Dota 2 Finder</title>
        <meta property="og:title" content="My Teams — Dota 2 Finder" />
      </Helmet>
      <h1 className="text-2xl font-bold text-text mb-6 flex items-center gap-2"><Shield size={22} style={{ color: '#ffd700' }} /> {t('my.title')}</h1>

      {/* Invitations received */}
      {invitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-text font-semibold text-sm flex items-center gap-2 mb-3"><UserPlus size={16} /> {t('my.invitations')}</h2>
          <div className="space-y-2">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarImg src={inv.team?.logoUrl} alt={inv.team?.tag || ''} className="w-10 h-10 text-sm shrink-0" square />
                  <div className="min-w-0">
                    <p className="text-text font-medium text-sm truncate">{inv.team?.name}</p>
                    <p className="text-muted text-xs">[{inv.team?.tag}]</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <button onClick={() => handleRespondInv(inv.id, 'accept')}
                    className="w-9 h-9 rounded-xl bg-green-dim text-green hover:bg-green/20 flex items-center justify-center transition"><Check size={16} /></button>
                  <button onClick={() => handleRespondInv(inv.id, 'decline')}
                    className="w-9 h-9 rounded-xl bg-accent-dim text-accent hover:bg-accent/20 flex items-center justify-center transition"><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent invitations (from my teams) */}
      {sentInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-text font-semibold text-sm flex items-center gap-2 mb-3"><Send size={16} /> {t('my.sent_invitations')}</h2>
          <div className="space-y-2">
            {sentInvitations.map((inv: any) => (
              <div key={inv.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <AvatarImg src={inv.team?.logoUrl} alt={inv.team?.tag || ''} className="w-10 h-10 text-sm shrink-0" square />
                  <div className="min-w-0">
                    <p className="text-text font-medium text-sm truncate">{inv.team?.name}</p>
                    <p className="text-muted text-xs">{t('my.to_player')}: {inv.user?.username} · <span className="chip chip-accent text-[10px]">{t('my.pending')}</span></p>
                  </div>
                </div>
                <button onClick={() => setCancelSent(inv.id)}
                  className="btn-ghost px-3 py-1.5 rounded-lg text-xs shrink-0 ml-3">{t('my.cancel')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My join requests */}
      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-text font-semibold text-sm flex items-center gap-2 mb-3"><Send size={16} /> {t('my.requests')}</h2>
          <div className="space-y-2">
            {requests.map((req: any) => (
              <div key={req.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                   <AvatarImg src={req.team?.logoUrl} alt={req.team?.tag || ''} className="w-10 h-10 text-sm shrink-0" square />

                  <div className="min-w-0">
                    <p className="text-text font-medium text-sm truncate">{req.team?.name}</p>
                    <p className="text-muted text-xs">[{req.team?.tag}] · <span className="chip chip-accent text-[10px]">{t('my.pending')}</span></p>
                  </div>
                </div>
                <button onClick={() => setCancelReq(req.id)}
                  className="btn-ghost px-3 py-1.5 rounded-lg text-xs shrink-0 ml-3">{t('my.cancel')}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My teams */}
      <h2 className="text-text font-semibold text-sm flex items-center gap-2 mb-3"><Shield size={16} /> {t('my.my_teams')}</h2>
      <div className="glass rounded-2xl p-5">
        {teams.length === 0 ? <p className="text-muted text-sm">{t('my.none')}</p> : (
          <div className="space-y-2">{teams.map((tm: any) => <Link key={tm.id} to={`/teams/${tm.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-white/5 glass-hover"><AvatarImg src={tm.logoUrl} alt={tm.tag} className="w-10 h-10 text-sm shrink-0" square /><div className="flex-1 min-w-0"><p className="text-text font-medium text-sm truncate">{tm.name}</p><p className="text-muted text-xs">{tm._count?.members || tm.members?.length || 0} {t('common.members')}</p></div><span className="chip chip-green text-xs shrink-0">{t('my.member')}</span><ChevronRight size={14} className="text-muted shrink-0" /></Link>)}</div>
        )}
      </div>

      <ConfirmModal open={!!cancelReq} onClose={() => setCancelReq(null)} onConfirm={() => { if (cancelReq) handleCancelRequest(cancelReq); }}
        title={t('my.cancel_request')} message={t('my.cancel_request_confirm')} confirmText={t('my.cancel')} danger />
      <ConfirmModal open={!!cancelSent} onClose={() => setCancelSent(null)} onConfirm={() => { if (cancelSent) handleCancelSentInvitation(cancelSent); }}
        title={t('my.cancel_invitation')} message={t('my.cancel_invitation_confirm')} confirmText={t('my.cancel')} danger />
    </div>
  );
}
