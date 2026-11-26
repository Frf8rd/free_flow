import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell.jsx';
import { Field, Text } from '../components/ui/Fields.jsx';
import Button from '../components/ui/Button.jsx';
import { Notice } from '../components/ui/Kit.jsx';
import useForm from '../lib/useForm.js';
import { resetSchema } from '../lib/validators.js';
import { resetPassword } from '../services/auth.js';
import { useDocumentTitle } from '../lib/hooks.js';

export default function ResetPassword() {
  useDocumentTitle('Parolă nouă');
  const token = useSearchParams()[0].get('token');
  const [done, setDone] = useState(false);
  const f = useForm(resetSchema, { password: '', confirm: '' });
  const onSubmit = f.submit(async (d) => { await resetPassword({ token, password: d.password }); setDone(true); });

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-fm-ink">Alege o parolă nouă</h1>
      {!token ? (
        <div className="mt-6 text-left"><Notice tone="danger" icon="alert">Linkul este invalid sau a expirat. Cere unul nou.</Notice><Link to="/forgot-password" className="mt-6 block text-center text-sm font-semibold text-fm-accent hover:underline">Cere alt link</Link></div>
      ) : done ? (
        <div className="mt-6 text-left"><Notice tone="success" icon="check">Parola a fost schimbată. Te poți autentifica.</Notice><Link to="/login" className="mt-6 block rounded-md bg-fm-accent-solid px-6 py-3 text-center text-sm font-semibold text-white">Intră în cont</Link></div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4 text-left">
          {f.formError && <Notice tone="danger" icon="alert">{f.formError}</Notice>}
          <Field label="Parolă nouă" hint="Minim 12 caractere." error={f.errors.password}><Text type="password" autoComplete="new-password" error={f.errors.password} {...f.bind('password')} /></Field>
          <Field label="Repetă parola" error={f.errors.confirm}><Text type="password" autoComplete="new-password" error={f.errors.confirm} {...f.bind('confirm')} /></Field>
          <Button type="submit" loading={f.submitting} className="w-full">Salvează parola</Button>
        </form>
      )}
    </AuthShell>
  );
}
