import Icon from './Icon.jsx';
import { useSession } from '../../lib/session.jsx';

export default function ThemeToggle({ className = '' }) {
  const { dark, setTheme } = useSession();
  return (
    <button onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Comută pe tema deschisă' : 'Comută pe tema întunecată'} title={dark ? 'Tema deschisă' : 'Tema întunecată'}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-md transition hover:bg-fm-mist/60 ${className}`}>
      <Icon name={dark ? 'sun' : 'moon'} className="h-5 w-5" />
    </button>
  );
}
