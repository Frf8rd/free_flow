import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../lib/chat.jsx';
import { useMessages } from '../../hooks/queries.js';
import { useAuth } from '../../store/authStore.js';
import { formatTime } from '../../lib/format.js';

export default function ChatThread({ conv, className = '' }) {
  const { send, markRead, connected } = useChat();
  const me = useAuth((s) => s.user);
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const query = useMessages(conv.id, connected);
  const messages = query.data || [];

  useEffect(() => { markRead(conv.id); }, [conv.id, conv.unread, markRead]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [conv.id, messages.length]);
  const submit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try { await send(conv.id, text); } catch { setDraft(text); }
  };
  const days = messages.reduce((groups, message) => {
    const day = new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(message); else groups.push({ day, items: [message] });
    return groups;
  }, []);

  return <div className={`flex min-h-0 flex-col ${className}`}>
    <div ref={listRef} className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto bg-fm-mist/25 p-3 sm:p-5" role="log" aria-live="polite" aria-label={`Conversația cu ${conv.name}`}>
      {query.isPending && <p className="py-8 text-center text-sm text-fm-slate/60">Se încarcă mesajele…</p>}
      {query.isError && <p className="py-8 text-center text-sm text-red-600">{query.error?.message || 'Mesajele nu s-au încărcat.'}</p>}
      {!query.isPending && !query.isError && messages.length === 0 && <p className="py-10 text-center text-sm text-fm-slate/60">Niciun mesaj încă.</p>}
      {days.map((group) => <div key={group.day} className="space-y-2.5"><p className="text-center text-[11px] font-semibold text-fm-slate/50">{group.day}</p>
        {group.items.map((message) => {
          const mine = message.senderId === me?.id;
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] whitespace-pre-wrap break-words px-4 py-2.5 sm:max-w-[70%] ${mine ? 'bg-fm-ink text-white' : 'border border-fm-ink/10 bg-white text-fm-ink'}`}><p className="text-sm leading-relaxed">{message.content}</p><p className={`mt-1 text-[11px] ${mine ? 'opacity-60' : 'text-fm-slate/50'}`}>{formatTime(message.createdAt)}</p></div></div>;
        })}</div>)}
    </div>
    <form onSubmit={submit} className="shrink-0 border-t border-fm-ink/10 bg-white p-3 sm:p-4"><div className="flex items-center gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Scrie un mesaj…" aria-label="Mesaj" className="min-w-0 flex-1 border border-fm-graphite/15 bg-fm-mist/40 px-4 py-3 text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none focus:ring-2 focus:ring-fm-graphite/30" /><button type="submit" aria-label="Trimite" disabled={!draft.trim()} className="grid h-11 w-11 shrink-0 place-items-center bg-fm-ink text-white hover:bg-fm-graphite disabled:opacity-50"><span className="sr-only">Trimite</span>➤</button></div></form>
  </div>;
}
