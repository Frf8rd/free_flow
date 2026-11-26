import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell, { Divider, GoogleButton } from '../components/layout/AuthShell.jsx';
import Input, { MailIcon, LockIcon } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../store/authStore.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Introdu un email valid.';
    if (!form.password) er.password = 'Introdu parola.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const user = await login(form);
      navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : user.onboarded === false ? '/onboarding' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onGoogleSuccess(user) {
    navigate(location.state?.from || (user.role === 'ADMIN' ? '/admin' : user.onboarded === false ? '/onboarding' : '/dashboard'), { replace: true });
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-fm-ink">Bine ai revenit!</h1>
      <p className="mt-2 text-sm text-fm-slate/70">Conectează-te pentru a continua în FairMatch.</p>

      <div className="mt-6"><GoogleButton role="FREELANCER" onSuccess={onGoogleSuccess} /><Divider /></div>

      <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
        <Input label="Email" type="email" placeholder="nume@exemplu.md" icon={MailIcon} value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <Input label="Parolă" type="password" placeholder="Parola ta" icon={LockIcon} value={form.password} onChange={set('password')} error={errors.password} autoComplete="current-password" />
        <div className="flex justify-end text-sm"><Link to="/forgot-password" className="font-semibold text-fm-graphite hover:underline">Ai uitat parola?</Link></div>
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
        <Button type="submit" loading={loading} className="w-full rounded-md py-3.5">Autentificare</Button>
      </form>

      <p className="mt-6 text-center text-sm text-fm-slate/70">Nu ai cont? <Link to="/register" className="font-semibold text-fm-graphite hover:underline">Înregistrează-te</Link></p>
    </AuthShell>
  );
}
