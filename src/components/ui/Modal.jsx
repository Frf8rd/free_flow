import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function Modal({ open, onClose, title, children, footer, size = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={`fm-pop relative max-h-[92dvh] w-full ${size} overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl focus:outline-none sm:rounded-xl sm:p-6`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-fm-ink">{title}</h2>
          <button onClick={onClose} aria-label="Închide" className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-fm-slate/70 hover:bg-fm-mist/60"><Icon name="close" className="h-4 w-4" /></button>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
