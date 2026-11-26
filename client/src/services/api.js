import axios from 'axios';
import { config } from '../config.js';
import { tokens } from '../lib/tokens.js';

const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: config.refreshCookie,
  headers: { Accept: 'application/json' },
});

const mockReady = config.useMock && import.meta.env.DEV
  ? import('../mocks/index.js').then(({ installMock }) => installMock(api))
  : Promise.resolve();

api.interceptors.request.use(async (request) => {
  await mockReady;
  const token = tokens.getAccess();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

let refreshPromise;
export async function refreshSession() {
  if (!refreshPromise) {
    const rotate = () => api.post('/auth/refresh', config.refreshCookie ? undefined : { refreshToken: tokens.getRefresh() }, { _skipAuthRefresh: true })
      .then(({ data }) => {
        const session = data?.data || data;
        if (!session?.accessToken) throw new Error('Sesiunea nu a putut fi reînnoită.');
        tokens.setAccess(session.accessToken);
        tokens.markSessionPresent();
        if (session.refreshToken) tokens.setRefresh(session.refreshToken);
        return session;
      })
      .finally(() => { refreshPromise = undefined; });
    refreshPromise = typeof navigator !== 'undefined' && navigator.locks?.request
      ? navigator.locks.request('fairmatch-refresh-token', { mode: 'exclusive' }, rotate)
      : rotate();
  }
  return refreshPromise;
}

function toApiError(error) {
  const body = error?.response?.data;
  const payload = body?.error || body;
  const e = new Error(payload?.message || (error?.code === 'ERR_NETWORK'
    ? 'Nu s-a putut contacta serverul. Verifică adresa API și conexiunea.'
    : 'Ceva nu a mers. Încearcă din nou.'));
  e.name = 'ApiError';
  e.status = error?.response?.status;
  e.code = payload?.code;
  e.details = payload?.details;
  e.retryAfter = Number(error?.response?.headers?.['retry-after']) || undefined;
  e.cause = error;
  return e;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status === 401 && request && !request._skipAuthRefresh && !request._retried && tokens.hasRefresh()) {
      request._retried = true;
      try {
        await refreshSession();
        request.headers.Authorization = `Bearer ${tokens.getAccess()}`;
        return api(request);
      } catch {
        tokens.logout();
      }
    }
    if (error.response?.status === 401 && request && !request._skipAuthRefresh && !tokens.hasRefresh()) tokens.logout();
    return Promise.reject(toApiError(error));
  },
);

export const get = (url, params, options) => api.get(url, { ...options, params }).then((r) => r.data);
export const post = (url, body, options) => api.post(url, body, options).then((r) => r.data);
export const put = (url, body, options) => api.put(url, body, options).then((r) => r.data);
export const patch = (url, body, options) => api.patch(url, body, options).then((r) => r.data);
export const del = (url, options) => api.delete(url, options).then((r) => r.data);

export default api;
