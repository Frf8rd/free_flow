import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell.jsx';
import Input, { MailIcon } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Notice } from '../components/ui/Kit.jsx';
import { forgotPassword } from '../services/auth.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try { await forgotPassword(email.trim()); setSubmitted(true); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-fm-ink">Ai uitat parola?</h1>
      <p className="mt-2 text-sm text-fm-slate/70">Introdu emailul contului pentru a primi un link de resetare.</p>
      <form onSubmit={submit} className="mt-7 space-y-4 text-left">
        <Input label="Email" type="email" placeholder="nume@exemplu.md" icon={MailIcon} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        {error && <Notice tone="danger" icon="alert">{error}</Notice>}
        <Button type="submit" className="w-full" disabled={!email.trim()} loading={loading}>Solicită resetarea</Button>
      </form>
      {submitted && <Notice tone="info" icon="info" className="mt-4">Dacă există un cont cu această adresă, vei primi un link pentru resetarea parolei.</Notice>}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-fm-graphite hover:underline">Înapoi la autentificare</Link></p>
    </AuthShell>
  );
}
