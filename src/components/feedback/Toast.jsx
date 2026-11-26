import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icon from '../ui/Icon.jsx';

const Ctx = createContext({ toast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s.slice(-3), { id, message, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);
  const value = useMemo(() => ({ toast, error: (e) => toast(e?.message || String(e), 'danger') }), [toast]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} role="status" className={`fm-pop pointer-events-auto flex max-w-md items-center gap-2.5 rounded-md px-4 py-3 text-sm font-medium shadow-lift ${t.tone === 'danger' ? 'bg-red-600 text-white' : 'bg-fm-ink text-white'}`}>
            <Icon name={t.tone === 'danger' ? 'alert' : 'check'} className="h-4 w-4 shrink-0" />{t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
