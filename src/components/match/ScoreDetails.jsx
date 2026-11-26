import { useState } from 'react';
import Icon from '../ui/Icon.jsx';

const LABELS = { skills: 'Abilități', evidence: 'Dovezi (portofoliu)', budget: 'Buget și tarif', availability: 'Disponibilitate', level: 'Nivel', reviews: 'Recenzii' };

// Scorul poate fi reconstruit: arătăm fiecare componentă (README: explicații pentru fiecare recomandare)
export default function ScoreDetails({ components }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(components || {}).filter(([k]) => LABELS[k]);
  if (!entries.length) return null;
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1 text-xs font-semibold text-fm-accent hover:underline">
        Cum s-a calculat <Icon name="chevron" className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {entries.map(([k, v]) => (
            <li key={k} className="flex items-center gap-3 text-xs">
              <span className="w-36 shrink-0 text-fm-slate/75">{LABELS[k]}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fm-mist/70"><span className="block h-full rounded-full bg-fm-accent-solid" style={{ width: `${Math.round(v * 100)}%` }} /></span>
              <span className="w-9 text-right font-semibold text-fm-ink">{Math.round(v * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
