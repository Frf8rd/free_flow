import { get, patch, del } from './api.js';
import { asPage } from '../lib/shape.js';

export const stats = () => get('/admin/stats');
export const users = (p) => get('/admin/users', p).then(asPage);
export const updateUser = (id, body) => patch(`/admin/users/${id}`, body); // { isBlocked?, role? }
export const projects = (p) => get('/admin/projects', p).then(asPage);
export const removeProject = (id) => del(`/admin/projects/${id}`);
export const reports = (p) => get('/admin/reports', p).then(asPage);
export const resolveReport = (id) => patch(`/admin/reports/${id}`, { resolved: true });
