import { createContext, useCallback, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations } from '../hooks/queries.js';
import * as conversations from '../services/conversations.js';
import { initials, timeAgo } from './format.js';
import { useAuth } from '../store/authStore.js';

const Ctx = createContext(null);
const normalize = (c) => ({
  ...c,
  name: c.other?.name || 'Conversație',
  initials: initials(c.other?.name || 'FM'),
  avatarUrl: c.other?.avatarUrl || '',
  headline: c.other?.role === 'FREELANCER' ? 'Freelancer' : 'Client',
  time: c.updatedAt ? timeAgo(c.updatedAt) : '',
  project: c.project?.title || 'Conversație directă',
  unread: c.unreadCount || 0,
  msgs: [],
});

export function ChatProvider({ children }) {
  const user = useAuth((s) => s.user);
  const query = useConversations(!!user);
  const qc = useQueryClient();
  const convs = useMemo(() => (query.data || []).map(normalize), [query.data]);
  const unreadTotal = convs.reduce((sum, c) => sum + c.unread, 0);
  const markRead = useCallback(async (id) => {
    try { await conversations.markRead(id); await qc.invalidateQueries({ queryKey: ['conversations'] }); } catch { /* lista se actualizează la următorul polling */ }
  }, [qc]);
  const send = useCallback(async (id, content) => {
    const message = content.trim();
    if (!message) return;
    await conversations.send(id, message);
    await Promise.all([qc.invalidateQueries({ queryKey: ['messages', id] }), qc.invalidateQueries({ queryKey: ['conversations'] })]);
  }, [qc]);
  const start = useCallback(async ({ projectId, otherUserId }) => {
    const existing = convs.find((c) => c.projectId === projectId && c.other?.id === otherUserId);
    const result = existing || await conversations.create({ projectId, otherUserId });
    await qc.invalidateQueries({ queryKey: ['conversations'] });
    return result.id || result.conversation?.id;
  }, [convs, qc]);
  const value = useMemo(() => ({ convs, typing: null, send, markRead, start, unreadTotal, loading: query.isPending, error: query.error }), [convs, send, markRead, start, unreadTotal, query.isPending, query.error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useChat = () => useContext(Ctx);
