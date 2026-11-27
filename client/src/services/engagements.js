import { get, post, patch } from './api.js';
import { asList } from '../lib/shape.js';

function asEngagement(engagement) {
  return {
    ...engagement,
    client: { ...engagement.client, userId: engagement.client?.userId ?? engagement.clientId },
    freelancer: { ...engagement.freelancer, userId: engagement.freelancer?.userId ?? engagement.freelancerId },
    conversationId: engagement.conversationId ?? engagement.conversation?.id,
    reviews: engagement.reviews ?? [],
  };
}

export const mine = (p) => get('/engagements/me', p).then(asList).then((rows) => rows.map(asEngagement));
export const byId = (id) => get(`/engagements/${id}`).then((response) => asEngagement(response?.data ?? response));
export const create = (body) => post('/engagements', body); // { matchId, agreedPrice, deadline? }
export const setStatus = (id, status, usedAi) => patch(`/engagements/${id}/status`, { status, ...(usedAi !== undefined ? { usedAi } : {}) });
export const setAiDisclosure = (id, usedAi) => patch(`/engagements/${id}/ai-disclosure`, { usedAi });
export const review = (id, body) => post(`/engagements/${id}/reviews`, body); // { rating, comment }
