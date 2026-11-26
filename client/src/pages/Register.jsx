import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { Divider, GoogleButton } from '../components/layout/AuthShell.jsx';
import Input, { MailIcon, LockIcon, UserIcon } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../store/authStore.js';

function strength(p) {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) n++;
  return n;
}
const labels = ['Prea scurtă', 'Slabă', 'Acceptabilă', 'Bună', 'Foarte bună'];

export default function Register() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'FREELANCER' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };
  const s = strength(form.password);

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Introdu numele tău.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email invalid.';
    if (form.password.length < 8) e.password = 'Minim 8 caractere.';
    if (!terms) e.terms = 'Acceptă termenii ca să continui.';
    return e;
  }
  const go = () => navigate('/onboarding');

  function onGoogleSuccess(user) {
    navigate(user.role === 'ADMIN' ? '/admin' : user.onboarded === false ? '/onboarding' : '/dashboard', { replace: true });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await register(form);
      go();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-fm-ink">Creează-ți contul</h1>
      <p className="mt-2 text-sm text-fm-slate/70">Alege spațiul de lucru principal. Îl poți schimba din cont.</p>

      <form onSubmit={onSubmit} className="space-y-4 text-left" noValidate>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-2 text-sm font-medium text-fm-ink">Vreau să mă înscriu ca</legend>
          {[["CLIENT", "Client"], ["FREELANCER", "Freelancer"]].map(([role, label]) => <button key={role} type="button" role="radio" aria-checked={form.role === role} onClick={() => setForm({ ...form, role })} className={`border px-3 py-3 text-sm font-semibold transition ${form.role === role ? 'border-fm-ink bg-fm-mist/70 text-fm-ink' : 'border-fm-graphite/20 text-fm-slate hover:bg-fm-mist/40'}`}>{label}</button>)}
        </fieldset>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fm-slate/80">
          <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setErrors({ ...errors, terms: '' }); }} className="mt-0.5 h-4 w-4 accent-fm-ink" />
          <span>Accept <Link to="/legal?kind=terms" className="font-semibold text-fm-graphite hover:underline">Termenii</Link> și <Link to="/legal?kind=privacy" className="font-semibold text-fm-graphite hover:underline">Politica de confidențialitate</Link>.</span>
        </label>
        {errors.terms && <p className="-mt-2 text-xs text-red-500">{errors.terms}</p>}
        <GoogleButton role={form.role} mode="register" disabled={!terms} onSuccess={onGoogleSuccess} />
        <Divider />
        <Input placeholder="Nume complet" icon={UserIcon} value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input type="email" placeholder="Email" icon={MailIcon} value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <div>
          <Input type="password" placeholder="Parolă (min. 8 caractere)" icon={LockIcon} value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          {form.password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= s ? 'bg-fm-ink' : 'bg-fm-mist'}`} />)}</div>
              <p className="mt-1 text-xs text-fm-slate/60">Parolă: {labels[s]}</p>
            </div>)}
        </div>
        {serverError && (
          <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {serverError}
          </div>)}
        <Button type="submit" loading={loading} className="w-full rounded-md">Creează cont</Button>
      </form>

      <p className="mt-6 text-center text-sm text-fm-slate/70">Ai deja cont? <Link to="/login" className="font-semibold text-fm-graphite hover:underline">Autentifică-te</Link></p>
    </AuthShell>
  );
}
