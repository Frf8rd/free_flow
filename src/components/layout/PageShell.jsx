import { useEffect } from 'react';
import AppLayout from './AppLayout.jsx';

// Cadrul comun al paginilor din aplicație: sidebar + topbar (AppLayout) + titlu + zonă care derulează
export default function PageShell({ title, subtitle, action, children, width = 'max-w-7xl', docTitle }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${docTitle || title || 'FairMatch'} · FairMatch`;
    return () => { document.title = previous; };
  }, [docTitle, title]);
  return (
    <AppLayout>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-fm-mist/25">
        <div className={`mx-auto w-full ${width} p-3 sm:px-6 sm:py-5`}>
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-fm-ink sm:text-2xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-fm-slate/70">{subtitle}</p>}
            </div>
            {action}
          </header>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
