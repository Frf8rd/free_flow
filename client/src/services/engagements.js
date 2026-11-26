import { get, post, patch } from './api.js';
import { asList } from '../lib/shape.js';

export const mine = (p) => get('/engagements/me', p).then(asList);
export const byId = (id) => get(`/engagements/${id}`);
export const create = (body) => post('/engagements', body); // { matchId, agreedPrice, deadline? }
export const setStatus = (id, status) => patch(`/engagements/${id}/status`, { status });
export const setAiDisclosure = (id, usedAi) => patch(`/engagements/${id}/ai-disclosure`, { usedAi });
export const review = (id, body) => post(`/engagements/${id}/reviews`, body); // { rating, comment }
