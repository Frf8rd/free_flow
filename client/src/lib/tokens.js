import { config } from '../config.js';

// Access token: doar în memorie (nu ajunge în localStorage). Refresh token: localStorage,
// sau cookie httpOnly gestionat de server când VITE_REFRESH_COOKIE=true (README, decizia 5).
const KEY = 'fm-refresh';
const COOKIE_SESSION_HINT = 'fm-cookie-session';
let access = null;
let onLogout = () => {};

const safe = (fn) => { try { return fn(); } catch { return null; } };

export const tokens = {
  getAccess: () => access,
  setAccess: (t) => { access = t || null; },
  getRefresh: () => (config.refreshCookie ? null : safe(() => localStorage.getItem(KEY))),
  setRefresh: (t) => { if (!config.refreshCookie) safe(() => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY))); },
  // Cookiele httpOnly nu pot fi citite din JavaScript. Păstrăm doar un indiciu
  // nesensibil ca să nu cerem refresh la fiecare vizită anonimă. La prima rulare
  // încercăm o dată, pentru a păstra sesiunile existente după actualizare.
  hasRefresh: () => config.refreshCookie
    ? safe(() => localStorage.getItem(COOKIE_SESSION_HINT)) !== '0'
    : !!safe(() => localStorage.getItem(KEY)),
  markSessionPresent() { if (config.refreshCookie) safe(() => localStorage.setItem(COOKIE_SESSION_HINT, '1')); },
  clear() {
    access = null;
    safe(() => localStorage.removeItem(KEY));
    if (config.refreshCookie) safe(() => localStorage.setItem(COOKIE_SESSION_HINT, '0'));
  },
  setOnLogout: (fn) => { onLogout = fn; },
  logout() { this.clear(); onLogout(); },
};
