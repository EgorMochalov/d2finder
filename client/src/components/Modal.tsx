import { ReactNode, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { X } from 'lucide-react';

interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; }

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => { if (open) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md animate-in glass-strong rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition p-1 rounded-lg hover:bg-surface-hover"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; danger?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted mb-6 text-sm">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-xl text-sm">{t('common.cancel')}</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`px-5 py-2 rounded-xl text-sm font-semibold text-white ${danger ? 'btn-primary' : 'btn-secondary'}`}>{confirmText || t('common.confirm')}</button>
      </div>
    </Modal>
  );
}
