// Încărcătoarele paginilor, într-un singur loc: folosite și de React.lazy, și pentru preîncărcare.
// Astfel chunk-ul paginii e deja în cache când utilizatorul apasă pe link → fără ecran de încărcare între pagini.
const loaders = {
  Landing: () => import('../pages/Landing.jsx'),
  Dashboard: () => import('../pages/Dashboard.jsx'),
  Recommendations: () => import('../pages/Recommendations.jsx'),
  MyProjects: () => import('../pages/MyProjects.jsx'),
  Messages: () => import('../pages/Messages.jsx'),
  Engagements: () => import('../pages/Engagements.jsx'),
  EngagementDetail: () => import('../pages/EngagementDetail.jsx'),
  Settings: () => import('../pages/Settings.jsx'),
  Onboarding: () => import('../pages/Onboarding.jsx'),
  ProjectForm: () => import('../pages/ProjectForm.jsx'),
  ProjectDetail: () => import('../pages/ProjectDetail.jsx'),
  Browse: () => import('../pages/Browse.jsx'),
  FreelancerProfile: () => import('../pages/FreelancerProfile.jsx'),
  ProfileEdit: () => import('../pages/ProfileEdit.jsx'),
  Notifications: () => import('../pages/Notifications.jsx'),
  Admin: () => import('../pages/Admin.jsx'),
  NotFound: () => import('../pages/NotFound.jsx'),
  Legal: () => import('../pages/Legal.jsx'),
  Contact: () => import('../pages/Contact.jsx'),
  ForgotPassword: () => import('../pages/ForgotPassword.jsx'),
  ResetPassword: () => import('../pages/ResetPassword.jsx'),
  EmailVerification: () => import('../pages/EmailVerification.jsx'),
  HowItWorks: () => import('../pages/HowItWorks.jsx'),
};

export const load = (name) => loaders[name];

// cale → pagină (pentru preîncărcare la hover/focus pe linkuri)
const byPath = [
  [/^\/dashboard/, 'Dashboard'], [/^\/recommendations/, 'Recommendations'], [/^\/projects\/(mine|archive)/, 'MyProjects'],
  [/^\/projects\/new|^\/projects\/[^/]+\/edit/, 'ProjectForm'], [/^\/projects\//, 'ProjectDetail'],
  [/^\/messages/, 'Messages'], [/^\/engagements\/./, 'EngagementDetail'], [/^\/engagements/, 'Engagements'],
  [/^\/settings/, 'Settings'], [/^\/profile\/edit/, 'ProfileEdit'], [/^\/notifications/, 'Notifications'],
  [/^\/browse/, 'Browse'], [/^\/freelancers\//, 'FreelancerProfile'], [/^\/admin/, 'Admin'], [/^\/onboarding/, 'Onboarding'],
];
const started = new Set();
function run(name) {
  if (started.has(name) || !loaders[name]) return;
  started.add(name);
  loaders[name]().catch(() => started.delete(name)); // reîncercare la următorul hover dacă rețeaua a eșuat
}
export function preloadPath(path) {
  const hit = byPath.find(([re]) => re.test(path));
  if (hit) run(hit[1]);
}
// După autentificare, încarcă în fundal paginile aplicației (sunt mici) când browserul e liber.
export function preloadAppPages() {
  const names = byPath.map(([, n]) => n);
  const go = () => [...new Set(names)].forEach(run);
  if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
}
