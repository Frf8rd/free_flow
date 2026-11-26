import { get, patch, del } from './api.js';
import { asPage } from '../lib/shape.js';

// Statisticile vin de la server ca { totals, usersByRole, projectsByStatus, reportsByStatus }.
export const stats = () => get('/admin/stats').then((d) => {
  const s = d?.data ?? d ?? {};
  const t = s.totals || {};
  return {
    users: t.users ?? 0, projects: t.projects ?? 0, reports: t.reports ?? 0, engagements: t.engagements ?? 0,
    usersByRole: s.usersByRole || {}, projectsByStatus: s.projectsByStatus || {}, reportsByStatus: s.reportsByStatus || {},
  };
});
export const users = (p) => get('/admin/users', p).then(asPage);
export const updateUser = (id, body) => patch(`/admin/users/${id}`, body); // { isBlocked?, role? }
export const projects = (p) => get('/admin/projects', p).then(asPage);
export const updateProject = (id, body) => patch(`/admin/projects/${id}`, body); // { status }
export const removeProject = (id) => del(`/admin/projects/${id}`);
export const reports = (p) => get('/admin/reports', p).then(asPage);
export const activity = () => get('/admin/activity');
export const resolveReport = (id, body) => patch(`/admin/reports/${id}`, body); // { status: RESOLVED|DISMISSED, resolution? }
