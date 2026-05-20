import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import AvatarImg from '../components/AvatarImg';
import { Shield, Check, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { SITE_NAME } from '../lib/meta';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
  }, [user]);

  async function load() {
    setLoading(true);
    try { setReports(await api.reports.list()); } catch {} finally { setLoading(false); }
  }

  async function handleResolve(id: string) {
    try { await api.reports.resolve(id, 'dismiss'); load(); } catch {}
  }

  async function handleDismiss(id: string) {
    try { await api.reports.resolve(id, 'ban'); load(); } catch {}
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Helmet><title>Admin — {SITE_NAME}</title></Helmet>
        <div className="text-center py-20 text-muted"><Shield size={48} className="mx-auto mb-3 opacity-30" /><p>Access denied</p></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet><title>Admin Reports — {SITE_NAME}</title></Helmet>
      <h1 className="text-2xl font-bold text-text mb-6 flex items-center gap-2"><Shield size={22} /> Reports</h1>
      {loading ? (
        <div className="text-center py-12 text-muted">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted"><Shield size={48} className="mx-auto mb-3 opacity-30" /><p>No reports</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className={`glass rounded-xl p-4 ${r.status !== 'PENDING' ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <AvatarImg src={r.reporter?.avatarUrl} alt={r.reporter?.username || ''} className="w-6 h-6 text-[9px]" />
                    <span className="text-text font-medium">{r.reporter?.username}</span>
                    <span className="text-muted text-xs">reported</span>
                    {r.reportedUser && (
                      <>
                        <AvatarImg src={r.reportedUser?.avatarUrl} alt={r.reportedUser?.username || ''} className="w-6 h-6 text-[9px]" />
                        <span className="text-text font-medium">{r.reportedUser?.username}</span>
                      </>
                    )}
                    {r.reportedTeam && (
                      <span className="text-text font-medium">{r.reportedTeam.name} [{r.reportedTeam.tag}]</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`chip text-xs ${r.reason === 'SPAM' ? 'chip-accent' : ''}`}>{r.reason}</span>
                    <span className="text-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className={`text-xs font-medium ${r.status === 'PENDING' ? 'text-yellow' : r.status === 'RESOLVED' ? 'text-green' : 'text-muted'}`}>{r.status}</span>
                  </div>
                  {r.description && <p className="text-muted text-sm mt-2">{r.description}</p>}
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleResolve(r.id)} className="p-1.5 rounded-lg text-green hover:bg-green/10 transition" title="Resolve"><Check size={16} /></button>
                    <button onClick={() => handleDismiss(r.id)} className="p-1.5 rounded-lg text-muted hover:text-red hover:bg-red/10 transition" title="Dismiss"><X size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
