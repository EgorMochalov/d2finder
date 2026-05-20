import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n, translateApiError } from '../lib/i18n';
import { Shield, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { login: authLogin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!login.trim()) e.login = t('register.required');
    if (!password) e.password = t('register.required');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    try {
      const res = await api.auth.login({ login, password });
      authLogin(res.token, res.user);
      navigate('/');
    } catch (err: any) { setError(translateApiError(err, t)); }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="glass-strong rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="avatar-square w-14 h-14 mx-auto mb-4 text-2xl"><Shield size={24} /></div>
          <h1 className="text-2xl font-bold text-text">{t('login.welcome')}</h1>
          <p className="text-muted text-sm mt-1">{t('nav.signin')}</p>
        </div>
        {error && <div className="flex items-start gap-2 bg-accent-dim border border-accent/20 text-accent rounded-xl p-3 mb-5 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-muted text-sm block mb-1.5">{t('login.username_email')}</label><input type="text" value={login} onChange={(e) => { setLogin(e.target.value); setFieldErrors((p) => ({ ...p, login: '' })); }} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${fieldErrors.login ? 'error' : ''}`} required /><span className="text-accent text-xs mt-1 block min-h-[1em]">{fieldErrors.login || ''}</span></div>
          <div><label className="text-muted text-sm block mb-1.5">{t('login.password')}</label><input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${fieldErrors.password ? 'error' : ''}`} required /><span className="text-accent text-xs mt-1 block min-h-[1em]">{fieldErrors.password || ''}</span></div>
          <button type="submit" className="btn-primary w-full py-2.5 rounded-xl text-sm">{t('nav.signin')}</button>
        </form>
        <p className="text-muted text-sm text-center mt-5">{t('login.no_account')} <Link to="/register" className="text-accent hover:underline font-medium">{t('nav.register')}</Link></p>
      </div>
    </div>
  );
}
