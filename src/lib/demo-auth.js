// DEMO ONLY: disable this adapter when the backend's auth routes are ready.
// Keep the preview login available until the API is ready; disable it with VITE_DEMO_AUTH=false.
export const DEMO_AUTH_ENABLED = import.meta.env.VITE_DEMO_AUTH !== 'false';
const STORAGE_KEY = 'fairmatch-demo-user';
export const DEMO_PASSWORD = 'fairmatch-demo';

export const DEMO_ACCOUNTS = [
  { id: 'demo-client', name: 'Client Demo', email: 'client@fairmatch.local', role: 'CLIENT', onboardingCompleted: true },
  { id: 'demo-freelancer', name: 'Freelancer Demo', email: 'freelancer@fairmatch.local', role: 'FREELANCER', onboardingCompleted: true },
  { id: 'demo-admin', name: 'Admin Demo', email: 'admin@fairmatch.local', role: 'ADMIN', onboardingCompleted: true },
];

const save = (user) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); } catch { /* local storage may be disabled */ }
  return user;
};

export function demoLogin({ email, password }) {
  const user = DEMO_ACCOUNTS.find((account) => account.email === email.trim().toLowerCase()) || getRegisteredAccounts().find((account) => account.email === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) throw new Error('Date demo incorecte. Verifică lista conturilor demo de pe acest ecran.');
  return { user: save(user), accessToken: 'local-demo-token', refreshToken: 'local-demo-refresh', demo: true };
}

export function demoRegister({ name, email, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const all = [...DEMO_ACCOUNTS, ...getRegisteredAccounts()];
  if (all.some((account) => account.email === normalizedEmail)) throw new Error('Emailul demo există deja. Conectează-te cu parola fairmatch-demo.');
  const user = { id: `demo-${Date.now()}`, name: name.trim(), email: normalizedEmail, role, onboardingCompleted: true };
  try { localStorage.setItem('fairmatch-demo-accounts', JSON.stringify([...getRegisteredAccounts(), user])); } catch { /* local storage may be disabled */ }
  save(user);
  return { user, accessToken: 'local-demo-token', refreshToken: 'local-demo-refresh', demo: true };
}

function getRegisteredAccounts() {
  try { return JSON.parse(localStorage.getItem('fairmatch-demo-accounts') || '[]'); } catch { return []; }
}

export function demoCurrentUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* local storage may be disabled */ }
  return null;
}

export function demoChangeRole(role) {
  const user = demoCurrentUser();
  if (!user || user.role === 'ADMIN') return user;
  return save({ ...user, role });
}

export function demoLogout() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* local storage may be disabled */ }
}
