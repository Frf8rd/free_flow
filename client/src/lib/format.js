import { config } from '../config.js';

const num = new Intl.NumberFormat(config.locale);
export const formatMoney = (n) => {
  if (n == null || n === '') return '—';
  try { return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, maximumFractionDigits: 0 }).format(n); } catch { return `${num.format(n)} ${config.currency}`; }
};
export const formatBudget = (min, max) => {
  if (min == null && max == null) return 'Buget deschis';
  if (min != null && max != null && min !== max) return `${formatMoney(min)} – ${formatMoney(max)}`;
  return formatMoney(max ?? min);
};
export const formatRate = (n) => (n == null ? 'Tarif la cerere' : `${formatMoney(n)}/h`);
export const currencySymbol = () => { try { return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }).formatToParts(0).find((p) => p.type === 'currency')?.value || config.currency; } catch { return config.currency; } };

const date = new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const time = new Intl.DateTimeFormat(config.locale, { hour: '2-digit', minute: '2-digit' });
const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' });

export const formatDate = (d) => (d ? date.format(new Date(d)) : '—');
export const formatDateTime = (d) => (d ? dateTime.format(new Date(d)) : '—');
export const formatTime = (d) => (d ? time.format(new Date(d)) : '');
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function timeAgo(d) {
  if (!d) return '';
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'acum';
  const steps = [[60, 'minute', 60], [3600, 'hour', 24], [86400, 'day', 30], [2592000, 'month', 12]];
  for (const [secs, unit, limit] of steps) {
    const v = Math.round(diff / secs);
    if (Math.abs(v) < limit) return rtf.format(v, unit);
  }
  return rtf.format(Math.round(diff / 31536000), 'year');
}

export const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';
export const daysUntil = (d) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null);
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const TIERS = { START: 'Start', VERIFIED: 'Verificat', PROVEN: 'Încercat', EXPERT: 'Expert' };
export const TIER_ORDER = ['START', 'VERIFIED', 'PROVEN', 'EXPERT'];
export const LEVELS = { BEGINNER: 'Începător', JUNIOR: 'Junior', MID: 'Mediu', SENIOR: 'Senior' };
export const AVAILABILITY = { AVAILABLE: 'Disponibil', LIMITED: 'Disponibilitate limitată', UNAVAILABLE: 'Indisponibil' };
export const PROJECT_STATUS = { OPEN: 'Deschis', IN_PROGRESS: 'În lucru', COMPLETED: 'Finalizat', CLOSED: 'Închis' };
export const ENGAGEMENT_STATUS = { PENDING: 'În așteptare', IN_PROGRESS: 'În lucru', DELIVERED: 'Livrat', COMPLETED: 'Finalizat', REJECTED: 'Refuzat', CANCELLED: 'Anulat' };
export const ROLE_LABEL = { CLIENT: 'Client', FREELANCER: 'Freelancer', ADMIN: 'Administrator' };
export const LANGUAGES = ['Română', 'Engleză', 'Rusă', 'Franceză', 'Germană', 'Italiană', 'Spaniolă'];
