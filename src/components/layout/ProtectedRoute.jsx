import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore.js';
import { PageLoader } from '../ui/Kit.jsx';

// Rute private: README 4.2 — neautentificat → /login; profil incomplet → /onboarding; rol greșit → /dashboard
export const skipOnboarding = { get: () => { try { return sessionStorage.getItem('fm-skip-onboarding') === '1'; } catch { return false; } }, set: () => { try { sessionStorage.setItem('fm-skip-onboarding', '1'); } catch { /* ignorat */ } } };

export default function ProtectedRoute({ roles, allowIncomplete = false }) {
  const { user, status } = useAuth();
  const loc = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  if (user.isBlocked) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  if (!allowIncomplete && user.role !== 'ADMIN' && user.onboarded === false && !skipOnboarding.get()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

// Pagini doar pentru vizitatori (login/register): utilizatorul logat e trimis acasă
export function GuestRoute() {
  const { user, status } = useAuth();
  if (status === 'loading') return <PageLoader />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : user.onboarded === false ? '/onboarding' : '/dashboard'} replace />;
  return <Outlet />;
}
