import { get, post, patch } from './api.js';
import { asList } from '../lib/shape.js';

export const list = () => get('/conversations').then(asList);
export const messages = (id, p) => get(`/conversations/${id}/messages`, p).then(asList);
export const send = (id, content) => post(`/conversations/${id}/messages`, { content });
export const markRead = (id) => patch(`/conversations/${id}/read`, {});
export const create = (body) => post('/conversations', body); // { projectId, otherUserId }
