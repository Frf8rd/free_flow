import { create } from 'zustand';

const read = () => { try { return localStorage.getItem('fm-theme') || 'system'; } catch { return 'system'; } };
const isDark = (t) => t === 'dark' || (t === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
const apply = (t) => document.documentElement.classList.toggle('dark', isDark(t));

export const useTheme = create((set) => ({
  theme: read(),
  dark: isDark(read()),
  setTheme(t) {
    try { localStorage.setItem('fm-theme', t); } catch { /* ignorat */ }
    apply(t);
    set({ theme: t, dark: isDark(t) });
  },
}));

apply(read());
if (typeof matchMedia !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { const { theme, setTheme } = useTheme.getState(); if (theme === 'system') setTheme('system'); });
}
