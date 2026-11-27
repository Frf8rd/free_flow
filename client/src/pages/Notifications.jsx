import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, Tabs, Empty, Async, Pagination } from '../components/ui/Kit.jsx';
import { useNotifications, useReadNotification, useReadAllNotifications } from '../hooks/queries.js';
import { timeAgo } from '../lib/format.js';
import { notificationDetails } from '../lib/notifications.js';
import { useToast } from '../components/feedback/Toast.jsx';

const kinds = [['', 'Toate'], ['matches', 'Potriviri'], ['messages', 'Mesaje'], ['engagements', 'Colaborări']];

function NotificationRow({ item, onRead }) {
  const { title, body, icon, href, action } = notificationDetails(item);
  const className = 'flex w-full min-w-0 items-start gap-3 px-4 py-4 text-left';
  const content = <>
    <span className="grid h-10 w-10 shrink-0 place-items-center bg-fm-ink text-white"><Icon name={icon} className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1">
      <span className={`block text-sm ${item.isRead ? 'text-fm-slate' : 'font-semibold text-fm-ink'}`}>{title}</span>
      {body && <span className="mt-1 block break-words text-sm text-fm-slate/75">{body}</span>}
      <span className="mt-1 block text-xs text-fm-slate/55">{timeAgo(item.createdAt)}</span>
      {href && <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-fm-accent">{action}<Icon name="arrow" className="h-3.5 w-3.5" /></span>}
    </span>
    {!item.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 bg-fm-accent-solid" role="img" aria-label="Necitită" />}
  </>;
  const markRead = () => { if (!item.isRead) onRead(item.id); };

  return <div className={`border-b border-fm-graphite/10 last:border-0 ${item.isRead ? '' : 'bg-fm-mist/30'}`}>
    {href ? <Link to={href} onClick={markRead} className={`${className} hover:bg-fm-mist/30`}>{content}</Link>
      : <div className={className}>{content}{!item.isRead && <Button variant="outline" onClick={markRead}>Marchează ca citită</Button>}</div>}
  </div>;
}

export default function Notifications() {
  const [tab, setTab] = useState(0);
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const query = useNotifications({ ...(tab === 1 ? { unread: true } : {}), ...(kind ? { kind } : {}), page, limit: 20 });
  const unreadQuery = useNotifications({ unread: true, page: 1, limit: 1 });
  const readOne = useReadNotification();
  const readAll = useReadAllNotifications();
  const { toast, error } = useToast();
  const rows = query.data?.data || [];
  const unreadCount = unreadQuery.data?.total ?? rows.filter((item) => !item.isRead).length;
  const tabs = [{ label: 'Toate' }, { label: 'Necitite', count: unreadCount }];
  const lastPage = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.limit ?? 20)));
  useEffect(() => {
    if (query.isSuccess && !query.isPlaceholderData && page > lastPage) setPage(lastPage);
  }, [query.isSuccess, query.isPlaceholderData, page, lastPage]);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dayLabel = (item) => {
    const day = new Date(item.createdAt).toDateString();
    return day === today.toDateString() ? 'Azi' : day === yesterday.toDateString() ? 'Ieri' : 'Mai vechi';
  };
  const groups = [
    'Azi', 'Ieri', 'Mai vechi',
  ].map((label) => [label, rows.filter((item) => dayLabel(item) === label)]);
  const markAll = async () => { try { await readAll.mutateAsync(); toast('Notificările au fost marcate ca citite.'); } catch (e) { error(e); } };
  return <PageShell title="Notificări" subtitle="Actualizări despre potriviri, mesaje și colaborări." action={unreadCount > 0 && <Button variant="outline" onClick={markAll} loading={readAll.isPending}>Marchează toate ca citite</Button>}>
    <div className="mx-auto grid max-w-4xl gap-4"><Tabs items={tabs} value={tab} onChange={(value) => { setTab(value); setPage(1); }} /><div className="flex flex-wrap gap-2" role="group" aria-label="Tip notificare">{kinds.map(([value, label]) => <button key={label} onClick={() => { setKind(value); setPage(1); }} aria-pressed={kind === value} className={`px-3 py-1.5 text-xs font-semibold ${kind === value ? 'bg-fm-ink text-white' : 'bg-fm-mist/70 text-fm-ink hover:bg-fm-mist'}`}>{label}</button>)}</div>
      <Async q={query}>{() => rows.length === 0 ? <Card><Empty icon="bell" title={tab ? 'Nicio notificare necitită' : 'Nicio notificare'} text={kind ? 'Nu sunt notificări în această categorie.' : 'Notificările despre activitatea contului vor apărea aici.'} /></Card> : groups.map(([label, list]) => list.length > 0 && (
        <section key={label} aria-label={label}>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-fm-slate/55">{label}</h2>
          <Card className="overflow-hidden">{list.map((item) => <NotificationRow key={item.id} item={item} onRead={(id) => readOne.mutate(id, { onError: error })} />)}</Card>
        </section>
      ))}</Async>
      <Pagination page={query.data?.page || page} limit={query.data?.limit || 20} total={query.data?.total || 0} onChange={setPage} />
    </div>
  </PageShell>;
}
