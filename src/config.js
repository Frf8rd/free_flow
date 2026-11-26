const env = import.meta.env;
const apiUrl = env.VITE_API_URL || 'http://localhost:4000/api';

export const config = {
  apiUrl,
  googleAuthUrl: env.VITE_GOOGLE_AUTH_URL || `${apiUrl.replace(/\/$/, '')}/auth/google`,
  useMock: env.VITE_USE_MOCK === 'true',
  currency: env.VITE_CURRENCY || 'EUR',
  locale: env.VITE_LOCALE || 'ro-RO',
  refreshCookie: env.VITE_REFRESH_COOKIE === 'true',
  maxUploadMb: Number(env.VITE_MAX_UPLOAD_MB || 5),
  contactEmail: env.VITE_CONTACT_EMAIL || 'contact@fairmatch.example',
  // intervale de polling (README 4.3 / 7.2)
  pollMatchingMs: 3000,
  pollChatMs: 5000,
  pollCountsMs: 30000,
  // reguli comune cu backendul
  minDescription: 30,
  maxDescription: 4000,
  impressionVisibility: 0.5,
};
