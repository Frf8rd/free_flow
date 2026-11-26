import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

export const Card = forwardRef(function Card({ className = '', hover = false, children, ...p }, ref) {
  return <section {...p} ref={ref} className={`border border-fm-ink/10 bg-white shadow-card ${hover ? 'transition-shadow hover:shadow-lift' : ''} ${className}`}>{children}</section>;
});

export const Tag = ({ children, className = '' }) => (
  <span className={`rounded-md bg-fm-mist/70 px-3 py-1 text-xs font-semibold text-fm-ink ${className}`}>{children}</span>
);

export const Chip = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-fm-graphite/10 bg-fm-snow px-3 py-1 text-xs font-medium text-fm-ink">
    {icon && <Icon name={icon} className="h-3.5 w-3.5" />}{children}
  </span>
);

export const Avatar = ({ initials, name, src, tone = 'from-fm-graphite to-fm-ink', size = 'h-11 w-11' }) => (
  src ? <img src={src} alt={name || ''} className={`${size} shrink-0 rounded-full object-cover`} />
    : <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-gradient-to-br ${tone} text-sm font-semibold text-white`}>{initials || (name || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}</span>
);

const statusStyle = {
  neutral: 'bg-fm-mist text-fm-ink',
  dark: 'bg-fm-ink text-white',
  outline: 'border border-fm-graphite/25 text-fm-ink',
  accent: 'bg-fm-accent-solid/10 text-fm-accent',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warn: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300',
};
export const Status = ({ tone = 'neutral', icon, children }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${statusStyle[tone] || statusStyle.neutral}`}>{icon && <Icon name={icon} className="h-3.5 w-3.5" />}{children}</span>
);

const tierLabels = { START: 'Start', VERIFIED: 'Verificat', PROVEN: 'Încercat', EXPERT: 'Expert' };
export const TierBadge = ({ tier = 'START' }) => <Status tone={tier === 'EXPERT' ? 'accent' : tier === 'START' ? 'outline' : 'neutral'}>{tierLabels[tier] || tier}</Status>;

export const Notice = ({ tone = 'info', icon = 'info', className = '', children }) => {
  const tones = {
    info: 'border-fm-graphite/20 bg-fm-mist/50 text-fm-ink',
    warn: 'border-amber-500/30 bg-amber-500/10 text-fm-ink',
    danger: 'border-red-500/30 bg-red-500/10 text-fm-ink',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-fm-ink',
  };
  return <div role="status" className={`flex items-start gap-2 border p-3 text-sm ${tones[tone] || tones.info} ${className}`}><Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>;
};

export function Tabs({ items, value, onChange }) {
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-fm-ink/10 sm:gap-7">
      {items.map((t, i) => (
        <button key={t.label} onClick={() => onChange(i)}
          className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition ${value === i ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60 hover:text-fm-ink'}`}>
          {t.label}
          {t.count != null && <span className="rounded-md bg-fm-mist/70 px-1.5 text-[11px]">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export const Empty = ({ icon = 'folder', title, text, action }) => (
  <div className="grid place-items-center px-6 py-14 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-md bg-fm-mist/70 text-fm-ink"><Icon name={icon} /></span>
    <p className="mt-4 text-base font-semibold text-fm-ink">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-fm-slate/70">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export function Stars({ value = 0, n, onChange, size = 'h-4 w-4' }) {
  const rating = Number(value || n || 0);
  return <span className="inline-flex items-center gap-0.5" aria-label={`${rating} din 5 stele`}>
    {[1, 2, 3, 4, 5].map((i) => onChange ? <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} stele`} className="text-amber-500"><Icon name="star" fill={i <= rating} className={size} /></button> : <Icon key={i} name="star" fill={i <= rating} className={`${size} ${i <= rating ? 'text-amber-500' : 'text-fm-mist'}`} />)}
  </span>;
}

export function SectionCard({ title, subtitle, action, children, className = '' }) {
  return <Card className={className}><header className="flex flex-wrap items-start justify-between gap-3 border-b border-fm-ink/10 p-4 sm:p-5"><div><h2 className="font-semibold text-fm-ink">{title}</h2>{subtitle && <p className="mt-1 text-sm text-fm-slate/65">{subtitle}</p>}</div>{action}</header><div className="p-4 sm:p-5">{children}</div></Card>;
}

export function SkeletonList({ n = 3 }) {
  return <div className="grid gap-3" aria-label="Se încarcă" aria-busy="true">{Array.from({ length: n }, (_, i) => <div key={i} className="animate-pulse border border-fm-ink/10 bg-white p-5"><div className="h-4 w-2/5 bg-fm-mist" /><div className="mt-3 h-3 w-4/5 bg-fm-mist/70" /><div className="mt-2 h-3 w-3/5 bg-fm-mist/70" /></div>)}</div>;
}

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse bg-fm-mist/70 ${className}`} />;
}

export function Async({ q, skeleton, children }) {
  if (q.isPending) return skeleton || <SkeletonList n={2} />;
  if (q.isError) return <Card><Empty icon="alert" title="Datele nu s-au încărcat" text={q.error?.message || 'Încearcă din nou.'} action={<button onClick={() => q.refetch?.()} className="border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink">Reîncarcă</button>} /></Card>;
  return typeof children === 'function' ? children(q.data) : children;
}

export function Pagination({ page = 1, limit = 20, total = 0, onChange }) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pages < 2) return null;
  return <nav aria-label="Paginare" className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span className="text-fm-slate/65">{(page - 1) * limit + 1}–{Math.min(page * limit, total)} din {total}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="border border-fm-graphite/20 px-3 py-2 disabled:opacity-40">Înapoi</button><button disabled={page >= pages} onClick={() => onChange(page + 1)} className="border border-fm-graphite/20 px-3 py-2 disabled:opacity-40">Înainte</button></div></nav>;
}

export function StatCard({ icon, value, label, hint }) {
  return <Card className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-fm-slate/65">{label}</span><Icon name={icon} className="h-4 w-4 text-fm-accent" /></div><p className="mt-2 text-2xl font-bold text-fm-ink">{value}</p>{hint && <p className="mt-1 text-xs text-fm-slate/60">{hint}</p>}</Card>;
}

export function PageLoader() {
  return <main className="grid min-h-screen place-items-center bg-fm-page p-6"><div role="status" className="flex items-center gap-3 text-sm text-fm-slate"><span className="h-5 w-5 animate-spin border-2 border-fm-graphite/20 border-t-fm-accent" />Se încarcă sesiunea…</div></main>;
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <span className={`inline-block animate-spin border-2 border-current/25 border-t-current ${className}`} role="status" aria-label="Se încarcă" />;
}

export function BackLink({ to, children = 'Înapoi' }) {
  const navigate = useNavigate();
  return <Link to={to || -1} onClick={to ? undefined : (e) => { e.preventDefault(); navigate(-1); }} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-fm-slate/75 hover:text-fm-ink"><Icon name="chevronLeft" className="h-4 w-4" />{children}</Link>;
}
