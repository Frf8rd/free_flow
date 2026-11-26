import { useCallback, useEffect, useState } from 'react';

const eventName = (key) => `fm-demo:${key}`;

export function readDemo(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved != null) return JSON.parse(saved);
  } catch { /* folosește date demonstrative când stocarea nu este disponibilă */ }
  return typeof fallback === 'function' ? fallback() : fallback;
}

export function writeDemo(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* datele rămân disponibile în sesiune */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(eventName(key), { detail: value }));
  return value;
}

export function useDemoState(key, fallback) {
  const [value, setValue] = useState(() => readDemo(key, fallback));
  useEffect(() => {
    setValue(readDemo(key, fallback));
    const sync = (event) => setValue(event.detail ?? readDemo(key, fallback));
    const storage = (event) => { if (event.key === key) setValue(readDemo(key, fallback)); };
    window.addEventListener(eventName(key), sync);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(eventName(key), sync); window.removeEventListener('storage', storage); };
  }, [key]);
  const update = useCallback((nextOrUpdate) => {
    setValue((current) => {
      const next = typeof nextOrUpdate === 'function' ? nextOrUpdate(current) : nextOrUpdate;
      writeDemo(key, next);
      return next;
    });
  }, [key]);
  return [value, update];
}
