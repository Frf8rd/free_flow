import { post } from './api.js';
export const create = (body) => post('/reports', body); // { targetType: USER|PROJECT|MESSAGE|REVIEW, targetId, reason }
