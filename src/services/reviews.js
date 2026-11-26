import api from './api.js';

export const create = (engagementId, data) => api.post(`/engagements/${engagementId}/reviews`, data).then((r) => r.data); // { rating, comment }
export const update = (id, data) => api.patch(`/reviews/${id}`, data).then((r) => r.data);
export const remove = (id) => api.delete(`/reviews/${id}`);
export const report = (data) => api.post('/reports', data); // { targetType, targetId, reason }
