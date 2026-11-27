import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';
import { Avatar, Card, Chip, Status, Tag, TierBadge, Stars } from '../ui/Kit.jsx';
import ScoreDetails from './ScoreDetails.jsx';
import { AVAILABILITY, formatBudget, formatRate, daysUntil, timeAgo } from '../../lib/format.js';
import { useInView } from '../../lib/hooks.js';

const scoreTone = (s) => (s >= 85 ? 'text-emerald-600 dark:text-emerald-400' : s >= 70 ? 'text-fm-accent' : 'text-fm-slate/70');
const availTone = { AVAILABLE: 'success', LIMITED: 'warn', UNAVAILABLE: 'neutral' };

function Score({ value }) {
  return <div className="text-right"><p className={`text-2xl font-bold leading-none ${scoreTone(value)}`}>{value}%</p><p className="mt-1 text-[11px] text-fm-slate/60">potrivire</p></div>;
}

export function Why({ items }) {
  if (!Array.isArray(items) || !items.length) return null;
  return <ul className="mt-3 space-y-1.5">{items.map((item) => {
    const label = typeof item === 'string' ? item : item?.text;
    if (typeof label !== 'string' || !label) return null;
    const warning = item?.positive === false;
    return <li key={item?.code || label} className="flex items-start gap-2 text-sm text-fm-slate/85">
      <Icon name={warning ? 'alert' : 'check'} className={`mt-0.5 h-4 w-4 shrink-0 ${warning ? 'text-amber-500' : 'text-emerald-500'}`} />
      {label}
    </li>;
  })}</ul>;
}

// Recomandare pentru CLIENT: un freelancer. onSeen = înregistrează impresia (README 9.7).
export function FreelancerMatchCard({ match, onInvite, onDismiss, onCompare, compared, onSeen, busy }) {
  const f = match.freelancer, r = match.reasons || {};
  const ref = useInView(() => onSeen?.(match.id));
  const canAct = match.status === 'SUGGESTED';
  const canInvite = canAct || match.status === 'FREELANCER_INTERESTED';
  return (
    <Card hover className="p-5" ref={ref}>
      <div className="flex items-start gap-4">
        <Link to={`/freelancers/${f.id}`}><Avatar name={f.name} src={f.avatarUrl} size="h-14 w-14" /></Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/freelancers/${f.id}`} className="truncate text-base font-semibold text-fm-ink hover:underline">{f.name}</Link>
            <TierBadge tier={f.tier} />
            {r.exploration && <Status tone="success" icon="trend">Talent în creștere</Status>}
          </div>
          <p className="truncate text-sm text-fm-slate/70">{f.title} · {formatRate(f.hourlyRate)}</p>
        </div>
        <Score value={match.score} />
      </div>
      <Why items={r.forClient} />
      {r.stretch && <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-fm-ink"><b>Atenție:</b> proiectul e mai dificil decât nivelul declarat. Poți propune plata în etape.</p>}
      <div className="mt-4 flex flex-wrap gap-1.5">{f.skills?.slice(0, 5).map((s) => <Tag key={s.id}>{s.name}</Tag>)}</div>
      <div className="mt-4"><ScoreDetails components={r.components} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-fm-ink/10 pt-4">
        {canInvite && <Button loading={busy} onClick={() => onInvite(match)} className="!px-5 !py-2.5">Invită</Button>}
        {match.conversationId && <Link to={`/messages?c=${match.conversationId}`} className="inline-flex items-center gap-2 rounded-md bg-fm-accent-solid px-5 py-2.5 text-sm font-semibold text-white"><Icon name="chat" className="h-4 w-4" />Deschide discuția</Link>}
        <Link to={`/freelancers/${f.id}`} className="rounded-md border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">Vezi profilul</Link>
        {onCompare && <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-fm-slate/80"><input type="checkbox" checked={!!compared} onChange={() => onCompare(match)} className="h-4 w-4 accent-[rgb(var(--fm-accent-solid))]" />Compară</label>}
        {canAct && onDismiss && <button onClick={() => onDismiss(match)} className="text-sm font-medium text-fm-slate/60 hover:text-red-500">Ascunde</button>}
      </div>
    </Card>
  );
}

// Recomandare pentru FREELANCER: un proiect
export function ProjectMatchCard({ match, onInterest, onDismiss, onSeen, busy }) {
  const p = match.project, r = match.reasons || {};
  const ref = useInView(() => onSeen?.(match.id));
  const days = daysUntil(p.deadline);
  const canConfirm = ['SUGGESTED', 'CLIENT_INVITED'].includes(match.status);
  return (
    <Card hover className="p-5" ref={ref}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/projects/${p.id}`} className="text-base font-semibold text-fm-ink hover:underline">{p.title}</Link>
            {p.isStarter && <Status tone="success" icon="rocket">Proiect de start</Status>}
            {match.status === 'CLIENT_INVITED' && <Status tone="accent" icon="mail">Te-a invitat</Status>}
            {match.status === 'FREELANCER_INTERESTED' && <Status tone="neutral" icon="check">Interes trimis</Status>}
            {match.status === 'ACCEPTED' && <Status tone="success" icon="handshake">Acceptat de ambele părți</Status>}
          </div>
          <p className="mt-1 text-sm text-fm-slate/70">{p.client?.name} · {formatBudget(p.budgetMin, p.budgetMax)}{days != null && days >= 0 ? ` · termen în ${days} zile` : ''}</p>
        </div>
        {r.source !== 'manual_invite' && <Score value={match.score} />}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-fm-slate/80">{p.description}</p>
      <Why items={r.forFreelancer} />
      <div className="mt-4 flex flex-wrap gap-1.5">{p.skills?.slice(0, 5).map((s) => <Tag key={s.id}>{s.name}</Tag>)}</div>
      <div className="mt-4"><ScoreDetails components={r.components} /></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-fm-ink/10 pt-4">
        {canConfirm && <Button loading={busy} onClick={() => onInterest(match)} className="!px-5 !py-2.5">{match.status === 'CLIENT_INVITED' ? 'Acceptă invitația' : 'Sunt interesat'}</Button>}
        {!canConfirm && match.conversationId && <Link to={`/messages?c=${match.conversationId}`} className="inline-flex items-center gap-2 rounded-md bg-fm-accent-solid px-5 py-2.5 text-sm font-semibold text-white"><Icon name="chat" className="h-4 w-4" />Deschide discuția</Link>}
        <Link to={`/projects/${p.id}`} className="rounded-md border border-fm-graphite/25 px-4 py-2.5 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">Detalii proiect</Link>
        {match.status === 'SUGGESTED' && onDismiss && <button onClick={() => onDismiss(match)} className="ml-auto text-sm font-medium text-fm-slate/60 hover:text-red-500">Nu mă interesează</button>}
      </div>
    </Card>
  );
}

