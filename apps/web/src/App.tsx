/**
 * Skilldex Web Application
 *
 * React SPA for managing skills, API keys, and integrations.
 * Built with React Router for navigation, Tailwind for styling.
 *
 * Route structure:
 * - /login - Public login page
 * - / - Protected routes (requires auth)
 *   - /chat - AI chat for skill suggestions
 *   - /skills - Browse and download skills
 *   - /skills/:slug - Skill detail page
 *   - /keys - Manage API keys
 *   - /integrations - OAuth connections
 *   - /usage - Usage history
 *   - /admin/* - Admin-only routes (Users, Skills, Analytics, Proposals, Settings, Deployment)
 *
 * Context providers:
 * - BrandingProvider: White-label customization (logo, app name)
 * - DemoProvider: Demo mode toggle for mock data
 *
 * @see docs/RECRUITER_GUIDE.md for user documentation
 * @see docs/ADMIN_GUIDE.md for admin documentation
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { BrandingProvider } from './hooks/useBranding';
import { DemoProvider } from './hooks/useDemo';
import Layout from './components/Layout';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}

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

export default function App() {
  return (
    <BrandingProvider>
      <DemoProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
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
      </Routes>
      </DemoProvider>
    </BrandingProvider>
  );
}
