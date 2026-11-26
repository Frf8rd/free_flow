import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute, { GuestRoute } from './components/layout/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Recommendations = lazy(() => import('./pages/Recommendations.jsx'));
const MyProjects = lazy(() => import('./pages/MyProjects.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Engagements = lazy(() => import('./pages/Engagements.jsx'));
const EngagementDetail = lazy(() => import('./pages/EngagementDetail.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const ProjectForm = lazy(() => import('./pages/ProjectForm.jsx'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.jsx'));
const Browse = lazy(() => import('./pages/Browse.jsx'));
const FreelancerProfile = lazy(() => import('./pages/FreelancerProfile.jsx'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const HowItWorks = lazy(() => import('./pages/HowItWorks.jsx'));

export default function App() {
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
      <Route element={<ProtectedRoute />}>
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
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
      <Route element={<ProtectedRoute roles={['ADMIN']} allowIncomplete />}>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