// Carduri pentru Explorează
export function FreelancerCard({ f, action }) {
  return (
    <Card hover className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Link to={`/freelancers/${f.id}`}><Avatar name={f.name} src={f.avatarUrl} size="h-12 w-12" /></Link>
        <div className="min-w-0 flex-1">
          <Link to={`/freelancers/${f.id}`} className="block truncate font-semibold text-fm-ink hover:underline">{f.name}</Link>
          <p className="truncate text-sm text-fm-slate/70">{f.title}</p>
        </div>
        <TierBadge tier={f.tier} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fm-slate/70">
        <span className="font-semibold text-fm-ink">{formatRate(f.hourlyRate)}</span>
        <Status tone={availTone[f.availability]}>{AVAILABILITY[f.availability]}</Status>
        {f.reviewsCount > 0 ? <span className="inline-flex items-center gap-1"><Stars value={f.ratingAvg} size="h-3.5 w-3.5" />({f.reviewsCount})</span> : <span>Fără recenzii încă</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{f.skills?.slice(0, 4).map((s) => <Tag key={s.id}>{s.name}</Tag>)}{f.skills?.length > 4 && <Tag>+{f.skills.length - 4}</Tag>}</div>
      <div className="mt-auto flex items-center gap-2 pt-4">{action}<Link to={`/freelancers/${f.id}`} className="rounded-md border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">Profil</Link></div>
    </Card>
  );
}

export function ProjectCard({ p }) {
  return (
    <Card hover className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link to={`/projects/${p.id}`} className="text-base font-semibold text-fm-ink hover:underline">{p.title}</Link>
        {p.isStarter && <Status tone="success" icon="rocket">Proiect de start</Status>}
      </div>
      <p className="mt-1 text-sm text-fm-slate/70">{p.category?.name} · {formatBudget(p.budgetMin, p.budgetMax)} · {timeAgo(p.createdAt)}</p>
      <p className="mt-3 line-clamp-2 text-sm text-fm-slate/80">{p.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{p.skills?.slice(0, 5).map((s) => <Tag key={s.id}>{s.name}</Tag>)}</div>
      <div className="mt-4 flex items-center justify-between"><Chip icon="user">{p.client?.name}</Chip><Link to={`/projects/${p.id}`} className="text-sm font-semibold text-fm-accent hover:underline">Vezi detalii →</Link></div>
    </Card>
  );
}
