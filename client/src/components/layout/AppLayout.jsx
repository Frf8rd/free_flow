import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarContent from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAuth } from '../../store/authStore.js';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('fm-sidebar') === '1'; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardBackgroundUrl = useAuth((state) => state.user?.dashboardBackgroundUrl || '');
  const [background, setBackground] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fm-dashboard-background'));
      return saved?.kind === 'gradient' ? saved.value : '';
    } catch { return ''; }
  });
  const { pathname } = useLocation();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => { try { localStorage.setItem('fm-sidebar', collapsed ? '1' : '0'); } catch { /* ignorat */ } }, [collapsed]);
  useEffect(() => {
    const onChange = (event) => setBackground(event.detail?.kind === 'gradient' ? event.detail.value : '');
    const onStorage = (event) => {
      if (event.key !== 'fm-dashboard-background') return;
      try { const saved = JSON.parse(event.newValue); setBackground(saved?.kind === 'gradient' ? saved.value : ''); } catch { setBackground(''); }
    };
    window.addEventListener('fm-dashboard-background-change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('fm-dashboard-background-change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Escape închide meniul de pe telefon.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-dvh">
     {/* Fundalul selectat rămâne vizibil în spatele conținutului pe toate rutele. */}
     <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-fm-page/75" style={{ backgroundImage: dashboardBackgroundUrl ? `url("${dashboardBackgroundUrl}")` : background || undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <aside aria-label="Bară laterală" className={`fm-dark hidden shrink-0 bg-fm-ink transition-[width] duration-200 ease-out lg:block ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Meniu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[min(18rem,calc(100vw-3rem))] sm:left-3 sm:top-3 sm:h-[calc(100%-1.5rem)] fm-dark overflow-hidden rounded-lg bg-fm-ink shadow-xl">
            <SidebarContent mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-fm-page/70">
        <div className="shrink-0 border-b border-fm-ink/10 px-3 py-3 sm:px-5 sm:py-4"><Topbar onMenu={() => setMobileOpen(true)} /></div>
        {children}
      </div>
     </div>
    </div>
  );
}
