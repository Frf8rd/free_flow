import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useSession } from '../../lib/session.jsx';
import { useCounts, useEngagements, useMyClient, useMyFreelancer, useMyMatches, useMyProjects, useTier } from '../../hooks/queries.js';

const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
const Toggle = ({ open }) => <Icon name="chevron" className={`h-4 w-4 transition ${open ? '' : '-rotate-90'}`} />;
const Progress = ({ value }) => <div className="h-1 overflow-hidden bg-fm-mist"><div className="h-full bg-fm-accent-solid" style={{ width: `${value}%` }} /></div>;

export default function SidePanel({ mode }) {
  const { user } = useSession();
  const client = mode === 'CLIENT';
  const key = `fm-widgets-${client ? 'client' : 'freelancer'}`;
  const defaults = client ? ['attention', 'projects', 'activity'] : ['attention', 'profile', 'matches', 'activity'];
  const [state, setState] = useState(() => read(key));
  useEffect(() => setState(read(key)), [key]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* setări locale */ } }, [key, state]);

  const counts = useCounts();
  const projects = useMyProjects(client);
  const matches = useMyMatches({ status: 'new', limit: 5 }, !client);
  const engagements = useEngagements();
  const freelancer = useMyFreelancer(!client);
  const clientProfile = useMyClient(client);
  const tier = useTier(!client);
  const projectRows = projects.data || [];
  const matchRows = matches.data?.data || [];
  const activeEngagements = (engagements.data || []).filter((item) => ['IN_PROGRESS', 'DELIVERED'].includes(item.status));
  const completion = client
    ? Math.round(([!!user.name, !!user.email, !!clientProfile.data?.type, !!clientProfile.data?.description].filter(Boolean).length / 4) * 100)
    : Math.round(([!!user.name, !!(user.avatarUrl || user.avatar), !!freelancer.data?.title, (freelancer.data?.bio || '').length >= 30, (freelancer.data?.skills || []).length >= 3, !!freelancer.data?.hourlyRate, (freelancer.data?.portfolio || []).length >= 1].filter(Boolean).length / 7) * 100);

  const items = useMemo(() => {
    const c = counts.data || {};
    const data = {
      attention: { title: 'De urmărit', meta: `${(c.notifications || 0) + (c.messages || 0)} noi`, body: <ul className="grid gap-1">
        {!client && <li><Link to="/recommendations" className="flex items-center gap-3 px-1 py-2 hover:bg-fm-mist/60"><Icon name="sparkle" className="h-4 w-4 text-fm-accent" /><span className="min-w-0 flex-1 text-sm">Potriviri noi</span><b className="text-sm">{c.matches || 0}</b></Link></li>}
        <li><Link to="/messages" className="flex items-center gap-3 px-1 py-2 hover:bg-fm-mist/60"><Icon name="chat" className="h-4 w-4 text-fm-accent" /><span className="min-w-0 flex-1 text-sm">Mesaje necitite</span><b className="text-sm">{c.messages || 0}</b></Link></li>
        <li><Link to="/notifications" className="flex items-center gap-3 px-1 py-2 hover:bg-fm-mist/60"><Icon name="bell" className="h-4 w-4 text-fm-accent" /><span className="min-w-0 flex-1 text-sm">Notificări noi</span><b className="text-sm">{c.notifications || 0}</b></Link></li>
        {client && <li><Link to="/engagements" className="flex items-center gap-3 px-1 py-2 hover:bg-fm-mist/60"><Icon name="check" className="h-4 w-4 text-fm-accent" /><span className="min-w-0 flex-1 text-sm">Livrări de verificat</span><b className="text-sm">{projectRows.filter((p) => p.status === 'DELIVERED').length}</b></Link></li>}
      </ul> },
      projects: { title: 'Proiectele tale', meta: 'Vezi toate', to: '/projects/mine', body: projectRows.length ? <ul className="grid gap-4">{projectRows.slice(0, 3).map((p) => <li key={p.id}><Link to={`/projects/${p.id}`} className="block truncate text-sm font-semibold text-fm-ink hover:underline">{p.title}</Link><p className="mt-1 text-xs text-fm-slate/65">{p.status === 'OPEN' ? 'Deschis' : p.status === 'DELIVERED' ? 'Livrare de verificat' : 'În lucru'} · {p.interestedCount || 0} interesați</p></li>)}</ul> : <div className="text-sm text-fm-slate/70"><p>Nu ai proiecte încă.</p><Link to="/projects/new" className="mt-2 inline-flex font-semibold text-fm-accent hover:underline">Postează un proiect</Link></div> },
      profile: { title: 'Profil freelancer', meta: `${completion}%`, to: '/profile/edit', body: <><Progress value={completion} /><p className="mt-2 text-xs text-fm-slate/70">{completion < 100 ? 'Adaugă detalii și exemple de lucru pentru un profil complet.' : 'Profil complet.'}</p>{tier.data && <p className="mt-3 text-xs text-fm-slate/65">Treapta {({ START: 'Start', VERIFIED: 'Verificat', PROVEN: 'Încercat', EXPERT: 'Expert' })[tier.data.tier] || tier.data.tier} · {tier.data.completed} proiecte finalizate</p>}</> },
      matches: { title: 'Potriviri recente', meta: 'Deschide', to: '/recommendations', body: matchRows.length ? <ul className="grid gap-3">{matchRows.slice(0, 3).map((m) => <li key={m.id}><Link to={`/projects/${m.project?.id}`} className="block text-sm font-semibold text-fm-ink hover:underline">{m.project?.title || 'Proiect potrivit'}</Link><p className="mt-1 text-xs text-fm-slate/65">{m.score}% · {m.project?.client?.name || 'Client'}</p></li>)}</ul> : <p className="text-sm text-fm-slate/65">Nu ai potriviri noi.</p> },
      activity: { title: 'Colaborări active', meta: 'Vezi toate', to: '/engagements', body: activeEngagements.length ? <ul className="grid gap-3">{activeEngagements.slice(0, 3).map((e) => <li key={e.id}><Link to={`/engagements/${e.id}`} className="block truncate text-sm font-semibold text-fm-ink hover:underline">{e.project?.title || e.title}</Link><p className="mt-1 text-xs text-fm-slate/65">{e.status === 'DELIVERED' ? 'Livrat · așteaptă confirmarea' : 'În lucru'}</p></li>)}</ul> : <p className="text-sm text-fm-slate/65">Nu ai colaborări active.</p> },
    };
    return data;
  }, [counts.data, client, projectRows, completion, tier.data, matchRows, activeEngagements]);

  const hidden = (state.hidden || []).filter((id) => defaults.includes(id));
  const collapsed = state.collapsed || [];
  const saved = (state.order || []).filter((id) => defaults.includes(id));
  const order = [...saved, ...defaults.filter((id) => !saved.includes(id))];
  const toggle = (list, id) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const patch = (next) => setState((current) => ({ ...current, ...next }));
  return <div className="grid min-w-0 w-full content-start gap-3">
    <div className="flex items-center justify-between px-0.5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fm-slate/70">Rezumat</p><Link to="/settings?section=dashboard" className="px-2 py-1 text-xs font-semibold text-fm-accent hover:underline">Setări</Link></div>
    {order.filter((id) => !hidden.includes(id)).map((id) => { const item = items[id]; const closed = collapsed.includes(id); return <section key={id} className="min-w-0 overflow-hidden border border-fm-ink/10 bg-white"><header className="flex min-w-0 items-center gap-1.5 px-3 py-2.5"><button onClick={() => patch({ collapsed: toggle(collapsed, id) })} aria-expanded={!closed} className="flex min-w-0 flex-1 items-center gap-1.5 text-left"><Toggle open={!closed} /><h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-fm-slate/70">{item.title}</h2></button>{item.to ? <Link to={item.to} className="shrink-0 text-xs font-semibold text-fm-accent hover:underline">{item.meta}</Link> : <span className="shrink-0 text-xs text-fm-slate/60">{item.meta}</span>}</header>{!closed && <div className="border-t border-fm-ink/10 px-3 py-3 sm:px-4 sm:py-4">{item.body}</div>}</section>; })}
  </div>;
}
