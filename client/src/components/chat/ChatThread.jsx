import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../lib/chat.jsx';
import { useMessages } from '../../hooks/queries.js';
import { useAuth } from '../../store/authStore.js';
import { formatTime } from '../../lib/format.js';

function messageRestriction(conv, userId) {
  if (conv.engagementStatus) {
    if (['IN_PROGRESS', 'DELIVERED'].includes(conv.engagementStatus)) return '';
    if (conv.engagementStatus === 'PENDING') return 'Propunerea de colaborare așteaptă un răspuns. Vei putea scrie după acceptare.';
    return 'Colaborarea s-a încheiat. Poți citi mesajele anterioare.';
  }

  switch (conv.matchStatus) {
    case 'ACCEPTED':
      return '';
    case 'FREELANCER_INTERESTED':
      return conv.freelancerId === userId
        ? 'Așteptăm invitația clientului. Vei putea scrie aici după ce te invită.'
        : 'Invită freelancerul din Potriviri pentru a putea discuta aici.';
    case 'CLIENT_INVITED':
      return conv.clientId === userId
        ? 'Așteptăm răspunsul freelancerului. Vei putea scrie aici după ce acceptă invitația.'
        : 'Confirmă interesul din Potriviri pentru a putea discuta aici.';
    default:
      return 'Trimiterea mesajelor este disponibilă după confirmarea potrivirii de ambele părți.';
  }
}

export default function ChatThread({ conv, className = '' }) {
  const { send, markRead, connected } = useChat();
  const me = useAuth((s) => s.user);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const listRef = useRef(null);
  const query = useMessages(conv.id, connected);
  const messages = query.data || [];
  const restriction = messageRestriction(conv, me?.id);

  useEffect(() => { markRead(conv.id); }, [conv.id, conv.unread, markRead]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [conv.id, messages.length]);
  const submit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || restriction || sending) return;
    setSendError('');
    setSending(true);
    try {
      await send(conv.id, text);
      setDraft((current) => current.trim() === text ? '' : current);
    } catch (error) {
      setSendError(error?.message || 'Mesajul nu a fost trimis. Încearcă din nou.');
    } finally {
      setSending(false);
    }
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
      {!query.isPending && !query.isError && messages.length === 0 && !restriction && <p className="py-10 text-center text-sm text-fm-slate/60">Niciun mesaj încă. Poți trimite primul mesaj.</p>}
      {days.map((group) => <div key={group.day} className="space-y-2.5"><p className="text-center text-[11px] font-semibold text-fm-slate/50">{group.day}</p>
        {group.items.map((message) => {
          const mine = message.senderId === me?.id;
          return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] whitespace-pre-wrap break-words px-4 py-2.5 sm:max-w-[70%] ${mine ? 'bg-fm-ink text-white' : 'border border-fm-ink/10 bg-white text-fm-ink'}`}><p className="text-sm leading-relaxed">{message.content}</p><p className={`mt-1 text-[11px] ${mine ? 'opacity-60' : 'text-fm-slate/50'}`}>{formatTime(message.createdAt)}</p></div></div>;
        })}</div>)}
    </div>
    <form onSubmit={submit} className="shrink-0 border-t border-fm-ink/10 bg-white p-3 sm:p-4">
      {restriction && <p id="chat-message-restriction" role="status" className="mb-3 border-l-2 border-fm-accent-solid bg-fm-accent/10 px-3 py-2 text-sm text-fm-ink">{restriction}</p>}
      {sendError && !restriction && <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">{sendError}</p>}
      <div className="flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={Boolean(restriction)} placeholder={restriction ? 'Trimiterea este indisponibilă' : 'Scrie un mesaj…'} aria-label="Mesaj" aria-describedby={restriction ? 'chat-message-restriction' : undefined} className="min-w-0 flex-1 border border-fm-graphite/15 bg-fm-mist/40 px-4 py-3 text-sm text-fm-ink placeholder:text-fm-slate/55 focus:outline-none focus:ring-2 focus:ring-fm-graphite/30 disabled:opacity-60" />
        <button type="submit" aria-label="Trimite" disabled={Boolean(restriction) || sending || !draft.trim()} className="grid h-11 w-11 shrink-0 place-items-center bg-fm-ink text-white hover:bg-fm-graphite disabled:opacity-50">➤</button>
      </div>
    </form>
  </div>;
}
