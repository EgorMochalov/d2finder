import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export default function BackButton() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/') return null;
  return (
    <button onClick={() => navigate(-1)}
      className="w-10 h-10 rounded-full glass-strong flex items-center justify-center text-text hover:text-accent transition hover:scale-105 shadow-lg"
      title={t('common.back')}>
      <ChevronLeft size={20} />
    </button>
  );
}
