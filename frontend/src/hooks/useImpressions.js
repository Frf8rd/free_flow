import { useCallback, useEffect, useRef } from 'react';
import * as matches from '../services/matches.js';

// Strânge id-urile cardurilor văzute și le trimite în grup (max 50, README 5.4); serverul deduplică pe zi.
const sent = new Set();
export default function useImpressions() {
  const queue = useRef(new Set());
  const timer = useRef(null);

  const flush = useCallback(() => {
    clearTimeout(timer.current); timer.current = null;
    const ids = [...queue.current].slice(0, 50);
    queue.current = new Set([...queue.current].slice(50));
    if (ids.length) matches.impressions(ids).catch(() => {}); // metrică: un eșec nu trebuie să deranjeze utilizatorul
  }, []);

  const track = useCallback((id) => {
    if (!id || sent.has(id)) return;
    sent.add(id); queue.current.add(id);
    if (!timer.current) timer.current = setTimeout(flush, 2000);
  }, [flush]);

  useEffect(() => () => flush(), [flush]);
  return track;
}
