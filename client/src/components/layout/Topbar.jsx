import { Link, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useCounts } from '../../hooks/queries.js';
import { useSession } from '../../lib/session.jsx';

export default function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const counts = useCounts();
  const { user } = useSession();
  const hasUnread = (counts.data?.notifications || 0) > 0;
  const title = pathname.startsWith('/recommendations') ? 'Potriviri' : pathname.startsWith('/projects') ? 'Proiecte' : pathname.startsWith('/browse') ? 'Explorează' : pathname.startsWith('/messages') ? 'Mesaje' : pathname.startsWith('/settings') ? 'Setări' : pathname.startsWith('/profile') ? 'Profil și portofoliu' : pathname.startsWith('/engagements') ? 'Colaborări' : pathname.startsWith('/notifications') ? 'Notificări' : pathname.startsWith('/admin') ? 'Administrare' : 'Dashboard';
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button onClick={onMenu} aria-label="Deschide meniul" className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-fm-graphite/15 bg-white sm:h-11 sm:w-11 text-fm-ink hover:bg-fm-mist/50 lg:hidden">
        <Icon name="menu" className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-fm-ink">{title}</h1>
      {user.role !== 'ADMIN' && <Link to="/notifications" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-md text-fm-ink hover:bg-fm-mist/60" aria-label="Notificări">
        <Icon name="bell" className="h-6 w-6" />
        {hasUnread && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-fm-page" />}
      </Link>}
      <ThemeToggle className="text-fm-ink" />
    </div>
  );
}
