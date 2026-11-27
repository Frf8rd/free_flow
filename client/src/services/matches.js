import { get, post } from './api.js';
import { asMatch, asPage, clean } from '../lib/shape.js';

export const mine = (p) => get('/matches/me', clean(p)).then(asPage).then((page) => ({ ...page, data: page.data.map(asMatch) }));
function asMatchAction(response) {
  const result = response?.data ?? response;
  return { ...result, conversationId: result?.conversationId ?? result?.conversation?.id };
}

export const interest = (id) => post(`/matches/${id}/interest`, {}).then(asMatchAction);
export const invite = (id) => post(`/matches/${id}/invite`, {}).then(asMatchAction);
export const inviteManual = (body) => post('/matches/invite', body).then(asMatchAction);
export const dismiss = (id, reason) => post(`/matches/${id}/dismiss`, { reason });
export const refresh = (projectId) => post('/matches/refresh', { projectId });
export const impressions = (matchIds) => post('/matches/impressions', { matchIds });
