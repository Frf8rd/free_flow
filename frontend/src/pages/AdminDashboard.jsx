import { useState } from 'react';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Card, Status, Tabs, Empty } from '../components/ui/Kit.jsx';
import { adminStats, adminUsers, adminReports, adminChart, adminFeed } from '../data/mockPages2.js';
import { myProjects } from '../data/mockPages.js';

const btn = 'rounded-md border border-fm-graphite/25 px-3 py-1.5 text-xs font-semibold text-fm-ink hover:bg-fm-mist/50';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState(adminUsers);
  const [projects, setProjects] = useState(myProjects);
  const [reports, setReports] = useState(adminReports);
  const open = reports.filter((r) => !r.resolved).length;
  const tabs = [{ label: 'Utilizatori', count: users.length }, { label: 'Proiecte', count: projects.length }, { label: 'Raportări', count: open }];
  const max = Math.max(...adminChart.map((c) => c[1]));
  const match = (t) => t.toLowerCase().includes(q.toLowerCase());

  return (
    <PageShell title="Administrare" subtitle="Moderează conturile, proiectele și raportările.">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {adminStats.map((s) => <Card key={s.label} className="p-4"><Icon name={s.icon} className="h-5 w-5 text-fm-graphite" /><p className="mt-2 text-2xl font-semibold text-fm-ink">{s.value}</p><p className="text-xs text-fm-slate/65">{s.label}</p><p className="mt-1 text-[11px] font-semibold text-fm-graphite">{s.delta}</p></Card>)}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-fm-ink">Conturi noi, ultimele 7 zile</p>
            <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Grafic cu conturile noi pe zile">
              {adminChart.map(([d, v], i) => <div key={i} className="flex flex-1 flex-col items-center gap-1.5"><span className="text-[11px] font-semibold text-fm-slate/70">{v}</span><div className="w-full rounded-md bg-fm-ink" style={{ height: `${(v / max) * 80}px` }} /><span className="text-[11px] text-fm-slate/55">{d}</span></div>)}
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold text-fm-ink">Activitate recentă</p>
            <ul className="mt-3 space-y-3">{adminFeed.map((a) => <li key={a} className="flex gap-2 text-xs text-fm-slate/80"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fm-graphite" />{a}</li>)}</ul>
          </Card>
        </div>

        <Tabs items={tabs} value={tab} onChange={setTab} />
        <label className="flex items-center gap-2.5 rounded-md border border-fm-ink/10 bg-white px-3.5 py-3 focus-within:ring-2 focus-within:ring-fm-graphite/30"><Icon name="search" className="h-4 w-4 text-fm-slate/60" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrează în listă…" aria-label="Filtrează" className="w-full bg-transparent text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none" /></label>

        <Card className="overflow-hidden">
          {tab === 0 && users.filter((u) => match(`${u.name} ${u.email}`)).map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-fm-graphite/10 p-4 last:border-b-0">
              <div className="min-w-0"><p className="text-sm font-semibold text-fm-ink">{u.name}</p><p className="text-xs text-fm-slate/65">{u.email} · din {u.joined}</p></div>
              <div className="flex items-center gap-3">{u.blocked && <Status tone="dark">Blocat</Status>}<button className={btn} onClick={() => setUsers(users.map((x) => (x.id === u.id ? { ...x, blocked: !x.blocked } : x)))}>{u.blocked ? 'Deblochează' : 'Blochează'}</button></div>
            </div>))}
          {tab === 1 && (projects.length === 0 ? <Empty title="Niciun proiect" /> : projects.filter((p) => match(p.title)).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-fm-graphite/10 p-4 last:border-b-0">
              <div className="min-w-0"><p className="text-sm font-semibold text-fm-ink">{p.title}</p><p className="text-xs text-fm-slate/65">{p.budget} · {p.time}</p></div>
              <button className={`${btn} !text-red-600`} onClick={() => setProjects(projects.filter((x) => x.id !== p.id))}>Șterge</button>
            </div>)))}
          {tab === 2 && reports.filter((r) => match(`${r.target} ${r.reason}`)).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-fm-graphite/10 p-4 last:border-b-0">
              <div className="min-w-0"><p className="text-sm font-semibold text-fm-ink">{r.target}</p><p className="text-xs text-fm-slate/65">{r.reason} · raportat de {r.by} · {r.targetType.toLowerCase()}</p></div>
              {r.resolved ? <Status tone="outline">Rezolvată</Status> : <button className={btn} onClick={() => setReports(reports.map((x) => (x.id === r.id ? { ...x, resolved: true } : x)))}>Marchează rezolvată</button>}
            </div>))}
        </Card>
      </div>
    </PageShell>
  );
}
