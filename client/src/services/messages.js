import api from './api.js';

export const conversations = () => api.get('/conversations').then((r) => r.data);
export const start = (data) => api.post('/conversations', data).then((r) => r.data); // doar după interes / invitație
export const list = (id, params) => api.get(`/conversations/${id}/messages`, { params }).then((r) => r.data);
export const send = (id, content) => api.post(`/conversations/${id}/messages`, { content }).then((r) => r.data);
export const markRead = (id) => api.patch(`/conversations/${id}/read`);
