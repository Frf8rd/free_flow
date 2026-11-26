// Punct unic pentru evenimentele de produs (README 9.16 / 11.5). Fără furnizor configurat nu trimite nimic.
// Conectează aici Plausible/PostHog și respectă consimțământul GDPR înainte să activezi trimiterea.
const sinks = [];
export const onTrack = (fn) => { sinks.push(fn); return () => sinks.splice(sinks.indexOf(fn), 1); };
export function track(event, props = {}) {
  for (const s of sinks) { try { s(event, props); } catch { /* analytics nu strică aplicația */ } }
}
