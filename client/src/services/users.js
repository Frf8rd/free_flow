import api from './api.js';

export const updateMe = (data) => api.patch('/users/me', data).then((r) => r.data);
export const deleteMe = (proof) => api.delete('/users/me', { data: proof });
