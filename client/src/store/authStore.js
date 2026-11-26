import { create } from 'zustand';
import * as auth from '../services/auth.js';
import { refreshSession } from '../services/api.js';
import { tokens } from '../lib/tokens.js';
import { queryClient } from '../lib/queryClient.js';
import { track } from '../lib/analytics.js';

// status: loading (verificăm sesiunea la pornire) | authed | anon
export const useAuth = create((set, get) => ({
  user: null,
  status: 'loading',

  async bootstrap() {
    if (!tokens.hasRefresh()) return set({ status: 'anon' });
    try {
      await refreshSession();
      set({ user: await auth.me(), status: 'authed' });
    } catch {
      tokens.clear();
      set({ user: null, status: 'anon' });
    }
  },

  setSession({ user, accessToken, refreshToken }) {
    tokens.setAccess(accessToken);
    if (refreshToken) tokens.setRefresh(refreshToken);
    queryClient.clear();
    set({ user, status: 'authed' });
  },

  async login(form) {
    const d = await auth.login(form);
    get().setSession(d);
    // `me` aduce și starea profilului (onboarded)
    set({ user: await auth.me() });
    track('login', { role: get().user.role });
    return get().user;
  },

  async register(form) {
    const d = await auth.register(form);
    get().setSession(d);
    set({ user: await auth.me().catch(() => d.user) });
    track('register', { role: form.role });
    return get().user;
  },

  async logout() {
    try { await auth.logout(); } finally { get().clear(); }
  },

  async updateAccount(changes) {
    const user = await auth.updateAccount(changes);
    set((s) => ({ user: { ...s.user, ...user }, status: 'authed' }));
    return get().user;
  },

  // Apelat și de interceptor când refresh-ul eșuează
  clear() {
    tokens.clear();
    queryClient.clear();
    set({ user: null, status: 'anon' });
  },

  async reload() {
    const user = await auth.me();
    set({ user });
    return user;
  },
}));

tokens.setOnLogout(() => useAuth.getState().clear());
