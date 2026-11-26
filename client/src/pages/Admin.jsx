import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Textarea } from '../components/ui/Fields.jsx';
import { Async, Card, Empty, Pagination, StatCard, Status } from '../components/ui/Kit.jsx';
import { useToast } from '../components/feedback/Toast.jsx';
import { useAuth } from '../store/authStore.js';
import { useAdminActivity, useAdminProjects, useAdminRemoveProject, useAdminReports, useAdminResolveReport, useAdminStats, useAdminUpdateProject, useAdminUpdateUser, useAdminUsers } from '../hooks/queries.js';
import { useDebounce } from '../lib/hooks.js';
import { PROJECT_STATUS, ROLE_LABEL, formatDate, formatDateTime, timeAgo } from '../lib/format.js';

const field = 'rounded-md border border-fm-graphite/15 bg-white px-3 py-2 text-sm text-fm-ink focus:border-fm-accent-solid focus:outline-none focus:ring-2 focus:ring-fm-accent-solid/30';
const REPORT_STATUS = { OPEN: 'Deschisă', RESOLVED: 'Rezolvată', DISMISSED: 'Respinsă' };
const REPORT_TONE = { OPEN: 'warn', RESOLVED: 'success', DISMISSED: 'neutral' };
const TARGET_LABEL = { USER: 'Utilizator', PROJECT: 'Proiect' };

const Table = ({ head, children }) => (
  <Card className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-fm-ink/10 bg-fm-mist/30 text-xs uppercase tracking-wider text-fm-slate/60">{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody className="divide-y divide-fm-ink/10">{children}</tbody></table></Card>
);
const Cell = ({ children, className = '', ...rest }) => <td {...rest} className={`px-4 py-3 ${className}`}>{children}</td>;
const Toolbar = ({ children }) => <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;

