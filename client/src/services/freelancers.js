import { get, post, put, patch, del } from './api.js';
import { asPage, clean } from '../lib/shape.js';
const unwrap = (response) => response?.data ?? response;

export const list = (p) => get('/freelancers', clean(p)).then(asPage);
export const byId = (id) => get(`/freelancers/${id}`);
export const mine = () => get('/freelancers/me').then(unwrap);
export const saveMine = (body) => put('/freelancers/me', body).then(unwrap);
export const reviews = (id, p) => get(`/freelancers/${id}/reviews`, p).then(asPage);
export const tier = () => get('/freelancers/me/tier');
export const exposure = () => get('/freelancers/me/exposure'); // opțional: vezi API_CONTRACT.md
export const addPortfolio = (body) => post('/freelancers/me/portfolio', body);
export const updatePortfolio = (id, body) => patch(`/freelancers/me/portfolio/${id}`, body);
export const removePortfolio = (id) => del(`/freelancers/me/portfolio/${id}`);
