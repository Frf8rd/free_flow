import { config } from '../config.js';

// Access token: doar în memorie (nu ajunge în localStorage). Refresh token: localStorage,
// sau cookie httpOnly gestionat de server când VITE_REFRESH_COOKIE=true (README, decizia 5).
const KEY = 'fm-refresh';
let access = null;
let onLogout = () => {};

const safe = (fn) => { try { return fn(); } catch { return null; } };

export const tokens = {
  getAccess: () => access,
  setAccess: (t) => { access = t || null; },
  getRefresh: () => (config.refreshCookie ? null : safe(() => localStorage.getItem(KEY))),
  setRefresh: (t) => { if (!config.refreshCookie) safe(() => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY))); },
  hasRefresh: () => config.refreshCookie || !!safe(() => localStorage.getItem(KEY)),
  clear() { access = null; safe(() => localStorage.removeItem(KEY)); },
  setOnLogout: (fn) => { onLogout = fn; },
  logout() { this.clear(); onLogout(); },
};
