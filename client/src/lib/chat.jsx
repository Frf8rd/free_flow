import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations } from '../hooks/queries.js';
import * as conversations from '../services/conversations.js';
import { initials, timeAgo } from './format.js';
import { useAuth } from '../store/authStore.js';
import { tokens } from './tokens.js';
import { config } from '../config.js';
import { refreshSession } from '../services/api.js';

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
  const [connected, setConnected] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState('');
  const socketRef = useRef(null);
  const query = useConversations(!!user, connected);
  const qc = useQueryClient();
  const convs = useMemo(() => (query.data || []).map(normalize), [query.data]);
  const hasActiveConversation = Boolean(activeConversationId);
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
  const join = useCallback((id) => setActiveConversationId(id || ''), []);

  useEffect(() => {
    const token = tokens.getAccess();
    // Keep the free Render instance eligible to sleep while the user is elsewhere
    // in the app; Socket.IO is needed only for the active conversation screen.
    if (!user?.id || !token || !hasActiveConversation || !config.socketUrl) {
      setConnected(false);
      return undefined;
    }
    const socket = io(config.socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });
    let refreshing = false;
    const renewAndReconnect = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await refreshSession();
        socket.auth = { token: tokens.getAccess() };
        socket.connect();
      } catch {
        tokens.logout();
      } finally {
        refreshing = false;
      }
    };
    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') void renewAndReconnect();
    });
    socket.on('connect_error', (error) => {
      setConnected(false);
      if (error?.message === 'UNAUTHENTICATED') void renewAndReconnect();
    });
    socket.on('message:new', (message) => {
      qc.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['counts'] });
    });
    for (const event of ['notification:new', 'engagement:new', 'engagement:updated', 'projects:new']) {
      socket.on(event, () => {
        if (event !== 'projects:new') qc.invalidateQueries({ queryKey: ['conversations'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['engagements'] });
        qc.invalidateQueries({ queryKey: ['projects'] });
        qc.invalidateQueries({ queryKey: ['projects-me'] });
        qc.invalidateQueries({ queryKey: ['counts'] });
      });
    }
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id, hasActiveConversation, qc]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !activeConversationId) return;
    socket.emit('conversation:join', activeConversationId, (result) => {
      if (!result?.ok) qc.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [activeConversationId, connected, qc]);

  const value = useMemo(() => ({ convs, typing: null, send, markRead, start, join, connected, unreadTotal, loading: query.isPending, error: query.error }), [convs, send, markRead, start, join, connected, unreadTotal, query.isPending, query.error]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useChat = () => useContext(Ctx);
