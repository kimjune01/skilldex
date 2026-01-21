/**
 * Layout Component
 *
 * Main application layout with sidebar navigation.
 * Renders protected content via React Router's Outlet.
 *
 * Features:
 * - Fixed left sidebar with navigation links
 * - Demo mode toggle for using mock data
 * - Admin section visible only to admin users
 * - User info and logout at bottom
 * - Customizable branding (logo, app name) via BrandingProvider
 */
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { useDemo } from '../hooks/useDemo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Home, Zap, Key, Plug, Users, Settings, LogOut, BarChart3, FileText, FlaskConical, MessageSquare, Server } from 'lucide-react';

// Main navigation - visible to all authenticated users
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Skills', href: '/skills', icon: Zap },
  { name: 'API Keys', href: '/keys', icon: Key },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Usage', href: '/usage', icon: BarChart3 },
];

// Admin navigation - visible only to users with isAdmin=true
const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Manage Skills', href: '/admin/skills', icon: Zap },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Proposals', href: '/admin/proposals', icon: FileText },
  { name: 'Deployment', href: '/admin/deployment', icon: Server },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const branding = useBranding();
  const { isDemoMode, toggleDemoMode } = useDemo();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={branding.logoUrl}
              alt={branding.appName}
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-primary">{branding.appName}</span>
          </Link>
        </div>

        {/* Demo Mode Toggle */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className={cn("h-4 w-4", isDemoMode ? "text-amber-500" : "text-muted-foreground")} />
              <span className={cn("text-sm font-medium", isDemoMode ? "text-amber-700" : "text-muted-foreground")}>
                Demo Mode
              </span>
            </div>
            <Switch
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
              aria-label="Toggle demo mode"
            />
          </div>
          {isDemoMode && (
            <p className="text-xs text-amber-600 mt-1">
              Using mock data for demonstration
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}

          {user?.isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      location.pathname === item.href
                        ? "bg-orange-100 text-orange-700"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            {user?.isAdmin && (
              <Badge variant="warning" className="text-xs">Admin</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="container py-8 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
