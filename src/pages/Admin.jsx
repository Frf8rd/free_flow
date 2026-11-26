import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import { Async, Card, Empty, Pagination, StatCard, Status, Tabs } from '../components/ui/Kit.jsx';
import { useToast } from '../components/feedback/Toast.jsx';
import { useAuth } from '../store/authStore.js';
import { useAdminProjects, useAdminRemoveProject, useAdminReports, useAdminResolveReport, useAdminStats, useAdminUpdateUser, useAdminUsers } from '../hooks/queries.js';
import { useDebounce } from '../lib/hooks.js';
import { PROJECT_STATUS, ROLE_LABEL, formatDate, timeAgo } from '../lib/format.js';

const Table = ({ head, children }) => (
  <Card className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-fm-ink/10 bg-fm-mist/30 text-xs uppercase tracking-wider text-fm-slate/60">{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-fm-ink/10">{children}</tbody></table></Card>
);

function Stats() {
  const q = useAdminStats();
  return (
    <Async q={q}>
      {(s) => (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon="users" value={s.users} label="Utilizatori" /><StatCard icon="user" value={s.freelancers} label="Freelanceri" />
          <StatCard icon="briefcase" value={s.projects} label="Proiecte" hint={`${s.openProjects} deschise`} /><StatCard icon="handshake" value={s.engagements} label="Colaborări" />
          <StatCard icon="flag" value={s.openReports} label="Raportări deschise" />
        </div>
      )}
    </Async>
  );
}

function Users() {
  const me = useAuth((s) => s.user);
  const [q, setQ] = useState(''), [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const query = useAdminUsers({ q: dq || undefined, page, limit: 20 });
  const upd = useAdminUpdateUser();
  const { toast, error } = useToast();
  const toggle = async (u) => { try { await upd.mutateAsync({ id: u.id, isBlocked: !u.isBlocked }); toast(u.isBlocked ? 'Utilizator deblocat.' : 'Utilizator blocat.'); } catch (e) { error(e); } };
  return (
    <>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Caută utilizator" placeholder="Caută după nume sau email…" className="mb-4 w-full max-w-sm rounded-md border border-fm-graphite/15 bg-white px-4 py-2.5 text-sm text-fm-ink focus:border-fm-accent-solid focus:outline-none focus:ring-2 focus:ring-fm-accent-solid/30" />
      <Async q={query}>
        {(d) => !d.data.length ? <Card><Empty icon="users" title="Niciun utilizator găsit" /></Card> : (
          <>
            <Table head={['Nume', 'Email', 'Rol', 'Înscris', 'Stare', '']}>
              {d.data.map((u) => (
                <tr key={u.id}><td className="px-4 py-3 font-semibold text-fm-ink">{u.name}</td><td className="px-4 py-3 text-fm-slate/75">{u.email}</td><td className="px-4 py-3">{ROLE_LABEL[u.role]}</td><td className="px-4 py-3 text-fm-slate/65">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.isBlocked ? <Status tone="danger">Blocat</Status> : <Status tone="success">Activ</Status>}</td>
                  <td className="px-4 py-3 text-right">{u.id !== me.id && <button onClick={() => toggle(u)} className="font-semibold text-fm-accent hover:underline">{u.isBlocked ? 'Deblochează' : 'Blochează'}</button>}</td></tr>
              ))}
            </Table>
            <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
          </>
        )}
      </Async>
    </>
  );
}

function Projects() {
  const [page, setPage] = useState(1);
  const q = useAdminProjects({ page, limit: 20 });
  const rm = useAdminRemoveProject();
  const { toast, error } = useToast();
  const remove = async (p) => { if (!window.confirm(`Ștergi „${p.title}"?`)) return; try { await rm.mutateAsync(p.id); toast('Proiect șters.'); } catch (e) { error(e); } };
  return (
    <Async q={q}>
      {(d) => !d.data.length ? <Card><Empty icon="briefcase" title="Niciun proiect" /></Card> : (
        <>
          <Table head={['Proiect', 'Client', 'Stare', 'Postat', '']}>
            {d.data.map((p) => <tr key={p.id}><td className="px-4 py-3"><Link to={`/projects/${p.id}`} className="font-semibold text-fm-ink hover:underline">{p.title}</Link></td><td className="px-4 py-3 text-fm-slate/75">{p.client?.name}</td><td className="px-4 py-3"><Status tone={p.status === 'OPEN' ? 'accent' : 'neutral'}>{PROJECT_STATUS[p.status]}</Status></td><td className="px-4 py-3 text-fm-slate/65">{timeAgo(p.createdAt)}</td><td className="px-4 py-3 text-right"><button onClick={() => remove(p)} className="font-semibold text-red-500 hover:underline">Șterge</button></td></tr>)}
          </Table>
          <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
        </>
      )}
    </Async>
  );
}

function Reports() {
  const [page, setPage] = useState(1);
  const q = useAdminReports({ page, limit: 20 });
  const res = useAdminResolveReport();
  const { toast, error } = useToast();
  const resolve = async (r) => { try { await res.mutateAsync(r.id); toast('Raportare rezolvată.'); } catch (e) { error(e); } };
  return (
    <Async q={q}>
      {(d) => !d.data.length ? <Card><Empty icon="flag" title="Nicio raportare" text="Totul e liniștit." /></Card> : (
        <>
          <Table head={['Tip', 'Motiv', 'Raportat de', 'Când', '']}>
            {d.data.map((r) => <tr key={r.id} className={r.resolved ? 'opacity-55' : ''}><td className="px-4 py-3"><Status tone="warn">{r.targetType}</Status></td><td className="max-w-xs px-4 py-3 text-fm-slate/85">{r.reason}</td><td className="px-4 py-3 text-fm-slate/75">{r.reporter?.name}</td><td className="px-4 py-3 text-fm-slate/65">{timeAgo(r.createdAt)}</td><td className="px-4 py-3 text-right">{r.resolved ? <Status tone="success">Rezolvată</Status> : <Button variant="outline" onClick={() => resolve(r)} className="!px-3 !py-1.5">Rezolvă</Button>}</td></tr>)}
          </Table>
          <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
        </>
      )}
    </Async>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('stats');
  return (
    <PageShell title="Administrare" subtitle="Moderare și statistici." width="max-w-6xl">
      <div className="mb-5"><Tabs items={[{ key: 'stats', label: 'Statistici' }, { key: 'users', label: 'Utilizatori' }, { key: 'projects', label: 'Proiecte' }, { key: 'reports', label: 'Raportări' }]} value={tab} onChange={setTab} /></div>
      {tab === 'stats' && <Stats />}{tab === 'users' && <Users />}{tab === 'projects' && <Projects />}{tab === 'reports' && <Reports />}
    </PageShell>
  );
}
