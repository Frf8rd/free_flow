import { useEffect, useRef, useState } from 'react';
import { config } from '../config.js';

export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · FairMatch` : 'FairMatch — Freelancing cu șanse egale';
    return () => { document.title = prev; };
  }, [title]);
}

// Detectează când un element e vizibil cel puțin `threshold` (README 9.7, punctul 4: impresii)
export function useInView(onSeen, { threshold = config.impressionVisibility } = {}) {
  const ref = useRef(null);
  const seen = useRef(false);
  const cb = useRef(onSeen);
  cb.current = onSeen;
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen.current) { seen.current = true; cb.current?.(); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

export function useCountdown(seconds) {
  const [left, setLeft] = useState(0);
  useEffect(() => { setLeft(seconds || 0); }, [seconds]);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}
