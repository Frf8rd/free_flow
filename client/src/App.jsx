import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute, { GuestRoute } from './components/layout/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { load, preloadAppPages } from './lib/routes.js';
import { useAuth } from './store/authStore.js';

const Landing = lazy(load('Landing'));
const Dashboard = lazy(load('Dashboard'));
const Recommendations = lazy(load('Recommendations'));
const MyProjects = lazy(load('MyProjects'));
const Messages = lazy(load('Messages'));
const Engagements = lazy(load('Engagements'));
const EngagementDetail = lazy(load('EngagementDetail'));
const Settings = lazy(load('Settings'));
const Onboarding = lazy(load('Onboarding'));
const ProjectForm = lazy(load('ProjectForm'));
const ProjectDetail = lazy(load('ProjectDetail'));
const Browse = lazy(load('Browse'));
const FreelancerProfile = lazy(load('FreelancerProfile'));
const ProfileEdit = lazy(load('ProfileEdit'));
const Notifications = lazy(load('Notifications'));
const Admin = lazy(load('Admin'));
const NotFound = lazy(load('NotFound'));
const Legal = lazy(load('Legal'));
const Contact = lazy(load('Contact'));
const ForgotPassword = lazy(load('ForgotPassword'));
const ResetPassword = lazy(load('ResetPassword'));
const HowItWorks = lazy(load('HowItWorks'));

export default function App() {
  const authed = useAuth((s) => s.status === 'authed');
  useEffect(() => { if (authed) preloadAppPages(); }, [authed]);
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-fm-page p-6"><p role="status" className="text-sm text-fm-slate/70">Se încarcă pagina…</p></main>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/freelancers/:id" element={<FreelancerProfile />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute allowIncomplete />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      <Route element={<ProtectedRoute roles={['CLIENT', 'FREELANCER']} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/projects/mine" element={<MyProjects />} />
        <Route path="/projects/archive" element={<MyProjects archived />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<Messages />} />
        <Route path="/engagements" element={<Engagements />} />
        <Route path="/engagements/:id" element={<EngagementDetail />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route element={<ProtectedRoute roles={['CLIENT', 'FREELANCER']} allowIncomplete />}>
        <Route path="/profile/edit" element={<ProfileEdit />} />
      </Route>
      <Route element={<ProtectedRoute allowIncomplete />}>
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<ProtectedRoute roles={['ADMIN']} allowIncomplete />}>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
