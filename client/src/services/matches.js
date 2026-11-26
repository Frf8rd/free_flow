import { get, post } from './api.js';
import { asMatch, asPage, clean } from '../lib/shape.js';

export const mine = (p) => get('/matches/me', clean(p)).then(asPage).then((page) => ({ ...page, data: page.data.map(asMatch) }));
export const interest = (id) => post(`/matches/${id}/interest`, {});
export const invite = (id) => post(`/matches/${id}/invite`, {});
export const inviteManual = (body) => post('/matches/invite', body); // { projectId, freelancerId } -> { match, conversationId }
export const dismiss = (id, reason) => post(`/matches/${id}/dismiss`, { reason });
export const refresh = (projectId) => post('/matches/refresh', { projectId });
export const impressions = (matchIds) => post('/matches/impressions', { matchIds });
