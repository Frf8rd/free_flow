import { get, put } from './api.js';
export const mine = () => get('/clients/me');
export const saveMine = (body) => put('/clients/me', body);
