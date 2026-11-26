import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import Modal from '../components/ui/Modal.jsx';
import { Async, Avatar, BackLink, Card, Notice, SectionCard, SkeletonList, Stars, Status } from '../components/ui/Kit.jsx';
import { Field, Textarea } from '../components/ui/Fields.jsx';
import { useToast } from '../components/feedback/Toast.jsx';
import { useAuth } from '../store/authStore.js';
import { useAiDisclosure, useEngagement, useEngagementStatus, useReview } from '../hooks/queries.js';
import { ENGAGEMENT_STATUS, formatDate, formatDateTime, formatMoney, timeAgo } from '../lib/format.js';
import { statusTone } from './Engagements.jsx';

const STEPS = [['IN_PROGRESS', 'În lucru'], ['DELIVERED', 'Livrat'], ['COMPLETED', 'Finalizat']];

function Stepper({ status }) {
  if (status === 'CANCELLED') return <Notice tone="warn" icon="info">Colaborarea a fost anulată.</Notice>;
  const idx = STEPS.findIndex(([k]) => k === status);
  return (
    <ol className="flex items-center" aria-label="Etapele colaborării">
      {STEPS.map(([k, label], i) => (
        <li key={k} className="flex flex-1 items-center last:flex-none">
          <span className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= idx ? 'bg-fm-accent-solid text-white' : 'bg-fm-mist text-fm-slate/60'}`}>{i < idx || status === 'COMPLETED' ? <Icon name="check" className="h-4 w-4" /> : i + 1}</span><span className={`hidden text-sm font-medium sm:inline ${i <= idx ? 'text-fm-ink' : 'text-fm-slate/55'}`}>{label}</span></span>
          {i < STEPS.length - 1 && <span className={`mx-3 h-0.5 flex-1 rounded ${i < idx ? 'bg-fm-accent-solid' : 'bg-fm-mist'}`} />}
        </li>
      ))}
    </ol>
  );
}

function ReviewForm({ id, targetName }) {
  const review = useReview();
  const { toast, error } = useToast();
  const [rating, setRating] = useState(0), [comment, setComment] = useState(''), [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErr('Alege o notă.');
    try { await review.mutateAsync({ id, rating, comment: comment.trim() }); toast('Mulțumim pentru recenzie!'); } catch (x) { error(x); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-fm-slate/80">Cum a fost colaborarea cu <b>{targetName}</b>?</p>
      <div><Stars value={rating} onChange={(v) => { setRating(v); setErr(''); }} size="h-8 w-8" />{err && <span role="alert" className="mt-1 block text-xs text-red-500">{err}</span>}</div>
      <Field label="Comentariu" optional><Textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ce a mers bine? Ce ar putea fi mai bine?" /></Field>
      <Button type="submit" loading={review.isPending}>Trimite recenzia</Button>
    </form>
  );
}

function Detail({ e }) {
  const user = useAuth((s) => s.user);
  const isClient = user.id === e.client.userId;
  const other = isClient ? e.freelancer : e.client;
  const setStatus = useEngagementStatus(), disclose = useAiDisclosure();
  const { toast, error } = useToast();
  const [usedAi, setUsedAi] = useState(e.usedAi);
  const [confirm, setConfirm] = useState(null);
  const myReview = e.reviews.find((r) => r.authorId === user.id);

  const act = async (status, msg) => { try { await setStatus.mutateAsync({ id: e.id, status }); toast(msg); setConfirm(null); } catch (x) { error(x); setConfirm(null); } };
  const deliver = async () => {
    if (usedAi == null) return error(new Error('Declară dacă ai folosit instrumente AI înainte de livrare.'));
    try { await disclose.mutateAsync({ id: e.id, usedAi }); await setStatus.mutateAsync({ id: e.id, status: 'DELIVERED' }); toast('Lucrarea a fost marcată ca livrată.'); } catch (x) { error(x); }
  };
  const canCancel = ['IN_PROGRESS', 'DELIVERED'].includes(e.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><Link to={`/projects/${e.project.id}`} className="text-xl font-bold tracking-tight text-fm-ink hover:underline">{e.project.title}</Link><p className="mt-1 text-sm text-fm-slate/70">Început {timeAgo(e.createdAt)}</p></div><Status tone={statusTone[e.status]}>{ENGAGEMENT_STATUS[e.status]}</Status></div>
          <div className="mt-6"><Stepper status={e.status} /></div>
        </Card>

        {e.status === 'IN_PROGRESS' && !isClient && (
          <SectionCard title="Gata de livrare?" subtitle="Declarația despre AI este obligatorie și vizibilă clientului">
            <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium text-fm-ink">Ai folosit instrumente AI pentru această lucrare?</legend>
              {[[true, 'Da, am folosit AI'], [false, 'Nu, am lucrat fără AI']].map(([v, l]) => <label key={String(v)} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${usedAi === v ? 'border-fm-accent-solid bg-fm-accent-solid/8' : 'border-fm-graphite/15'}`}><input type="radio" name="ai" checked={usedAi === v} onChange={() => setUsedAi(v)} className="accent-[rgb(var(--fm-accent-solid))]" />{l}</label>)}
            </fieldset>
            <Button className="mt-4" loading={setStatus.isPending || disclose.isPending} onClick={deliver}>Marchează ca livrat</Button>
          </SectionCard>
        )}
        {e.status === 'IN_PROGRESS' && isClient && <Notice icon="clock">Freelancerul lucrează la proiect. Vei fi anunțat când îl livrează.</Notice>}
        {e.status === 'DELIVERED' && isClient && (
          <SectionCard title="Lucrarea a fost livrată" subtitle="Verifică rezultatul și confirmă dacă ești mulțumit">
            <p className="mb-4 text-sm text-fm-slate/80">După confirmare, colaborarea se finalizează și puteți lăsa recenzii.</p>
            <Button loading={setStatus.isPending} onClick={() => act('COMPLETED', 'Colaborarea a fost finalizată.')}>Confirmă finalizarea</Button>
          </SectionCard>
        )}
        {e.status === 'DELIVERED' && !isClient && <Notice icon="clock">Ai livrat lucrarea. Așteptăm confirmarea clientului.</Notice>}

        {e.status === 'COMPLETED' && (
          <SectionCard title="Recenzii" subtitle="Doar participanții la colaborare pot lăsa recenzii, o singură dată">
            {!myReview && <div className="mb-6 border-b border-fm-ink/10 pb-6"><ReviewForm id={e.id} targetName={other.name} /></div>}
            {e.reviews.length === 0 ? <p className="text-sm text-fm-slate/65">Nicio recenzie încă.</p> : <ul className="space-y-4">{e.reviews.map((r) => <li key={r.id}><div className="flex items-center gap-2"><Stars value={r.rating} size="h-4 w-4" /><span className="text-sm font-semibold text-fm-ink">{r.authorId === user.id ? 'Tu' : other.name}</span><span className="text-xs text-fm-slate/55">{timeAgo(r.createdAt)}</span></div>{r.comment && <p className="mt-1 text-sm text-fm-slate/85">{r.comment}</p>}</li>)}</ul>}
          </SectionCard>
        )}
      </div>

      <aside className="space-y-4">
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-fm-slate/55">{isClient ? 'Freelancer' : 'Client'}</p>
          <div className="flex items-center gap-3"><Avatar name={other.name} src={other.avatarUrl} size="h-11 w-11" /><div className="min-w-0"><p className="truncate font-semibold text-fm-ink">{other.name}</p>{isClient && <Link to={`/freelancers/${e.freelancer.profileId}`} className="text-xs font-semibold text-fm-accent hover:underline">Vezi profilul</Link>}</div></div>
          {e.conversationId && <Link to={`/messages?c=${e.conversationId}`} className="mt-4 flex items-center justify-center gap-2 rounded-md border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50"><Icon name="chat" className="h-4 w-4" />Deschide discuția</Link>}
        </Card>
        <Card className="p-5"><dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-fm-slate/65">Preț convenit</dt><dd className="font-semibold text-fm-ink">{formatMoney(e.agreedPrice)}</dd></div>
          <div className="flex justify-between"><dt className="text-fm-slate/65">Termen</dt><dd className="font-semibold text-fm-ink">{e.deadline ? formatDate(e.deadline) : 'Flexibil'}</dd></div>
          {e.completedAt && <div className="flex justify-between"><dt className="text-fm-slate/65">Finalizat</dt><dd className="font-semibold text-fm-ink">{formatDateTime(e.completedAt)}</dd></div>}
          {e.usedAi != null && <div className="flex justify-between"><dt className="text-fm-slate/65">A folosit AI</dt><dd className="font-semibold text-fm-ink">{e.usedAi ? 'Da' : 'Nu'}</dd></div>}
        </dl></Card>
        {canCancel && <button onClick={() => setConfirm('cancel')} className="text-sm font-medium text-fm-slate/60 hover:text-red-500">Anulează colaborarea</button>}
      </aside>

      <Modal open={confirm === 'cancel'} onClose={() => setConfirm(null)} title="Anulezi colaborarea?" footer={<><Button variant="outline" onClick={() => setConfirm(null)}>Nu, o păstrez</Button><Button loading={setStatus.isPending} onClick={() => act('CANCELLED', 'Colaborarea a fost anulată.')} className="!bg-red-600 hover:!bg-red-700">Da, anulează</Button></>}>
        <p className="text-sm text-fm-slate/80">Cealaltă parte va fi anunțată. Acțiunea nu poate fi anulată.</p>
      </Modal>
    </div>
  );
}

export default function EngagementDetail() {
  const { id } = useParams();
  const q = useEngagement(id);
  return (
    <PageShell width="max-w-5xl" docTitle={q.data?.project?.title || 'Colaborare'}>
      <BackLink to="/engagements">Colaborări</BackLink>
      <Async q={q} skeleton={<SkeletonList n={2} />}>{(e) => <Detail e={e} />}</Async>
    </PageShell>
  );
}
