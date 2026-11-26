import api from './api.js';

export const getCategories = () => api.get('/categories').then((r) => r.data);
export const getSkills = (params) => api.get('/skills', { params }).then((r) => r.data); // ?categoryId=&q=
