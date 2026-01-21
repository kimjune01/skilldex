/**
 * Skillomatic Web Application
 *
 * React SPA for managing skills, API keys, and integrations.
 * Built with React Router for navigation, Tailwind for styling.
 *
 * Route structure:
 * - / - Landing page (unauthenticated) or Dashboard (authenticated)
 * - /login - Login page
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
import AcceptInvite from './pages/invite/Accept';
import Chat from './pages/Chat';

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
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Layout />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <DemoProvider>
      <Routes>
        {/* Home - shows Landing or Dashboard based on auth */}
        <Route path="/" element={<HomePage />}>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="skills" element={<Skills />} />
          <Route path="skills/:slug" element={<SkillDetail />} />
          <Route path="skills/:slug/raw" element={<SkillRaw />} />
          <Route path="keys" element={<ApiKeys />} />
          <Route path="integrations" element={<Integrations />} />
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
      </Routes>
    </DemoProvider>
  );
}
