import { useMemo, useState } from 'react';
import { useCategories, useSkills } from '../../hooks/queries.js';
import { useDebounce } from '../../lib/hooks.js';
import Icon from '../ui/Icon.jsx';
import { Select } from '../ui/Fields.jsx';

// Selector de abilități din catalogul real (GET /skills): căutare + filtrare pe categorie, selecția apare ca etichete.
export default function SkillSelector({ value, onChange, max = 30, error, stacked = false }) {
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const dq = useDebounce(q, 250);
  const cats = useCategories();
  const all = useSkills({});                       // catalogul complet (cache 24h): pentru etichetele selectate
  const found = useSkills({ q: dq || undefined, categoryId: categoryId || undefined });
  const byId = useMemo(() => Object.fromEntries((all.data || []).map((s) => [s.id, s])), [all.data]);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : value.length >= max ? value : [...value, id]);

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Abilități selectate">
          {value.map((id) => (
            <button type="button" key={id} onClick={() => toggle(id)} className="inline-flex items-center gap-1.5 rounded-md bg-fm-accent-solid px-3 py-1.5 text-xs font-semibold text-white" aria-label={`Elimină ${byId[id]?.name || id}`}>
              {byId[id]?.name || '…'} <Icon name="close" className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className={`flex min-w-0 flex-col gap-2 ${stacked ? '' : 'sm:flex-row'}`}>
        <label className="relative min-w-0 flex-1"><span className="sr-only">Caută abilitate</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fm-slate/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută o abilitate (ex. React, logo, traducere)…" className="w-full rounded-md border border-fm-graphite/15 bg-white py-2.5 pl-9 pr-3 text-sm text-fm-ink focus:border-fm-accent-solid focus:outline-none focus:ring-2 focus:ring-fm-accent-solid/30" />
        </label>
        <div className={stacked ? 'w-full' : 'w-full shrink-0 sm:w-56'}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Categorie" className="w-full" options={[{ value: '', label: 'Toate categoriile' }, ...(cats.data || []).map((c) => ({ value: c.id, label: c.name }))]} />
        </div>
      </div>
      <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
        {found.isPending && <span className="text-sm text-fm-slate/60">Se încarcă…</span>}
        {found.isError && <span className="text-sm text-red-500">Nu am putut încărca abilitățile.</span>}
        {found.data?.length === 0 && <span className="text-sm text-fm-slate/60">Nicio abilitate găsită.</span>}
        {found.data?.map((s) => (
          <button type="button" key={s.id} onClick={() => toggle(s.id)} aria-pressed={value.includes(s.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value.includes(s.id) ? 'bg-fm-accent-solid/15 text-fm-accent ring-1 ring-fm-accent-solid/40' : 'bg-fm-mist/70 text-fm-ink hover:bg-fm-mist'}`}>{s.name}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-fm-slate/60">{value.length}/{max} selectate</p>
      {error && <span role="alert" className="mt-1 block text-xs text-red-500">{error}</span>}
    </div>
  );
}
