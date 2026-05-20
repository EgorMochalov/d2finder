import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n, translateApiError } from '../lib/i18n';
import { Shield, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (username.length < 3) e.username = t('register.min3');
    if (!/^[a-zA-Zа-яА-Я0-9_]+$/.test(username)) e.username = t('register.invalid_chars');
    if (!email.includes('@')) e.email = t('register.invalid_email');
    if (password.length < 6) e.password = t('register.min6');
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    try {
      const res = await api.auth.register({ username, email, password });
      login(res.token, res.user);
      navigate('/');
    } catch (err: any) { setErrors({ form: translateApiError(err, t) }); }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <Helmet>
        <title>Sign Up — Dota 2 Finder</title>
        <meta property="og:title" content="Sign Up — Dota 2 Finder" />
      </Helmet>
      <div className="glass-strong rounded-2xl p-8">
        <div className="text-center mb-6">
          <div className="avatar-square w-14 h-14 mx-auto mb-4 text-2xl"><Shield size={24} /></div>
          <h1 className="text-2xl font-bold text-text">{t('nav.register')}</h1>
          <p className="text-muted text-sm mt-1">{t('register.join')}</p>
        </div>
        {errors.form && <div className="flex items-start gap-2 bg-accent-dim border border-accent/20 text-accent rounded-xl p-3 mb-5 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{errors.form}</span></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-muted text-sm block mb-1.5">{t('register.username')}</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${errors.username ? 'error' : ''}`} required />{errors.username && <p className="text-accent text-xs mt-1">{errors.username}</p>}</div>
          <div><label className="text-muted text-sm block mb-1.5">{t('register.email')}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${errors.email ? 'error' : ''}`} required />{errors.email && <p className="text-accent text-xs mt-1">{errors.email}</p>}</div>
          <div><label className="text-muted text-sm block mb-1.5">{t('register.password')}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`glass-input w-full rounded-xl px-4 py-2.5 text-sm ${errors.password ? 'error' : ''}`} required />{errors.password && <p className="text-accent text-xs mt-1">{errors.password}</p>}</div>
          <button type="submit" className="btn-primary w-full py-2.5 rounded-xl text-sm">{t('nav.register')}</button>
        </form>
        <p className="text-muted text-sm text-center mt-5">{t('register.already')} <Link to="/login" className="text-accent hover:underline font-medium">{t('nav.signin')}</Link></p>
      </div>
    </div>
  );
}
