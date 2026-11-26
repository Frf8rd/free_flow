import { get, post, patch, del } from './api.js';
import { asList, asPage, clean } from '../lib/shape.js';

export const list = (p) => get('/projects', clean({ status: 'OPEN', ...p })).then(asPage);
export const mine = () => get('/projects/me').then(asList);
export const byId = (id) => get(`/projects/${id}`);
export const create = (body) => post('/projects', body);
export const update = (id, body) => patch(`/projects/${id}`, body);
export const remove = (id) => del(`/projects/${id}`);
// { status: PENDING|RUNNING|DONE|FAILED, data: [match], analysis: { questions, assumptions, needsInfo } }
export const matches = (id) => get(`/projects/${id}/matches`);
