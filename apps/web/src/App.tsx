/**
 * Skillomatic Web Application
 *
 * React SPA for managing skills, API keys, and integrations.
 * Built with React Router for navigation, Tailwind for styling.
 *
 * Route structure:
 * - / - Landing page (unauthenticated), redirects to /chat or /home based on onboarding
 * - /login - Login page
 * - /home - Dashboard with setup progress (requires auth)
 * - /chat - AI chat for skill suggestions (requires auth)
 * - /skills - Browse and download skills (requires auth)
 * - /skills/:slug - Skill detail page (requires auth)
 * - /desktop-chat - Desktop chat app setup (requires auth)
 * - /integrations - OAuth connections (requires auth)
 * - /usage - Usage history (requires auth)
 * - /admin/* - Admin-only routes (requires admin role)
 *
 * Context providers:
 * - ToastProvider: Toast notifications for errors and success messages
 *
 * @see docs/RECRUITER_GUIDE.md for user documentation
 * @see docs/ADMIN_GUIDE.md for admin documentation
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ToastProvider, useToast } from './components/ui/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import AdminBilling from './pages/admin/Billing';
import AcceptInvite from './pages/invite/Accept';
import Chat from './pages/Chat';
import Extension from './pages/Extension';
import ExtensionInstall from './pages/ExtensionInstall';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForIT from './pages/ForIT';
import ForRecruiters from './pages/ForRecruiters';
import Pricing from './pages/Pricing';
import HowItWorks from './pages/HowItWorks';
import LinkedInAutomation from './pages/LinkedInAutomation';
import IntegrationsLanding from './pages/Integrations-landing';
import Security from './pages/Security';
import FAQ from './pages/FAQ';
import Architecture from './pages/Architecture';
import Deployment from './pages/Deployment';
import ITFaq from './pages/ITFaq';
import Sharks from './pages/Sharks';
import Jerbs from './pages/Jerbs';
import NotFound from './pages/NotFound';
import AccountType from './pages/onboarding/AccountType';

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

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Component to display auth errors as toast notifications
function AuthErrorDisplay() {
  const { authError, clearAuthError } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (authError) {
      toast(authError, 'error', 8000);
      clearAuthError();
    }
  }, [authError, clearAuthError, toast]);

  return null;
}

function HomePage() {
  const { isAuthenticated, isOnboarded, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Check if user needs to select account type first
    if (user && !user.accountTypeSelected) {
      return <Navigate to="/onboarding/account-type" replace />;
    }
    // Redirect based on onboarding status
    return <Navigate to={isOnboarded ? '/chat' : '/home'} replace />;
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

function AccountTypeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // If account type already selected, redirect to home
  if (user?.accountTypeSelected) {
    return <Navigate to="/home" replace />;
  }

  return <AccountType />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ScrollToTop />
        <AuthErrorDisplay />
        <Routes>
          {/* Home - Landing page or redirect based on auth/onboarding */}
          <Route path="/" element={<HomePage />} />

        {/* Authenticated routes with Layout */}
        <Route element={<AuthenticatedRoutes />}>
          <Route path="home" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="skills" element={<Skills />} />
          <Route path="skills/:slug" element={<SkillDetail />} />
          <Route path="skills/:slug/raw" element={<SkillRaw />} />
          <Route path="desktop-chat" element={<ApiKeys />} />
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
          <Route
            path="admin/billing"
            element={
              <SuperAdminRoute>
                <AdminBilling />
              </SuperAdminRoute>
            }
          />
        </Route>

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />

        {/* Onboarding - Account Type Selection */}
        <Route path="/onboarding/account-type" element={<AccountTypeRoute />} />

        {/* Public pages */}
        <Route path="/extension" element={<Extension />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/for-it" element={<ForIT />} />
        <Route path="/for-recruiters" element={<ForRecruiters />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/linkedin-automation" element={<LinkedInAutomation />} />
        <Route path="/supported-integrations" element={<IntegrationsLanding />} />
        <Route path="/security" element={<Security />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/deployment" element={<Deployment />} />
        <Route path="/it-faq" element={<ITFaq />} />
        <Route path="/sharks" element={<Sharks />} />
        <Route path="/jerbs" element={<Jerbs />} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}
