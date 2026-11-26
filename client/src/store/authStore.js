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
    // Cookie-ul HttpOnly nu poate fi inspectat în JavaScript. Încearcă refresh-ul
    // la fiecare pornire chiar dacă indiciul local a rămas vechi după o sesiune anterioară.
    if (!tokens.usesHttpOnlyRefresh() && !tokens.hasRefresh()) return set({ status: 'anon' });
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
    tokens.markSessionPresent();
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
    const result = await auth.register(form);
    track('register_started', { role: form.role });
    return result;
  },

  async googleAuth({ credential, nonce, role, intent = 'login' }) {
    const d = await auth.googleLogin({ credential, nonce, role, intent });
    get().setSession(d);
    set({ user: await auth.me() });
    track(intent, { role: get().user.role, provider: 'google' });
    return get().user;
  },

  async logout() {
    try { await auth.logout(); } finally { get().clear(); }
  },

  async updateAccount(changes) {
    const previousRole = get().user?.role;
    const user = await auth.updateAccount(changes);
    if (user.role && user.role !== previousRole) queryClient.clear();
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
