import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo.jsx';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-fm-page px-6 text-center">
      <div>
        <Logo className="mx-auto mb-8 justify-center" />
        <p className="text-6xl font-bold tracking-tight text-fm-ink">404</p>
        <h1 className="mt-3 text-lg font-semibold text-fm-ink">Pagina nu există</h1>
        <p className="mt-1 text-sm text-fm-slate/70">Linkul e greșit sau pagina a fost mutată.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-md bg-fm-ink px-6 py-3 text-sm font-semibold text-white hover:bg-fm-graphite">Înapoi la Dashboard</Link>
      </div>
    </main>
  );
}
