import { AxiosError } from 'axios';
import { handle, HttpError } from './server.js';

// Montează serverul simulat pe instanța axios. Activ doar cu VITE_USE_MOCK=true (npm run dev:mock).
export function installMock(api) {
  api.defaults.adapter = (config) => new Promise((resolve, reject) => {
    const delay = 120 + Math.random() * 220;
    setTimeout(async () => {
      try {
        const { status, data } = await handle(config);
        resolve({ data, status, statusText: 'OK', headers: {}, config, request: {} });
      } catch (e) {
        const status = e instanceof HttpError ? e.status : 500;
        const payload = { error: { code: e.code || 'ERROR', message: e instanceof HttpError ? e.message : 'Eroare în serverul simulat.', details: e.details || undefined } };
        if (!(e instanceof HttpError)) console.error('[mock]', e);
        reject(new AxiosError(payload.error.message, String(status), config, {}, { data: { ...payload }, status, statusText: 'ERR', headers: {}, config }));
      }
    }, delay);
  });
}
