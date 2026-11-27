import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Avatar, Card, Chip, Empty, Status, Tabs, Async } from '../components/ui/Kit.jsx';
import { useEngagements } from '../hooks/queries.js';
import { useAuth } from '../store/authStore.js';
import { ENGAGEMENT_STATUS, formatDate } from '../lib/format.js';

const filters = [null, 'PENDING', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const labels = ['Toate', 'În așteptare', 'În lucru', 'Livrate', 'Finalizate', 'Refuzate', 'Anulate'];
export const statusTone = { PENDING: 'warn', IN_PROGRESS: 'accent', DELIVERED: 'warn', COMPLETED: 'success', REJECTED: 'danger', CANCELLED: 'danger' };

export default function Engagements() {
  const user = useAuth((s) => s.user);
  const query = useEngagements();
  const [tab, setTab] = useState(0);
  return <PageShell title="Colaborări" subtitle="Vezi propunerile și urmărește stadiul lucrărilor.">
    <Async q={query}>{(items) => {
      const counts = filters.map((status) => items.filter((e) => !status || e.status === status).length);
      const rows = items.filter((e) => !filters[tab] || e.status === filters[tab]);
      return <div className="grid gap-4"><Tabs items={labels.map((label, i) => ({ label, count: counts[i] }))} value={tab} onChange={setTab} />{rows.length === 0 ? <Card><Empty icon="handshake" title="Nicio colaborare în această listă" text="O colaborare apare după ce clientul și freelancerul acceptă o potrivire." /></Card> : rows.map((e) => {
        const isClient = user.id === e.client.userId;
        const person = isClient ? e.freelancer : e.client;
        return <Card key={e.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar name={person.name} src={person.avatarUrl} size="h-11 w-11" /><div className="min-w-0"><h2 className="truncate text-base font-semibold text-fm-ink">{e.project.title}</h2><p className="text-sm text-fm-slate/70">cu {person.name} · {isClient ? 'Client' : 'Freelancer'}</p></div></div><Status tone={statusTone[e.status] || 'neutral'}>{ENGAGEMENT_STATUS[e.status] || e.status}</Status></div><div className="mt-4 grid gap-3 border-t border-fm-ink/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex flex-wrap gap-2">{e.deadline && <Chip icon="calendar">Termen {formatDate(e.deadline)}</Chip>}{e.usedAi != null && <Chip icon="check">AI {e.usedAi ? 'folosit' : 'nefolosit'}</Chip>}</div><div className="flex flex-wrap gap-2"><Link to={`/engagements/${e.id}`} className="inline-flex items-center gap-1.5 border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink">Detalii</Link>{e.conversationId && <Link to={`/messages/${e.conversationId}`} className="inline-flex items-center gap-1.5 bg-fm-ink px-4 py-2 text-sm font-semibold text-white"><Icon name="chat" className="h-4 w-4" />Mesaje</Link>}</div></div></Card>;
      })}</div>;
    }}</Async>
  </PageShell>;
}
