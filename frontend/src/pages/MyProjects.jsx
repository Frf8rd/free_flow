import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Card, Tag, Chip, Status, Tabs, Empty, Async } from '../components/ui/Kit.jsx';
import { useMyProjects, useDeleteProject } from '../hooks/queries.js';
import { useSession } from '../lib/session.jsx';
import { formatBudget, formatDate, PROJECT_STATUS } from '../lib/format.js';
import { useToast } from '../components/feedback/Toast.jsx';

const statusTone = { OPEN: 'accent', IN_PROGRESS: 'neutral', DELIVERED: 'warn', COMPLETED: 'success', CLOSED: 'outline' };
const filters = [null, 'OPEN', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CLOSED'];
const labels = ['Toate', 'Deschise', 'În lucru', 'Livrare de verificat', 'Finalizate', 'Închise'];

export default function MyProjects({ archived = false }) {
  const { mode } = useSession();
  const query = useMyProjects(mode === 'CLIENT');
  const remove = useDeleteProject();
  const { toast, error } = useToast();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const available = archived ? [null, 'COMPLETED', 'CLOSED'] : filters.slice(0, 4);
  const names = archived ? ['Toate', 'Finalizate', 'Închise'] : labels.slice(0, 4);
  const rows = useMemo(() => (query.data || []).filter((p) => (archived ? ['COMPLETED', 'CLOSED'].includes(p.status) : !['COMPLETED', 'CLOSED'].includes(p.status)) && (!available[tab] || p.status === available[tab]) && `${p.title} ${p.description}`.toLowerCase().includes(q.toLowerCase())), [query.data, archived, available.join(','), tab, q]);
  const counts = available.map((status) => ({ label: status ? labels[filters.indexOf(status)] : 'Toate', count: (query.data || []).filter((p) => archived ? (status ? p.status === status : ['COMPLETED', 'CLOSED'].includes(p.status)) : (status ? p.status === status : !['COMPLETED', 'CLOSED'].includes(p.status))).length }));
  const tabs = counts.map((x) => ({ label: x.label, count: x.count }));
  const del = async (project) => { if (!window.confirm(`Închizi proiectul „${project.title}”?`)) return; try { await remove.mutateAsync(project.id); toast('Proiectul a fost închis.'); } catch (e) { error(e); } };

  if (mode !== 'CLIENT') return <PageShell title="Proiectele mele" subtitle="Proiectele tale se gestionează în spațiul Client."><Card className="p-5"><p className="text-sm text-fm-slate">Schimbă spațiul de lucru din Setări pentru a gestiona proiectele postate.</p><Link to="/settings?section=account" className="mt-3 inline-flex font-semibold text-fm-accent hover:underline">Setări cont</Link></Card></PageShell>;
  return <PageShell title={archived ? 'Arhivă proiecte' : 'Proiectele mele'} subtitle={archived ? 'Proiecte finalizate sau închise.' : 'Proiectele publicate și răspunsurile primite.'} action={!archived && <Link to="/projects/new" className="inline-flex items-center gap-2 bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white"><Icon name="filePlus" className="h-4 w-4" /> Postează proiect</Link>}>
    <div className="grid gap-4"><label className="flex items-center gap-3 border border-fm-graphite/15 bg-white px-4 focus-within:ring-2 focus-within:ring-fm-graphite/30"><Icon name="search" className="h-5 w-5 text-fm-slate/50" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută în proiectele tale…" className="w-full bg-transparent py-3 text-sm text-fm-ink placeholder:text-fm-slate/45 focus:outline-none" /></label>
      <Tabs items={tabs} value={tab} onChange={setTab} />
      <Async q={query}>{() => rows.length === 0 ? <Card><Empty title={archived ? 'Arhiva e goală' : 'Nu ai proiecte în această listă'} text={archived ? 'Proiectele finalizate vor apărea aici.' : 'Postează un proiect ca să începi.'} action={!archived && <Link to="/projects/new" className="bg-fm-ink px-5 py-2.5 text-sm font-semibold text-white">Postează proiect</Link>} /></Card> : <Card className="overflow-hidden">{rows.map((p) => <article key={p.id} className="border-b border-fm-graphite/10 p-4 last:border-0 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h2 className="text-base font-semibold text-fm-ink">{p.title}</h2><p className="text-xs text-fm-slate/60">Postat {formatDate(p.createdAt)}</p></div><Status tone={statusTone[p.status] || 'neutral'}>{PROJECT_STATUS[p.status] || p.status}</Status></div><p className="mt-3 line-clamp-2 text-sm text-fm-slate/75">{p.description}</p><div className="mt-3 flex flex-wrap gap-2">{(p.skills || []).map((skill) => <Tag key={skill.id}>{skill.name}</Tag>)}<Chip icon="wallet">{formatBudget(p.budgetMin, p.budgetMax)}</Chip>{p.deadline && <Chip icon="calendar">Termen {formatDate(p.deadline)}</Chip>}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-fm-slate/70"><Icon name="sparkle" className="mr-1.5 inline h-4 w-4" />{p.matchesCount || 0} potriviri · {p.interestedCount || 0} interesați</p><div className="flex flex-wrap gap-2"><Link to={`/projects/${p.id}`} className="border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink">Detalii</Link>{!archived && p.status === 'OPEN' && <Link to={`/recommendations?project=${encodeURIComponent(p.id)}`} className="bg-fm-ink px-4 py-2 text-sm font-semibold text-white">Vezi potriviri</Link>}{!archived && p.status === 'OPEN' && <button onClick={() => del(p)} disabled={remove.isPending} className="border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-600">Închide</button>}</div></div></article>)}</Card>}</Async>
    </div>
  </PageShell>;
}
