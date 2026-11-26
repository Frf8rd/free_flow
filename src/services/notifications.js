import { get, patch } from './api.js';
import { asPage } from '../lib/shape.js';

export const list = (p) => get('/notifications', p).then(asPage); // { unread?: true, page, limit }
export const read = (id) => patch(`/notifications/${id}/read`, {});
export const readAll = () => patch('/notifications/read-all', {});
