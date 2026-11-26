import { get, put } from './api.js';
const unwrap = (response) => response?.data ?? response;
export const mine = () => get('/clients/me').then(unwrap);
export const saveMine = (body) => put('/clients/me', body).then(unwrap);
