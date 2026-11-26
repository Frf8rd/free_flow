import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ChatThread from '../components/chat/ChatThread.jsx';
import StartEngagement from '../components/chat/StartEngagement.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Avatar, Status } from '../components/ui/Kit.jsx';
import { useChat } from '../lib/chat.jsx';

export default function Messages() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { convs, loading, error, join } = useChat();
  const [q, setQ] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const selectedId = id || searchParams.get('c');
  const active = convs.find((c) => c.id === selectedId) || (!selectedId ? convs[0] : null);
  const showChat = Boolean(selectedId && active); // pe telefon: listă sau conversație
  const list = convs.filter((c) => `${c.name} ${c.project}`.toLowerCase().includes(q.toLowerCase()) && (!onlyUnread || c.unread));

  useEffect(() => {
    join(active?.id);
    return () => join('');
  }, [active?.id, join]);

  return (
    <AppLayout>
      <div className="grid min-h-0 flex-1 bg-fm-page/45 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className={`min-h-0 flex-col border-fm-ink/10 bg-fm-mist/25 lg:flex lg:border-r ${showChat ? 'hidden' : 'flex'}`}>
          <div className="shrink-0 space-y-3 border-b border-fm-ink/10 p-4">
            <div><h1 className="text-lg font-bold text-fm-ink">Mesaje</h1><p className="mt-0.5 text-xs text-fm-slate/60">Conversațiile legate de proiectele și invitațiile tale.</p></div>
            <label className="flex items-center gap-2.5 rounded-md bg-white px-3 py-2.5 ring-1 ring-fm-ink/10 focus-within:ring-2 focus-within:ring-fm-graphite/30">
              <Icon name="search" className="h-4 w-4 text-fm-slate/55" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută conversații…" aria-label="Caută conversații" className="w-full bg-transparent text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none" />
            </label>
            <div className="flex gap-2">
              {[['Toate', false], ['Necitite', true]].map(([l, v]) => <button key={l} onClick={() => setOnlyUnread(v)} aria-pressed={onlyUnread === v} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${onlyUnread === v ? 'bg-fm-ink text-white' : 'bg-fm-mist/70 text-fm-ink hover:bg-fm-mist'}`}>{l}</button>)}
            </div>
          </div>
          <ul className="thin-scroll min-h-0 flex-1 overflow-y-auto">
            {loading && <li className="p-5 text-sm text-fm-slate/60">Se încarcă conversațiile…</li>}
            {error && <li className="p-5 text-sm text-red-600">{error.message}</li>}
            {list.length === 0 && <li className="p-6 text-center text-sm text-fm-slate/60">Nicio conversație găsită.</li>}
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => navigate(`/messages/${c.id}`)} aria-current={active?.id === c.id} className={`flex w-full items-center gap-3 border-b border-fm-ink/5 px-4 py-3.5 text-left transition hover:bg-fm-mist/50 ${active?.id === c.id ? 'bg-fm-mist/45' : ''}`}>
                  <Avatar initials={c.initials} tone={c.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2"><span className="truncate text-sm font-semibold text-fm-ink">{c.name}</span><span className="shrink-0 text-[11px] text-fm-slate/55">{c.time}</span></span>
                    <span className="block truncate text-xs text-fm-slate/60">{c.project}</span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${c.unread ? 'font-semibold text-fm-ink' : 'text-fm-slate/70'}`}>{c.lastMessage?.content || 'Conversație nouă'}</span>
                      {c.unread > 0 && <span className="grid min-w-5 shrink-0 place-items-center rounded-md bg-red-500 px-1.5 text-[11px] font-semibold text-white">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>))}
          </ul>
        </aside>

        {active ? (
          <section className={`min-h-0 min-w-0 flex-col lg:flex ${showChat ? 'flex' : 'hidden'}`}>
            <header className="flex shrink-0 items-center gap-3 border-b border-fm-ink/10 px-3 py-3 sm:px-5">
              <button onClick={() => navigate('/messages')} aria-label="Înapoi la conversații" className="grid h-10 w-10 place-items-center rounded-md border border-fm-graphite/15 text-fm-ink hover:bg-fm-mist/50 lg:hidden"><Icon name="chevronLeft" className="h-5 w-5" /></button>
              <Avatar initials={active.initials} tone={active.tone} />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-fm-ink">{active.name}</p><p className="truncate text-xs text-fm-slate/60">{active.project}</p></div>
              <div className="ml-auto shrink-0"><StartEngagement conversation={active} /></div>
            </header>
            <ChatThread conv={active} className="flex-1" />
          </section>
        ) : <section className="hidden place-items-center lg:grid"><p className="text-sm text-fm-slate/60">Conversația nu există.</p></section>}

        {active && (
          <aside className="hidden min-h-0 overflow-y-auto border-l border-fm-ink/10 bg-fm-mist/25 p-4 xl:block" aria-label="Detalii conversație">
            <div className="rounded-lg border border-fm-ink/10 bg-white p-4 text-center">
              <Avatar initials={active.initials} tone={active.tone} size="mx-auto h-14 w-14" />
              <p className="mt-3 text-sm font-semibold text-fm-ink">{active.name}</p>
              <p className="text-xs text-fm-slate/65">{active.headline}</p>
            </div>
            <div className="mt-3 rounded-lg border border-fm-ink/10 bg-white p-4">
              <Status tone={active.mine ? 'dark' : 'neutral'}>{active.mine ? 'Proiectul tău' : 'Candidezi la acest proiect'}</Status>
              <p className="mt-3 text-sm font-semibold text-fm-ink">{active.project}</p>
              {active.projectId && <Link to={`/projects/${active.projectId}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-fm-graphite hover:text-fm-ink">Vezi proiectul <Icon name="arrow" className="h-3.5 w-3.5" /></Link>}
            </div>
            <Link to="/engagements" className="mt-3 flex items-center gap-2 rounded-lg border border-fm-ink/10 bg-white p-4 text-sm font-semibold text-fm-ink hover:bg-fm-snow"><Icon name="handshake" className="h-4 w-4" /> Colaborări</Link>
          </aside>)}
      </div>
    </AppLayout>
  );
}
