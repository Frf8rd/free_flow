import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, Tabs, Empty, Async, Pagination } from '../components/ui/Kit.jsx';
import { useNotifications, useReadNotification, useReadAllNotifications } from '../hooks/queries.js';
import { timeAgo } from '../lib/format.js';
import { useToast } from '../components/feedback/Toast.jsx';

const kinds = [['', 'Toate'], ['NEW_MATCH', 'Potriviri'], ['NEW_MESSAGE', 'Mesaje'], ['ENGAGEMENT_STARTED', 'Colaborări']];
const iconFor = (type) => ({ NEW_MATCH: 'sparkle', NEW_MESSAGE: 'chat', INVITED: 'userPlus', FREELANCER_INTERESTED: 'handshake', ENGAGEMENT_STARTED: 'handshake', ENGAGEMENT_DELIVERED: 'check', ENGAGEMENT_COMPLETED: 'check', ENGAGEMENT_CANCELLED: 'close', REVIEW_RECEIVED: 'star' })[type] || 'bell';

export default function Notifications() {
  const [tab, setTab] = useState(0);
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const query = useNotifications({ ...(tab === 1 ? { unread: true } : {}), page, limit: 20 });
  const unreadQuery = useNotifications({ unread: true, page: 1, limit: 1 });
  const readOne = useReadNotification();
  const readAll = useReadAllNotifications();
  const { toast, error } = useToast();
  const rows = query.data?.data || [];
  const unreadCount = unreadQuery.data?.total ?? rows.filter((item) => !item.isRead).length;
  const visible = useMemo(() => rows.filter((item) => !kind || item.type === kind), [rows, kind]);
  const tabs = [{ label: 'Toate', count: query.data?.total || rows.length }, { label: 'Necitite', count: unreadCount }];
  const groups = [
    ['Azi', visible.filter((n) => new Date(n.createdAt).toDateString() === new Date().toDateString())],
    ['Ieri', visible.filter((n) => { const day = new Date(n.createdAt); const d = new Date(); d.setDate(d.getDate() - 1); return day.toDateString() === d.toDateString(); })],
    ['Mai vechi', visible.filter((n) => { const date = new Date(n.createdAt), today = new Date(), yesterday = new Date(); yesterday.setDate(today.getDate() - 1); return date.toDateString() !== today.toDateString() && date.toDateString() !== yesterday.toDateString(); })],
  ];
  const markAll = async () => { try { await readAll.mutateAsync(); toast('Notificările au fost marcate ca citite.'); } catch (e) { error(e); } };
  return <PageShell title="Notificări" subtitle="Actualizări despre potriviri, mesaje și colaborări." action={unreadCount > 0 && <Button variant="outline" onClick={markAll} loading={readAll.isPending}>Marchează toate ca citite</Button>}>
    <div className="mx-auto grid max-w-4xl gap-4"><Tabs items={tabs} value={tab} onChange={setTab} /><div className="flex flex-wrap gap-2" role="group" aria-label="Tip notificare">{kinds.map(([value, label]) => <button key={label} onClick={() => { setKind(value); setPage(1); }} aria-pressed={kind === value} className={`px-3 py-1.5 text-xs font-semibold ${kind === value ? 'bg-fm-ink text-white' : 'bg-fm-mist/70 text-fm-ink hover:bg-fm-mist'}`}>{label}</button>)}</div>
      <Async q={query}>{() => visible.length === 0 ? <Card><Empty icon="bell" title={tab ? 'Nicio notificare necitită' : 'Nicio notificare'} text="Notificările despre activitatea contului vor apărea aici." /></Card> : groups.map(([label, list]) => list.length > 0 && <section key={label} aria-label={label}><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-fm-slate/55">{label}</h2><Card className="overflow-hidden">{list.map((item) => { const title = item.data?.title || 'Actualizare'; const body = item.data?.body || ''; const href = item.data?.link || '/dashboard'; return <div key={item.id} className={`flex items-start gap-3 border-b border-fm-graphite/10 p-4 last:border-0 ${item.isRead ? '' : 'bg-fm-mist/30'}`}><Link to={href} onClick={() => { if (!item.isRead) readOne.mutate(item.id); }} className="flex min-w-0 flex-1 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center bg-fm-ink text-white"><Icon name={iconFor(item.type)} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className={`block text-sm ${item.isRead ? 'text-fm-slate' : 'font-semibold text-fm-ink'}`}>{title}</span>{body && <span className="mt-1 block text-sm text-fm-slate/75">{body}</span>}<span className="mt-1 block text-xs text-fm-slate/55">{timeAgo(item.createdAt)}</span></span>{!item.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 bg-fm-accent-solid" role="img" aria-label="Necitită" />}</Link></div>; })}</Card></section>)}</Async>
      <Pagination page={query.data?.page || page} limit={query.data?.limit || 20} total={query.data?.total || 0} onChange={setPage} />
    </div>
  </PageShell>;
}