/* ---------------- Statistici ---------------- */
function Stats() {
  const q = useAdminStats();
  return (
    <Async q={q}>
      {(s) => (
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard icon="users" value={s.users} label="Utilizatori" hint={`${s.usersByRole.CLIENT || 0} clienți · ${s.usersByRole.FREELANCER || 0} freelanceri`} />
            <StatCard icon="briefcase" value={s.projects} label="Proiecte" hint={`${s.projectsByStatus.OPEN || 0} deschise`} />
            <StatCard icon="handshake" value={s.engagements} label="Colaborări" />
            <StatCard icon="flag" value={s.reportsByStatus.OPEN || 0} label="Raportări deschise" hint={`${s.reports} în total`} />
            <StatCard icon="shield" value={s.usersByRole.ADMIN || 0} label="Administratori" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-base font-semibold text-fm-ink">Structura comunității</h3><p className="mt-1 text-sm text-fm-slate/65">Conturi active în platformă, împărțite după rol.</p></div>
                <span className="rounded-full bg-fm-mist px-3 py-1 text-xs font-semibold text-fm-ink">{s.users} conturi</span>
              </div>
              <div className="mt-6 grid items-center gap-6 sm:grid-cols-[190px_1fr]">
                <RoleDonut data={s.usersByRole} total={s.users} />
                <div className="grid gap-3">{[['CLIENT', 'Clienți', 'bg-fm-ink'], ['FREELANCER', 'Freelanceri', 'bg-fm-accent-solid'], ['ADMIN', 'Administratori', 'bg-fm-slate/45']].map(([key, label, color]) => <div key={key} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-fm-slate/75"><i className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span><strong className="text-sm text-fm-ink">{s.usersByRole[key] || 0} <span className="font-normal text-fm-slate/55">({percent(s.usersByRole[key], s.users)}%)</span></strong></div>)}</div>
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <div><h3 className="text-base font-semibold text-fm-ink">Sănătatea platformei</h3><p className="mt-1 text-sm text-fm-slate/65">Starea proiectelor și a raportărilor.</p></div>
              <StatusChart title="Proiecte" items={Object.entries(PROJECT_STATUS).map(([key, label]) => ({ key, label, count: s.projectsByStatus[key] || 0 }))} total={s.projects} colors={['bg-fm-accent-solid', 'bg-fm-ink', 'bg-emerald-500', 'bg-fm-slate/35']} />
              <StatusChart title="Raportări" items={Object.entries(REPORT_STATUS).map(([key, label]) => ({ key, label, count: s.reportsByStatus[key] || 0 }))} total={s.reports} colors={['bg-amber-400', 'bg-emerald-500', 'bg-fm-slate/35']} />
            </Card>
          </div>
        </div>
      )}
    </Async>
  );
}

const percent = (value, total) => total ? Math.round((Number(value || 0) / total) * 100) : 0;
function RoleDonut({ data, total }) {
  const client = Number(data.CLIENT || 0), freelancer = Number(data.FREELANCER || 0), admin = Number(data.ADMIN || 0);
  const p1 = percent(client, total), p2 = percent(freelancer, total);
  const style = { background: total ? `conic-gradient(#192b38 0 ${p1}%, #55c5aa ${p1}% ${p1 + p2}%, #94a3a8 ${p1 + p2}% 100%)` : 'conic-gradient(#e7eceb 0 100%)' };
  return <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full" style={style} role="img" aria-label={`${client} clienți, ${freelancer} freelanceri și ${admin} administratori`}><div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><div><strong className="block text-2xl text-fm-ink">{total}</strong><span className="text-xs text-fm-slate/60">utilizatori</span></div></div></div>;
}
function StatusChart({ title, items, total, colors }) {
  return <section className="mt-6 first:mt-5" aria-label={`${title}: distribuție după stare`}>
    <div className="mb-2 flex items-center justify-between text-sm"><h4 className="font-semibold text-fm-ink">{title}</h4><span className="text-fm-slate/60">{total} în total</span></div>
    <div className="flex h-3 overflow-hidden rounded-full bg-fm-mist" role="img" aria-label={items.map((item) => `${item.label}: ${item.count}`).join(', ')}>
      {items.map((item, index) => <span key={item.key} className={`${colors[index % colors.length]} h-full`} style={{ width: `${percent(item.count, total)}%` }} />)}
    </div>
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">{items.map((item, index) => <div key={item.key} className="flex min-w-0 items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-1.5 truncate text-fm-slate/70"><i className={`h-2 w-2 shrink-0 rounded-full ${colors[index % colors.length]}`} />{item.label}</span><b className="text-fm-ink">{item.count}</b></div>)}</div>
  </section>;
}

/* ---------------- Utilizatori ---------------- */
function Users() {
  const me = useAuth((s) => s.user);
  const [q, setQ] = useState(''), [role, setRole] = useState(''), [blocked, setBlocked] = useState(''), [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const query = useAdminUsers({ search: dq || undefined, role: role || undefined, blocked: blocked || undefined, page, limit: 20 });
  const upd = useAdminUpdateUser();
  const { toast, error } = useToast();
  const toggle = async (u) => { try { await upd.mutateAsync({ id: u.id, isBlocked: !u.isBlocked }); toast(u.isBlocked ? 'Utilizator deblocat.' : 'Utilizator blocat.'); } catch (e) { error(e); } };
  const changeRole = async (u, next) => { if (next === u.role) return; try { await upd.mutateAsync({ id: u.id, role: next }); toast(`Rol schimbat: ${ROLE_LABEL[next]}.`); } catch (e) { error(e); } };
  return (
    <>
      <Toolbar>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Caută utilizator" placeholder="Caută după nume sau email…" className={`${field} w-full max-w-xs`} />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filtrează după rol" className={field}>
          <option value="">Toate rolurile</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={blocked} onChange={(e) => { setBlocked(e.target.value); setPage(1); }} aria-label="Filtrează după stare" className={field}>
          <option value="">Toate stările</option><option value="false">Activi</option><option value="true">Blocați</option>
        </select>
      </Toolbar>
      <Async q={query}>
        {(d) => !d.data.length ? <Card><Empty icon="users" title="Niciun utilizator găsit" text="Schimbă căutarea sau filtrele." /></Card> : (
          <>
            <Table head={['Nume', 'Email', 'Rol', 'Înscris', 'Stare', '']}>
              {d.data.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <Cell className="font-semibold text-fm-ink">{u.name}{self && <span className="ml-2 text-xs font-normal text-fm-slate/60">(tu)</span>}</Cell>
                    <Cell className="text-fm-slate/75">{u.email}{!u.emailVerifiedAt && <span className="ml-2"><Status tone="warn">Neverificat</Status></span>}</Cell>
                    <Cell>{self
                      ? ROLE_LABEL[u.role]
                      : <select value={u.role} disabled={upd.isPending} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Rol pentru ${u.name}`} className={`${field} !py-1.5`}><option value="CLIENT">Client</option><option value="FREELANCER">Freelancer</option><option value="ADMIN">Administrator</option></select>}</Cell>
                    <Cell className="text-fm-slate/65">{formatDate(u.createdAt)}</Cell>
                    <Cell>{u.isBlocked ? <Status tone="danger">Blocat</Status> : <Status tone="success">Activ</Status>}</Cell>
                    <Cell className="text-right">{!self && <button onClick={() => toggle(u)} disabled={upd.isPending} className="font-semibold text-fm-accent hover:underline disabled:opacity-50">{u.isBlocked ? 'Deblochează' : 'Blochează'}</button>}</Cell>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
          </>
        )}
      </Async>
    </>
  );
}

/* ---------------- Proiecte ---------------- */
function Projects() {
  const [q, setQ] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1);
  const dq = useDebounce(q);
  const query = useAdminProjects({ search: dq || undefined, status: status || undefined, page, limit: 20 });
  const upd = useAdminUpdateProject();
  const rm = useAdminRemoveProject();
  const { toast, error } = useToast();
  const setProjectStatus = async (p, next) => { if (next === p.status) return; try { await upd.mutateAsync({ id: p.id, status: next }); toast(`Stare schimbată: ${PROJECT_STATUS[next]}.`); } catch (e) { error(e); } };
  const remove = async (p) => { if (!window.confirm(`Ștergi definitiv proiectul „${p.title}"? Acțiunea nu poate fi anulată.`)) return; try { await rm.mutateAsync(p.id); toast('Proiect șters.'); } catch (e) { error(e); } };
  return (
    <>
      <Toolbar>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Caută proiect" placeholder="Caută după titlu, descriere sau client…" className={`${field} w-full max-w-xs`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filtrează după stare" className={field}>
          <option value="">Toate stările</option>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Toolbar>
      <Async q={query}>
        {(d) => !d.data.length ? <Card><Empty icon="briefcase" title="Niciun proiect găsit" text="Schimbă căutarea sau filtrele." /></Card> : (
          <>
            <Table head={['Proiect', 'Client', 'Categorie', 'Stare', 'Postat', '']}>
              {d.data.map((p) => (
                <tr key={p.id}>
                  <Cell><Link to={`/projects/${p.id}`} className="font-semibold text-fm-ink hover:underline">{p.title}</Link></Cell>
                  <Cell className="text-fm-slate/75">{p.client?.name || '—'}<span className="block text-xs text-fm-slate/55">{p.client?.email}</span></Cell>
                  <Cell className="text-fm-slate/75">{p.category?.name || '—'}</Cell>
                  <Cell><select value={p.status} disabled={upd.isPending} onChange={(e) => setProjectStatus(p, e.target.value)} aria-label={`Stare pentru ${p.title}`} className={`${field} !py-1.5`}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Cell>
                  <Cell className="text-fm-slate/65">{timeAgo(p.createdAt)}</Cell>
                  <Cell className="text-right"><button onClick={() => remove(p)} disabled={rm.isPending} className="font-semibold text-red-500 hover:underline disabled:opacity-50">Șterge</button></Cell>
                </tr>
              ))}
            </Table>
            <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
          </>
        )}
      </Async>
    </>
  );
}

/* ---------------- Raportări ---------------- */
function Reports() {
  const [status, setStatus] = useState('OPEN'), [page, setPage] = useState(1);
  const [active, setActive] = useState(null); // { report, status }
  const [note, setNote] = useState('');
  const query = useAdminReports({ status: status || undefined, page, limit: 20 });
  const res = useAdminResolveReport();
  const { toast, error } = useToast();
  const open = (report, next) => { setActive({ report, status: next }); setNote(''); };
  const close = () => { if (!res.isPending) setActive(null); };
  const submit = async () => {
    try {
      await res.mutateAsync({ id: active.report.id, status: active.status, resolution: note.trim() || undefined });
      toast(active.status === 'RESOLVED' ? 'Raportare rezolvată.' : 'Raportare respinsă.');
      setActive(null);
    } catch (e) { error(e); }
  };
  return (
    <>
      <Toolbar>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filtrează raportările" className={field}>
          <option value="OPEN">Deschise</option><option value="RESOLVED">Rezolvate</option><option value="DISMISSED">Respinse</option><option value="">Toate</option>
        </select>
      </Toolbar>
      <Async q={query}>
        {(d) => !d.data.length ? <Card><Empty icon="flag" title="Nicio raportare" text={status === 'OPEN' ? 'Nu există raportări deschise. Totul e liniștit.' : 'Nu există raportări pentru acest filtru.'} /></Card> : (
          <>
            <Table head={['Țintă', 'Motiv', 'Raportat de', 'Când', 'Stare', '']}>
              {d.data.map((r) => (
                <tr key={r.id}>
                  <Cell>
                    <Status tone="warn">{TARGET_LABEL[r.targetType] || r.targetType}</Status>
                    <span className="mt-1 block max-w-[14rem] truncate text-fm-ink">
                      {r.targetType === 'PROJECT' && r.target?.exists ? <Link to={`/projects/${r.targetId}`} className="font-semibold hover:underline">{r.target.label}</Link> : (r.target?.label || r.targetId)}
                    </span>
                  </Cell>
                  <Cell className="max-w-xs text-fm-slate/85"><b className="text-fm-ink">{r.reason}</b>{r.details && <span className="mt-1 block text-xs text-fm-slate/65">{r.details}</span>}{r.resolution && <span className="mt-1 block text-xs italic text-fm-slate/60">Rezoluție: {r.resolution}</span>}</Cell>
                  <Cell className="text-fm-slate/75">{r.reporter?.name || '—'}</Cell>
                  <Cell className="text-fm-slate/65" title={formatDateTime(r.createdAt)}>{timeAgo(r.createdAt)}</Cell>
                  <Cell><Status tone={REPORT_TONE[r.status]}>{REPORT_STATUS[r.status] || r.status}</Status></Cell>
                  <Cell className="text-right">{r.status === 'OPEN' && <span className="inline-flex gap-2"><Button onClick={() => open(r, 'RESOLVED')} className="!px-3 !py-1.5">Rezolvă</Button><Button variant="outline" onClick={() => open(r, 'DISMISSED')} className="!px-3 !py-1.5">Respinge</Button></span>}</Cell>
                </tr>
              ))}
            </Table>
            <Pagination page={d.page} limit={d.limit} total={d.total} onChange={setPage} />
          </>
        )}
      </Async>
      <Modal open={!!active} onClose={close} title={active?.status === 'RESOLVED' ? 'Rezolvă raportarea' : 'Respinge raportarea'}
        footer={<><Button variant="outline" onClick={close} disabled={res.isPending}>Anulează</Button><Button onClick={submit} loading={res.isPending}>Confirmă</Button></>}>
        <p className="mb-3 text-sm text-fm-slate/80">„{active?.report.reason}” — adaugă opțional o notă internă despre decizie.</p>
        <Textarea rows={4} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} placeholder="Notă (opțional, maximum 1000 de caractere)" aria-label="Notă despre decizie" />
      </Modal>
    </>
  );
}

const activityGroups = [
  ['Potriviri', 'matches', { SUGGESTED: 'Recomandate', CLIENT_INVITED: 'Invitații', FREELANCER_INTERESTED: 'Interes trimis', ACCEPTED: 'Acceptate', DISMISSED: 'Ascunse' }],
  ['Calculul potrivirilor', 'matchingProjects', { PENDING: 'În așteptare', RUNNING: 'În calcul', DONE: 'Terminate', FAILED: 'Cu erori' }],
  ['Colaborări', 'engagements', { PENDING: 'În așteptare', IN_PROGRESS: 'În lucru', DELIVERED: 'Livrate', COMPLETED: 'Finalizate', REJECTED: 'Respinse', CANCELLED: 'Anulate' }],
];

function Activity() {
  const query = useAdminActivity();
  return <Async q={query}>{(data) => <div className="grid gap-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ['Conturi noi în 7 zile', 'newUsers', 'users'], ['Proiecte noi în 7 zile', 'newProjects', 'briefcase'],
        ['Conturi blocate', 'blockedUsers', 'shield'], ['Conversații', 'conversations', 'chat'],
        ['Mesaje', 'messages', 'chat'], ['Recenzii', 'reviews', 'star'], ['Sarcini de matching în coadă', 'jobs', 'sparkle'],
      ].map(([label, key, icon]) => <StatCard key={key} label={label} value={data[key]} icon={icon} />)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {activityGroups.map(([title, key, labels]) => {
        const items = Object.entries(labels).map(([status, label]) => ({ key: status, label, count: data[key]?.[status] ?? 0 }));
        return <Card key={key} className="p-4"><StatusChart title={title} items={items} total={items.reduce((sum, item) => sum + item.count, 0)} colors={['bg-fm-accent-solid', 'bg-amber-400', 'bg-emerald-500', 'bg-fm-ink', 'bg-fm-slate/35', 'bg-red-500']} /></Card>;
      })}
    </div>
  </div>}</Async>;
}

const TABS = ['Statistici', 'Activitate', 'Utilizatori', 'Proiecte', 'Raportări'];
export default function Admin() {
  const [tab, setTab] = useState(0);
  return (
    <PageShell title="Administrare" subtitle="Moderare, utilizatori, proiecte și statistici." width="max-w-6xl">
      <nav aria-label="Secțiuni de administrare" className="mb-5 flex flex-wrap gap-2 border border-fm-ink/10 bg-white p-2">
        {TABS.map((label, index) => <button key={label} type="button" aria-current={tab === index ? 'page' : undefined}
          onClick={() => setTab(index)} className={`min-h-11 px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-fm-accent ${tab === index ? 'bg-fm-accent-solid text-white' : 'text-fm-ink hover:bg-fm-mist/40'}`}>{label}</button>)}
      </nav>
      {tab === 0 && <Stats />}{tab === 1 && <Activity />}{tab === 2 && <Users />}{tab === 3 && <Projects />}{tab === 4 && <Reports />}
    </PageShell>
  );
}
