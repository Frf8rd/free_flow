import api, { get, post, patch, del } from './api.js';
import { asList, asMatch, asPage, asProject, clean } from '../lib/shape.js';

export const list = (p) => get('/projects', clean({ status: 'OPEN', ...p })).then(asPage).then((page) => ({ ...page, data: page.data.map(asProject) }));
export const mine = () => get('/projects/me').then(asList).then((rows) => rows.map(asProject));
const asEntity = (value) => value?.data && !Array.isArray(value.data) ? value.data : value;
export const byId = (id) => get(`/projects/${id}`).then(asEntity).then(asProject);
export const create = (body) => post('/projects', body).then(asEntity);
export const update = (id, body) => patch(`/projects/${id}`, body).then(asEntity);
export const close = (id) => patch(`/projects/${id}/close`, {}).then(asEntity);
export const remove = (id) => del(`/projects/${id}`);
// { status: PENDING|RUNNING|DONE|FAILED, data: [match], analysis: { questions, assumptions, needsInfo } }
export const matches = (id) => get(`/projects/${id}/matches`).then((result) => ({ ...result, data: asList(result).map(asMatch) }));
export const uploadAttachment = async (id, file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post(`/projects/${id}/attachments`, form, { timeout: 60000 });
  return data.data;
};
