import { useEffect, useRef, useState } from 'react';

/** Meniu simplu: se închide la click în afară sau Escape. `trigger` primește { open, toggle }. */
export default function Dropdown({ trigger, children, side = 'bottom', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={`fm-restore absolute z-50 w-60 rounded-md border border-fm-graphite/15 bg-white p-1.5 text-fm-ink shadow-xl ${
            { right: 'left-full top-0 ml-3', 'right-up': 'left-full bottom-0 ml-3', top: 'bottom-full left-0 mb-2', bottom: 'left-0 top-full mt-2' }[side]
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export const MenuItem = ({ children, ...props }) => (
  <button role="menuitem" {...props} className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition hover:bg-fm-mist/50">
    {children}
  </button>
);
