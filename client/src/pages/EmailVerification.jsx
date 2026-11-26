import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell.jsx';
import Button from '../components/ui/Button.jsx';
import { Notice } from '../components/ui/Kit.jsx';
import { confirmEmailVerification } from '../services/auth.js';
import { useDocumentTitle } from '../lib/hooks.js';

export default function EmailVerification() {
  useDocumentTitle('Verificare email');
  const token = useSearchParams()[0].get('token');
  const started = useRef(false);
  const [state, setState] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Linkul de verificare este invalid sau a expirat.');

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    confirmEmailVerification(token)
      .then(() => setState('success'))
      .catch((error) => { setMessage(error.message || 'Linkul de verificare este invalid sau a expirat.'); setState('error'); });
  }, [token]);

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-fm-ink">Verificarea adresei</h1>
      <div className="mt-6 text-left">
        {state === 'loading' && <Notice tone="info" icon="info">Verificăm linkul…</Notice>}
        {state === 'success' && <Notice tone="success" icon="check">Adresa de email a fost verificată. Te poți autentifica.</Notice>}
        {state === 'error' && <Notice tone="danger" icon="alert">{message}</Notice>}
        <Link to={state === 'error' ? '/register' : '/login'} className="mt-5 block">
          <Button className="w-full">{state === 'error' ? 'Înapoi la înregistrare' : 'Mergi la autentificare'}</Button>
        </Link>
      </div>
    </AuthShell>
  );
}
