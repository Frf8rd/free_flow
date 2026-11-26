import { Link } from 'react-router-dom';
import { LogoMark } from '../ui/Logo.jsx';
import { config } from '../../config.js';

// Formularul rămâne în centrul paginii, fără panoul de prezentare lateral.
export default function AuthShell({ children }) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-fm-page px-4 py-10">
      <main className="relative w-full max-w-md">
        <div className="mx-auto w-full max-w-sm text-center">
          <Link to="/" aria-label="FairMatch — pagina principală" className="mx-auto mb-7 inline-flex"><LogoMark className="h-12 w-12 text-fm-ink" /></Link>
          {children}
        </div>
      </main>
    </div>
  );
}

export const GoogleButton = ({ className = '' }) => (
  <button type="button" onClick={() => window.location.assign(config.googleAuthUrl)} className={`flex min-h-12 w-full items-center justify-center gap-3 border border-fm-graphite/15 bg-white px-4 py-3 text-sm font-semibold text-fm-ink transition hover:bg-fm-mist/40 ${className}`}>
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 000 9.6L5.7 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 002.1 7.2L5.7 10c.9-2.6 3.4-4.6 6.3-4.6z" />
    </svg>
    Continuă cu Google
  </button>
);

export const Divider = () => (
  <div className="my-6 flex items-center gap-4 text-xs text-fm-slate/50"><span className="h-px flex-1 bg-fm-graphite/10" /> sau <span className="h-px flex-1 bg-fm-graphite/10" /></div>
);
