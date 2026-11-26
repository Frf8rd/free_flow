import { get } from './api.js';
import { asList } from '../lib/shape.js';

export const categories = () => get('/categories').then(asList);
export const skills = (params) => get('/skills', params).then(asList); // { categoryId?, q? }
