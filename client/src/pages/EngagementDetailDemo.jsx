import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Avatar, Card, Empty, Status } from '../components/ui/Kit.jsx';
import { useChat } from '../lib/chat.jsx';
import { useDemoState } from '../lib/demoStore.js';
import { engagements as seed } from '../data/mockPages.js';

const labels = { IN_PROGRESS: 'În lucru', DELIVERED: 'Livrat', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };

export default function EngagementDetailDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { start } = useChat();
  const [items, setItems] = useDemoState('fm-demo-engagements', seed);
  const [reviews, setReviews] = useDemoState('fm-demo-reviews', {});
  const [ai, setAi] = useState(null);
  const [rating, setRating] = useState(0);
  const item = items.find((entry) => String(entry.id) === String(id));

  if (!item) return <PageShell title="Colaborarea nu există"><Card><Empty title="Nu am găsit colaborarea" text="Este posibil să fi fost eliminată din demonstrație." action={<Link to="/engagements" className="bg-fm-ink px-4 py-2 text-sm font-semibold text-white">Înapoi la colaborări</Link>} /></Card></PageShell>;

  const update = (changes) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...changes } : entry));
  const startChat = () => navigate(`/messages/${start({ name: item.person, initials: item.initials, headline: item.side === 'client' ? 'Freelancer' : 'Client', projectId: item.projectId, project: item.title, mine: item.side === 'client' })}`);
  const canDeliver = item.side === 'freelancer' && item.status === 'IN_PROGRESS';
  const canConfirm = item.side === 'client' && item.status === 'DELIVERED';

  return (
    <PageShell title={item.title} subtitle={`Colaborare cu ${item.person}`} action={<Link to="/engagements" className="text-sm font-semibold text-fm-graphite hover:text-fm-ink">← Colaborări</Link>}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-fm-slate/70">Rolul tău în această colaborare</p><p className="mt-1 font-semibold text-fm-ink">{item.side === 'client' ? 'Client' : 'Freelancer'}</p></div><Status tone={item.status === 'COMPLETED' ? 'dark' : 'neutral'}>{labels[item.status] || item.status}</Status></div>
            <ol className="mt-6 grid grid-cols-3 gap-2 text-xs font-semibold text-fm-slate/60"><li className={['IN_PROGRESS', 'DELIVERED', 'COMPLETED'].includes(item.status) ? 'text-fm-ink' : ''}>1 · În lucru</li><li className={['DELIVERED', 'COMPLETED'].includes(item.status) ? 'text-fm-ink' : ''}>2 · Livrat</li><li className={item.status === 'COMPLETED' ? 'text-fm-ink' : ''}>3 · Finalizat</li></ol>
            <div className="mt-2 h-1.5 bg-fm-mist"><div className="h-full bg-fm-ink" style={{ width: `${item.status === 'COMPLETED' ? 100 : item.status === 'DELIVERED' ? 66 : 33}%` }} /></div>
          </Card>
          {canDeliver && <Card className="p-5 sm:p-6"><h2 className="font-semibold text-fm-ink">Marchează lucrarea livrată</h2><p className="mt-1 text-sm text-fm-slate/70">Înainte de livrare, declară dacă ai folosit instrumente AI.</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-fm-ink"><label className="flex items-center gap-2"><input type="radio" name="ai" checked={ai === true} onChange={() => setAi(true)} /> Am folosit AI</label><label className="flex items-center gap-2"><input type="radio" name="ai" checked={ai === false} onChange={() => setAi(false)} /> Nu am folosit AI</label></div><Button disabled={ai === null} onClick={() => update({ status: 'DELIVERED', usedAi: ai })} className="mt-4">Marchează ca livrată</Button></Card>}
          {canConfirm && <Card className="p-5 sm:p-6"><h2 className="font-semibold text-fm-ink">Verifică livrarea</h2><p className="mt-1 text-sm text-fm-slate/70">După confirmare, colaborarea este marcată ca finalizată și poți lăsa o recenzie.</p><Button onClick={() => update({ status: 'COMPLETED' })} className="mt-4">Confirmă finalizarea</Button></Card>}
          {item.status === 'COMPLETED' && <Card className="p-5 sm:p-6"><h2 className="font-semibold text-fm-ink">Recenzie</h2>{reviews[item.id] ? <p className="mt-2 text-sm text-fm-slate">Ai salvat o recenzie de {reviews[item.id]} stele în această demonstrație.</p> : <><p className="mt-1 text-sm text-fm-slate/70">Lasă o notă pentru această colaborare.</p><div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} stele`}><Icon name="star" fill={n <= rating} className={`h-6 w-6 ${n <= rating ? 'text-amber-500' : 'text-fm-steel'}`} /></button>)}</div><Button disabled={!rating} onClick={() => setReviews((current) => ({ ...current, [item.id]: rating }))} className="mt-3">Salvează recenzia</Button></>}</Card>}
        </div>
        <aside className="grid h-fit gap-4">
          <Card className="p-5"><div className="flex items-center gap-3"><Avatar initials={item.initials} /><div><p className="text-xs text-fm-slate/60">{item.side === 'client' ? 'Freelancer' : 'Client'}</p><p className="font-semibold text-fm-ink">{item.person}</p></div></div><Button variant="outline" onClick={startChat} className="mt-4 w-full py-2.5"><Icon name="chat" className="h-4 w-4" /> Deschide chatul</Button></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-fm-slate/55">Detalii exemplu</p><dl className="mt-3 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-fm-slate/65">Buget exemplu</dt><dd className="font-semibold text-fm-ink">{item.price}</dd></div><div className="flex justify-between gap-3"><dt className="text-fm-slate/65">Termen</dt><dd className="font-semibold text-fm-ink">{item.deadline}</dd></div>{item.usedAi != null && <div className="flex justify-between gap-3"><dt className="text-fm-slate/65">Folosire AI</dt><dd className="font-semibold text-fm-ink">{item.usedAi ? 'Da' : 'Nu'}</dd></div>}</dl><p className="mt-4 border-t border-fm-ink/10 pt-3 text-xs leading-relaxed text-fm-slate/65">Date demonstrative. Nu se creează contract și nu se procesează plăți.</p></Card>
        </aside>
      </div>
    </PageShell>
  );
}
