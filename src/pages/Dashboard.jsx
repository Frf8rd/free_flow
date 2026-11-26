import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import SidePanel from '../components/dashboard/SidePanel.jsx';
import ProjectCard from '../components/project/ProjectCard.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Card, Empty } from '../components/ui/Kit.jsx';
import { useSession } from '../lib/session.jsx';
import { useMyProjects, useMyMatches, useProjectSearch, useInterest, useDismiss } from '../hooks/queries.js';
import useImpressions from '../hooks/useImpressions.js';
import { useToast } from '../components/feedback/Toast.jsx';
import { Async } from '../components/ui/Kit.jsx';

export default function Dashboard() {
  const { mode, user } = useSession();
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState(params.get('q') || '');
  const [submitted, setSubmitted] = useState(params.get('q') || '');
  const [tab, setTab] = useState(0);
  const [cat, setCat] = useState('');
  const isClient = mode === 'CLIENT';
  const mine = useMyProjects(isClient);
  const matches = useMyMatches({ status: 'new', page: 1, limit: 20 }, !isClient && tab === 0);
  const explore = useProjectSearch({ q: submitted || undefined, categoryId: cat || undefined, page: 1, limit: 20, _on: !isClient && tab === 1 });
  const interest = useInterest();
  const dismiss = useDismiss();
  const track = useImpressions();
  const { toast, error } = useToast();
  const scrollRef = useRef(null);
  const panelRef = useRef(null);
  const panelContent = <SidePanel mode={mode} />;

  useEffect(() => { if (panelOpen) { const fn = (event) => event.key === 'Escape' && setPanelOpen(false); window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn); } }, [panelOpen]);
  useEffect(() => { setTab(0); setCat(''); }, [mode]);

  const projectItems = (mine.data || []).filter((p) => tab === 1 ? p.status === 'DELIVERED' : ['OPEN', 'IN_PROGRESS'].includes(p.status));
  const matchedProjects = matches.data?.data || [];
  const exploredProjects = explore.data?.data || [];
  const categories = [...new Map(exploredProjects.map((p) => [p.category?.id, p.category?.name]).filter(([id, name]) => id && name)).entries()];
  const onSubmit = (event) => { event.preventDefault(); setSubmitted(search.trim()); const next = new URLSearchParams(params); if (search.trim()) next.set('q', search.trim()); else next.delete('q'); setParams(next, { replace: true }); };
  const onInterest = async (match) => { try { await interest.mutateAsync(match.id); toast('Interesul a fost trimis.'); } catch (e) { error(e); } };
  const onDismiss = async (match) => { try { await dismiss.mutateAsync({ id: match.id }); } catch (e) { error(e); } };

  return <AppLayout>
    <div ref={scrollRef} className="grid min-h-0 flex-1 overflow-y-auto thin-scroll xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="flex min-w-0 flex-col bg-fm-page/40">
        <section className="border-b border-fm-ink/10 p-3 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 border border-fm-ink/10 bg-white p-4 sm:p-5">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-fm-ink">{isClient ? 'Proiectele tale' : `Bun venit, ${user.name}`}</p><p className="mt-1 text-xs text-fm-slate/70">{isClient ? 'Urmărește proiectele publicate și răspunsurile primite.' : 'Proiectele potrivite profilului tău apar aici.'}</p></div>
            {isClient ? <Link to="/projects/new" className="inline-flex shrink-0 items-center gap-2 bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-fm-graphite"><Icon name="filePlus" className="h-4 w-4" /> Postează proiect</Link> : <Link to="/recommendations" className="inline-flex shrink-0 items-center gap-2 bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-fm-graphite"><Icon name="sparkle" className="h-4 w-4" /> Vezi potrivirile</Link>}
            {!isClient && tab === 1 && <form className="flex basis-full gap-2 border-t border-fm-ink/10 pt-3" onSubmit={onSubmit}><label className="flex min-w-0 flex-1 items-center gap-2 border border-fm-ink/10 bg-fm-page px-3 py-2.5"><Icon name="search" className="h-4 w-4 shrink-0 text-fm-slate/60" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută proiecte sau competențe…" className="min-w-0 w-full bg-transparent text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none" aria-label="Caută proiecte" /></label><button type="submit" className="shrink-0 border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">Caută</button></form>}
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 border-b border-fm-ink/10 px-3 pt-3 sm:px-5 sm:pt-4">
          <div className="no-scrollbar flex min-w-0 gap-5 overflow-x-auto sm:gap-7">
            {(isClient ? ['Proiecte active', 'Livrări de verificat'] : ['Potriviri pentru tine', 'Explorează proiecte']).map((label, index) => <button key={label} onClick={() => setTab(index)} className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-semibold ${tab === index ? 'border-fm-ink text-fm-ink' : 'border-transparent text-fm-slate/60 hover:text-fm-ink'}`}>{label}</button>)}
          </div>
          <button onClick={() => setPanelOpen(true)} className="mb-3 inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-fm-graphite xl:hidden"><Icon name="chart" className="h-4 w-4" /> Panou</button>
          <Link to={isClient ? '/projects/mine' : '/browse'} className="mb-3 hidden shrink-0 items-center gap-1 text-sm font-semibold text-fm-graphite hover:text-fm-ink sm:flex">{isClient ? 'Toate proiectele' : 'Explorează'} <Icon name="arrow" className="h-4 w-4" /></Link>
        </div>

        {!isClient && tab === 1 && <div className="border-b border-fm-ink/10 bg-fm-page/75 px-3 py-3 sm:px-5"><div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="group" aria-label="Categorii"><button onClick={() => setCat('')} aria-pressed={!cat} className={`shrink-0 px-3 py-1.5 text-xs font-semibold ${!cat ? 'bg-fm-ink text-white' : 'bg-fm-mist/60 text-fm-ink'}`}>Toate</button>{categories.map(([id, name]) => <button key={id} onClick={() => setCat(id)} aria-pressed={cat === id} className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-semibold ${cat === id ? 'bg-fm-ink text-white' : 'bg-fm-mist/60 text-fm-ink'}`}>{name}</button>)}</div></div>}

        <div className="min-w-0 flex-1 bg-fm-page/70">
          {isClient ? <Async q={mine}>{(projects) => { const rows = projects.filter((p) => tab === 1 ? p.status === 'DELIVERED' : ['OPEN', 'IN_PROGRESS'].includes(p.status)); return rows.length ? rows.map((p) => <Card key={p.id} className="mx-3 my-2 p-4 sm:mx-5 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-fm-ink">{p.title}</h2><p className="mt-1 text-xs text-fm-slate/60">{p.category?.name} · {p.status === 'DELIVERED' ? 'Livrare de verificat' : p.status === 'IN_PROGRESS' ? 'În lucru' : 'Deschis'}</p></div></div><p className="mt-3 line-clamp-2 text-sm text-fm-slate/75">{p.description}</p><div className="mt-4 flex flex-wrap justify-end gap-2"><Link to={`/projects/${p.id}`} className="border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-ink hover:bg-fm-mist/50">Detalii</Link>{p.status === 'OPEN' && <Link to={`/recommendations?project=${encodeURIComponent(p.id)}`} className="bg-fm-ink px-4 py-2 text-sm font-semibold text-white hover:bg-fm-graphite">Freelanceri potriviți</Link>}</div></Card>) : <Empty icon="folder" title={tab === 1 ? 'Nicio livrare de verificat' : 'Nu ai proiecte active'} text={tab === 1 ? undefined : 'Postează un proiect pentru a începe.'} action={tab === 0 && <Link to="/projects/new" className="bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white">Postează proiect</Link>} />; }}</Async>
            : tab === 0 ? <Async q={matches}>{(data) => data.data.length ? data.data.map((match) => <article key={match.id} ref={(node) => { if (node && node.dataset.seen !== '1') { const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { node.dataset.seen = '1'; track(match.id); observer.disconnect(); } }, { threshold: 0.5 }); observer.observe(node); } }}><ProjectCard p={match.project} score={match.score} /><div className="flex flex-wrap gap-2 border-b border-fm-ink/10 px-4 pb-4 sm:px-5"><button onClick={() => onInterest(match)} disabled={interest.isPending || match.status !== 'SUGGESTED'} className="bg-fm-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{match.status === 'FREELANCER_INTERESTED' ? 'Interes trimis' : 'Sunt interesat'}</button><button onClick={() => onDismiss(match)} className="border border-fm-graphite/25 px-4 py-2 text-sm font-semibold text-fm-slate">Ascunde</button></div></article>) : <Empty icon="sparkle" title="Încă nu ai potriviri" text="Completează profilul și vom afișa proiectele potrivite aici." action={<Link to="/profile/edit" className="bg-fm-ink px-4 py-2.5 text-sm font-semibold text-white">Completează profilul</Link>} />}</Async>
              : <Async q={explore}>{(data) => data.data.length ? data.data.map((p) => <ProjectCard key={p.id} p={p} />) : <Empty icon="search" title="Nu am găsit proiecte" text="Modifică filtrele sau încearcă altă căutare." />}</Async>}
        </div>
      </main>

      <aside aria-label="Panou lateral" className="hidden border-fm-ink/10 bg-fm-page/40 xl:relative xl:block xl:border-l"><div className="xl:absolute xl:inset-0"><div ref={panelRef} className="no-scrollbar grid content-start gap-4 p-4 xl:sticky xl:top-0 xl:overflow-y-auto">{panelContent}</div></div></aside>
    </div>
    {panelOpen && <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Panou"><button aria-label="Închide panoul" className="absolute inset-0 bg-black/50" onClick={() => setPanelOpen(false)} /><section className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-fm-page shadow-xl"><header className="flex shrink-0 items-center justify-between border-b border-fm-ink/10 px-4 py-3"><p className="text-sm font-semibold text-fm-ink">Panou</p><button onClick={() => setPanelOpen(false)} aria-label="Închide" className="grid h-9 w-9 place-items-center border border-fm-ink/15 text-fm-ink"><Icon name="close" className="h-4 w-4" /></button></header><div className="thin-scroll grid flex-1 content-start gap-3 overflow-y-auto p-3">{panelContent}</div></section></div>}
  </AppLayout>;
}
