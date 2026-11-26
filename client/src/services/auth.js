import { get, post, patch } from './api.js';

const unwrapUser = (data) => data?.user || data?.data?.user || data?.data || data;
export const login = (data) => post('/auth/login', data, { _skipAuthRefresh: true });
export const register = (data) => post('/auth/register', data, { _skipAuthRefresh: true });
export const googleChallenge = () => post('/auth/oauth/google/challenge', {});
export const googleLogin = (data) => post('/auth/oauth/google', data, { _skipAuthRefresh: true });
export const me = async () => unwrapUser(await get('/auth/me'));
export const logout = () => post('/auth/logout', {});
export const updateAccount = async (body) => unwrapUser(await patch('/users/me', body));
export const changePassword = (body) => post('/auth/change-password', body);
export const forgotPassword = (email) => post('/auth/forgot-password', { email });
export const resendEmailVerification = (email) => post('/auth/email-verification/resend', { email });
export const confirmEmailVerification = (token) => post('/auth/email-verification/confirm', { token });
export const resetPassword = (body) => post('/auth/reset-password', body);
