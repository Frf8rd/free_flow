import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import Footer from './Footer.jsx';

export default function PublicShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-fm-mist/25">
      <header className="sticky top-0 z-40 border-b border-fm-ink/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="FairMatch, pagina principală"><Logo /></Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigare">
            <Link to="/browse" className="hidden rounded-md px-3 py-2 text-sm font-medium text-fm-ink hover:bg-fm-mist/60 sm:block">Explorează</Link>
            <ThemeToggle />
            <Link to="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-fm-ink hover:bg-fm-mist/60">Intră</Link>
            <Link to="/register" className="rounded-md bg-fm-accent-solid px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Creează cont</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
