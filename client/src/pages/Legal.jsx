import { Link, useLocation } from 'react-router-dom';
import PublicShell from '../components/layout/PublicShell.jsx';
import { Card } from '../components/ui/Kit.jsx';

export default function Legal({ kind: suppliedKind }) {
  const location = useLocation();
  const kind = suppliedKind || (location.pathname === '/privacy' || new URLSearchParams(location.search).get('kind') === 'privacy' ? 'privacy' : 'terms');
  const privacy = kind === 'privacy';
  return <PublicShell><main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
    <Link to="/" className="text-sm font-semibold text-fm-slate/70 hover:text-fm-ink">← Acasă</Link>
    <h1 className="mt-5 text-3xl font-bold tracking-tight text-fm-ink">{privacy ? 'Confidențialitate' : 'Termeni'}</h1>
    <p className="mt-2 text-sm text-fm-slate/70">{privacy ? 'Politica de confidențialitate va fi publicată înainte de lansarea platformei.' : 'Termenii de utilizare vor fi publicați înainte de lansarea platformei.'}</p>
    <Card className="mt-8 min-h-44 p-5 sm:p-8"><p className="text-sm text-fm-slate/65">Conținut în pregătire.</p></Card>
    <nav className="mt-5 flex gap-4 text-sm font-semibold"><Link to="/terms" className={!privacy ? 'text-fm-ink' : 'text-fm-slate/65'}>Termeni</Link><Link to="/privacy" className={privacy ? 'text-fm-ink' : 'text-fm-slate/65'}>Confidențialitate</Link></nav>
  </main></PublicShell>;
}
