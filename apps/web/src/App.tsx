/**
 * Skillomatic Web Application
 *
 * React SPA for managing skills, API keys, and integrations.
 * Built with React Router for navigation, Tailwind for styling.
 *
 * Route structure:
 * - / - Landing page (unauthenticated), redirects to /chat or /overview based on onboarding
 * - /login - Login page
 * - /overview - Dashboard with setup progress (requires auth)
 * - /chat - AI chat for skill suggestions (requires auth)
 * - /skills - Browse and download skills (requires auth)
 * - /skills/:slug - Skill detail page (requires auth)
 * - /keys - Manage API keys (requires auth)
 * - /integrations - OAuth connections (requires auth)
 * - /usage - Usage history (requires auth)
 * - /admin/* - Admin-only routes (requires admin role)
 *
 * Context providers:
 * - DemoProvider: Demo mode toggle for mock data
 *
 * @see docs/RECRUITER_GUIDE.md for user documentation
 * @see docs/ADMIN_GUIDE.md for admin documentation
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { DemoProvider } from './hooks/useDemo';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import SkillDetail from './pages/SkillDetail';
import SkillRaw from './pages/SkillRaw';
import ApiKeys from './pages/ApiKeys';
import Integrations from './pages/Integrations';
import Usage from './pages/Usage';
import AdminUsers from './pages/admin/Users';
import AdminSkills from './pages/admin/Skills';
import AdminAnalytics from './pages/admin/Analytics';
import AdminProposals from './pages/admin/Proposals';
import AdminSettings from './pages/admin/Settings';
import AdminDeployment from './pages/admin/Deployment';
import AdminOrganizations from './pages/admin/Organizations';
import AdminInvites from './pages/admin/Invites';
import AdminChat from './pages/admin/Chat';
import AcceptInvite from './pages/invite/Accept';
import Chat from './pages/Chat';
import Extension from './pages/Extension';
import ExtensionInstall from './pages/ExtensionInstall';
import Privacy from './pages/Privacy';
import ForIT from './pages/ForIT';
import ForRecruiters from './pages/ForRecruiters';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function HomePage() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect based on onboarding status
    return <Navigate to={isOnboarded ? '/chat' : '/overview'} replace />;
  }

  return <Landing />;
}

function AuthenticatedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <DemoProvider>
      <Routes>
        {/* Home - Landing page or redirect based on auth/onboarding */}
        <Route path="/" element={<HomePage />} />

        {/* Authenticated routes with Layout */}
        <Route element={<AuthenticatedRoutes />}>
          <Route path="overview" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="skills" element={<Skills />} />
          <Route path="skills/:slug" element={<SkillDetail />} />
          <Route path="skills/:slug/raw" element={<SkillRaw />} />
          <Route path="keys" element={<ApiKeys />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="extension/install" element={<ExtensionInstall />} />
          <Route path="usage" element={<Usage />} />

          {/* Admin routes */}
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="admin/skills"
            element={
              <AdminRoute>
                <AdminSkills />
              </AdminRoute>
            }
          />
          <Route
            path="admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="admin/proposals"
            element={
              <AdminRoute>
                <AdminProposals />
              </AdminRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <AdminRoute>
                <AdminSettings />
              </AdminRoute>
            }
          />
          <Route
            path="admin/deployment"
            element={
              <AdminRoute>
                <AdminDeployment />
              </AdminRoute>
            }
          />
          <Route
            path="admin/invites"
            element={
              <AdminRoute>
                <AdminInvites />
              </AdminRoute>
            }
          />
          <Route
            path="admin/chat"
            element={
              <AdminRoute>
                <AdminChat />
              </AdminRoute>
            }
          />
          <Route
            path="admin/organizations"
            element={
              <SuperAdminRoute>
                <AdminOrganizations />
              </SuperAdminRoute>
            }
          />
        </Route>

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Public pages */}
        <Route path="/extension" element={<Extension />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/for-it" element={<ForIT />} />
        <Route path="/for-recruiters" element={<ForRecruiters />} />
      </Routes>
    </DemoProvider>
  );
}
