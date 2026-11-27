import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import { Card, Empty, Pagination, Async } from '../components/ui/Kit.jsx';
import { Field, Select, Text } from '../components/ui/Fields.jsx';
import { FreelancerCard, ProjectCard } from '../components/match/Cards.jsx';
import SkillSelector from '../components/forms/SkillSelector.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useCategories, useFreelancerSearch, useProjectSearch } from '../hooks/queries.js';
import { useDebounce } from '../lib/hooks.js';
import { useSession } from '../lib/session.jsx';

const availability = [{ value: '', label: 'Orice disponibilitate' }, { value: 'AVAILABLE', label: 'Disponibil' }, { value: 'LIMITED', label: 'Disponibilitate limitată' }, { value: 'UNAVAILABLE', label: 'Indisponibil' }];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const { mode } = useSession();
  const [tab, setTab] = useState(mode === 'FREELANCER' ? 1 : 0);
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [skillIds, setSkillIds] = useState([]);
  const [maxRate, setMaxRate] = useState('');
  const [availabilityId, setAvailabilityId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dq = useDebounce(q, 250);
  const categories = useCategories();
  const freelancerQuery = useFreelancerSearch({ q: dq || undefined, categoryId: categoryId || undefined, skillIds, maxRate: maxRate || undefined, availability: availabilityId || undefined, page, limit: 12, _on: tab === 0 });
  const projectQuery = useProjectSearch({ q: dq || undefined, categoryId: categoryId || undefined, skillIds, maxBudget: maxRate || undefined, status: 'OPEN', page, limit: 12, _on: tab === 1 });
  const active = tab === 0 ? freelancerQuery : projectQuery;
  const data = active.data;
  const list = data?.data || [];
  useEffect(() => { setQ(params.get('q') || ''); }, [params]);
  useEffect(() => { setPage(1); }, [dq, categoryId, skillIds.join(','), maxRate, availabilityId, tab]);
  const reset = () => { setQ(''); setCategoryId(''); setSkillIds([]); setMaxRate(''); setAvailabilityId(''); setPage(1); setParams({}, { replace: true }); };
  const categoryOptions = [{ value: '', label: 'Toate categoriile' }, ...(categories.data || []).map((c) => ({ value: c.id, label: c.name }))];
  const filterPanel = <Card className="grid min-w-0 h-fit gap-4 p-4">
    <Field label="Categorie"><Select options={categoryOptions} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} /></Field>
    {tab === 0 ? <><Field label="Disponibilitate"><Select options={availability} value={availabilityId} onChange={(e) => setAvailabilityId(e.target.value)} /></Field><Field label="Tarif maxim / oră"><Text type="number" inputMode="numeric" min="0" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} placeholder="Orice tarif" /></Field></> : <Field label="Buget maxim"><Text type="number" inputMode="numeric" min="0" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} placeholder="Orice buget" /></Field>}
    <div className="min-w-0"><p className="mb-2 text-sm font-medium text-fm-ink">Abilități</p><SkillSelector value={skillIds} onChange={setSkillIds} max={8} stacked /></div>
    <button onClick={reset} className="text-left text-xs font-semibold text-fm-accent hover:underline">Resetează filtrele</button>
  </Card>;

  return <PageShell title="Explorează" subtitle="Filtrează catalogul de proiecte și profile publice.">
    <div className="grid min-w-0 gap-4">
      <label className="flex min-w-0 items-center gap-2.5 border border-fm-ink/10 bg-white px-3.5 py-3 focus-within:ring-2 focus-within:ring-fm-graphite/30"><Icon name="search" className="h-4 w-4 shrink-0 text-fm-slate/60" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 0 ? 'Caută freelanceri…' : 'Caută proiecte…'} aria-label="Caută în catalog" className="min-w-0 w-full bg-transparent text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none" /></label>
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="grid min-w-0 h-fit gap-3">
          <button onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="flex items-center justify-center gap-2 border border-fm-graphite/25 py-2.5 text-sm font-semibold text-fm-ink xl:hidden"><Icon name="sliders" className="h-4 w-4" />Filtre</button>
          <div className={`${filtersOpen ? 'block' : 'hidden'} xl:block`}>{filterPanel}</div>
        </aside>

        <div className="grid min-w-0 content-start gap-4">
        <div className="flex min-w-0 items-end justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex gap-5 border-b border-fm-ink/10"><button onClick={() => setTab(0)} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 0 ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Freelanceri</button><button onClick={() => setTab(1)} className={`border-b-2 pb-3 text-sm font-semibold ${tab === 1 ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60'}`}>Proiecte</button></div></div><span className="pb-3 text-xs text-fm-slate/60">{data?.total ?? ''} rezultate</span></div>
        <Async q={active}>{() => list.length === 0 ? <Card><Empty icon="search" title={tab === 0 ? 'Niciun freelancer găsit' : 'Niciun proiect găsit'} text="Încearcă să schimbi termenul sau filtrele." action={<button onClick={reset} className="border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink">Resetează filtrele</button>} /></Card> : <div className="grid gap-3 sm:grid-cols-2">{list.map((item) => tab === 0 ? <FreelancerCard key={item.id} f={item} action={<span className="text-xs text-fm-slate/60">{item.completedProjects ?? item.completedCount ?? 0} proiecte</span>} /> : <ProjectCard key={item.id} p={item} />)}</div>}</Async>
        <Pagination page={data?.page || page} limit={data?.limit || 12} total={data?.total || 0} onChange={setPage} />
        </div>
      </div>
    </div>
  </PageShell>;
}
