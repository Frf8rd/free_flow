import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import ProjectImages from './ProjectImages.jsx';
import { formatBudget, timeAgo } from '../../lib/format.js';

export default function ProjectCard({ p, score }) {
  const skills = (p.skills || []).map((skill) => typeof skill === 'string' ? skill : skill.name).filter(Boolean);
  const images = p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : p.image ? [p.image] : [];
  const clientName = p.client?.name || p.author || 'Client FairMatch';
  return <article className="relative flex min-w-0 gap-3 border-b border-fm-graphite/10 p-4 last:border-b-0 sm:gap-5 sm:p-5">
    <div className="hidden h-11 w-11 shrink-0 place-items-center bg-fm-graphite text-sm font-semibold text-white sm:grid">{clientName.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}</div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 text-sm"><span className="font-semibold text-fm-ink">{clientName}</span><span className="text-fm-slate/60">· {timeAgo(p.createdAt) || 'recent'}</span>{score != null && <span className="ml-auto text-xs font-semibold text-fm-accent">{score}% potrivire</span>}</div>
      <Link to={`/projects/${p.id}`} className="mt-2 block text-base font-semibold text-fm-ink hover:underline">{p.title}</Link>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-fm-slate">{p.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">{skills.slice(0, 5).map((tag) => <span key={tag} className="bg-fm-mist/70 px-3 py-1 text-xs font-semibold text-fm-ink">{tag}</span>)}<span className="inline-flex items-center gap-1.5 border border-fm-graphite/10 px-3 py-1 text-xs font-medium text-fm-ink"><Icon name="wallet" className="h-3.5 w-3.5" />{formatBudget(p.budgetMin, p.budgetMax)}</span>{p.deadline && <span className="inline-flex items-center gap-1.5 border border-fm-graphite/10 px-3 py-1 text-xs font-medium text-fm-ink"><Icon name="clock" className="h-3.5 w-3.5" />{timeAgo(p.deadline)}</span>}</div>
      <Link to={`/projects/${p.id}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-fm-mist/60 px-5 py-2.5 text-sm font-semibold text-fm-ink transition hover:bg-fm-mist sm:w-auto">Vezi detalii <Icon name="arrow" className="h-4 w-4" /></Link>
    </div>
    {!!images.length && <div className="hidden w-40 shrink-0 md:block lg:w-48"><ProjectImages images={images} title={p.title} className="h-28 w-full" showControls={false} /><Link to={`/projects/${p.id}`} className="mt-3 flex w-full items-center justify-center gap-2 bg-fm-mist/60 px-4 py-2.5 text-sm font-semibold text-fm-ink hover:bg-fm-mist">Vezi detalii <Icon name="arrow" className="h-4 w-4" /></Link></div>}
  </article>;
}
