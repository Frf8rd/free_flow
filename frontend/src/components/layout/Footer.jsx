import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-fm-ink/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><Logo /><p className="mt-2 max-w-xs text-sm text-fm-slate/70">Nu cel mai cunoscut. Cel mai potrivit.</p></div>
        <nav aria-label="Legături utile" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fm-slate/80">
          <Link to="/how-it-works" className="hover:text-fm-ink">Cum alegem</Link>
          <Link to="/terms" className="hover:text-fm-ink">Termeni</Link>
          <Link to="/privacy" className="hover:text-fm-ink">Confidențialitate</Link>
          <Link to="/contact" className="hover:text-fm-ink">Contact</Link>
        </nav>
      </div>
      <p className="border-t border-fm-ink/10 py-4 text-center text-xs text-fm-slate/50">© {new Date().getFullYear()} FairMatch</p>
    </footer>
  );
}
