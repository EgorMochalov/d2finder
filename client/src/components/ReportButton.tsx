import { useState } from 'react';
import { Flag } from 'lucide-react';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import Modal from './Modal';
import { useToast } from './Toast';

interface Props {
  reportedUserId?: string;
  reportedTeamId?: string;
  className?: string;
}

const REASONS = ['SPAM', 'HARASSMENT', 'IMPERSONATION', 'CHEATING', 'INAPPROPRIATE', 'OTHER'] as const;

export default function ReportButton({ reportedUserId, reportedTeamId, className = '' }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('SPAM');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setSending(true);
    try {
      await api.reports.create({ reportedUserId, reportedTeamId, reason, description: description || undefined });
      toast('success', t('report.sent'));
      setOpen(false);
      setDescription('');
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={`p-1.5 rounded-lg text-muted hover:text-red hover:bg-surface-hover transition ${className}`} title={t('report.title')}>
        <Flag size={14} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('report.title')}>
        <div className="space-y-4">
          <div>
            <label className="field-label">{t('report.reason')}</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="glass-select w-full rounded-xl px-3 py-2 text-sm">
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t('report.description')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="glass-textarea w-full rounded-xl px-4 py-2.5 text-sm" rows={3} maxLength={1000} />
          </div>
          <button onClick={handleSubmit} disabled={sending} className="btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
            {sending ? t('common.sending') : t('report.submit')}
          </button>
        </div>
      </Modal>
    </>
  );
}
