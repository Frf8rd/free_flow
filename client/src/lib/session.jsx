import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { me } from '../data/mock.js';
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
  const [theme, setThemeState] = useState(() => read('fm-theme', 'system'));
  const [system, setSystem] = useState(sysDark);
  const [userDetails, setUserDetails] = useState(() => {
    try { return JSON.parse(read('fm-user-details', '{}')) || {}; } catch { return {}; }
  });

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = (e) => setSystem(e.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const dark = theme === 'dark' || (theme === 'system' && system);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  useEffect(() => { useAuth.getState().bootstrap(); }, []);

  const mode = authUser?.role === 'CLIENT' || authUser?.role === 'FREELANCER' ? authUser.role : modeOverride;
  const setMode = useCallback(async (m) => {
    if (!['CLIENT', 'FREELANCER'].includes(m)) return null;
    if (authUser) {
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
      write('fm-user-details', JSON.stringify(next));
      return next;
    });
  }, []);
  // test: localStorage.setItem('fm-admin','1') + reload arată secțiunea Administrare
  const user = useMemo(() => {
    const base = authUser || me;
    const name = userDetails.name || base.name || me.name;
    const initials = userDetails.initials || name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return { ...base, ...userDetails, name, initials, avatar: userDetails.avatar || base.avatarUrl || base.avatar, isAdmin: base.role === 'ADMIN' };
  }, [authUser, userDetails]);

  const value = useMemo(() => ({ user, updateUser, mode, setMode, theme, setTheme, dark }), [user, updateUser, mode, setMode, theme, setTheme, dark]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
