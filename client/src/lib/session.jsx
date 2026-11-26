import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../store/authStore.js';

// Un singur cont pentru toți: același utilizator poate posta proiecte (mod CLIENT) și poate lucra ca FREELANCER.
// `mode` doar alege ce vezi în interfață; datele și permisiunile rămân ale aceluiași cont.
const Ctx = createContext(null);
const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignoră */ } };
const sysDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

export function SessionProvider({ children }) {
  const authUser = useAuth((s) => s.user);
  const [modeOverride, setModeState] = useState(() => (read('fm-mode', 'CLIENT') === 'FREELANCER' ? 'FREELANCER' : 'CLIENT'));
  const [previousMode, setPreviousMode] = useState(() => {
    const saved = read('fm-previous-mode', '');
    return ['CLIENT', 'FREELANCER'].includes(saved) ? saved : '';
  });
  const [theme, setThemeState] = useState(() => read('fm-theme', 'system'));
  const [system, setSystem] = useState(sysDark);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = (e) => setSystem(e.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const dark = theme === 'dark' || (theme === 'system' && system);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  useEffect(() => { useAuth.getState().bootstrap(); }, []);

  useEffect(() => {
    if (!authUser?.id) {
      setUserDetails({});
      try { localStorage.removeItem('fm-user-details'); } catch { /* ignoră */ }
      return;
    }
    try {
      setUserDetails(JSON.parse(localStorage.getItem(`fm-user-details:${authUser.id}`) || '{}') || {});
    } catch {
      setUserDetails({});
    }
  }, [authUser?.id]);

  const mode = authUser?.role === 'CLIENT' || authUser?.role === 'FREELANCER' ? authUser.role : modeOverride;
  const setMode = useCallback(async (m) => {
    if (!['CLIENT', 'FREELANCER'].includes(m)) return null;
    if (authUser) {
      if (authUser.role !== m && ['CLIENT', 'FREELANCER'].includes(authUser.role)) {
        setPreviousMode(authUser.role);
        write('fm-previous-mode', authUser.role);
      }
      await useAuth.getState().updateAccount({ role: m });
      const updated = await useAuth.getState().reload();
      setModeState(updated.role || m);
      write('fm-mode', updated.role || m);
      return updated;
    }
    setModeState(m);
    write('fm-mode', m);
    return null;
  }, [authUser]);
  const setTheme = useCallback((t) => { setThemeState(t); write('fm-theme', t); }, []);
  const updateUser = useCallback((changes) => {
    setUserDetails((current) => {
      const next = { ...current, ...changes };
      if (authUser?.id) write(`fm-user-details:${authUser.id}`, JSON.stringify(next));
      return next;
    });
  }, [authUser?.id]);
  const user = useMemo(() => {
    const base = authUser || { name: 'Vizitator', role: modeOverride, avatarUrl: null };
    const name = authUser ? (userDetails.name || base.name) : base.name;
    const initials = userDetails.initials || name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return { ...base, ...userDetails, name, initials, avatar: userDetails.avatar || base.avatarUrl || base.avatar, isAdmin: base.role === 'ADMIN' };
  }, [authUser, userDetails, modeOverride]);

  const value = useMemo(() => ({ user, updateUser, mode, setMode, previousMode, theme, setTheme, dark }), [user, updateUser, mode, setMode, previousMode, theme, setTheme, dark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
