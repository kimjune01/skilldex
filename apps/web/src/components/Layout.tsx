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
 */
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Home, Zap, Key, Plug, Users, Settings, LogOut, BarChart3, FileText, FlaskConical, MessageSquare, Server, Building2, Mail, Crown, Sparkles } from 'lucide-react';

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
  { name: 'Invites', href: '/admin/invites', icon: Mail },
  { name: 'Manage Skills', href: '/admin/skills', icon: Zap },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Proposals', href: '/admin/proposals', icon: FileText },
  { name: 'Deployment', href: '/admin/deployment', icon: Server },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Super admin navigation - visible only to super admins
const superAdminNavigation = [
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
];

export default function Layout() {
  const { user, logout, isAdmin, isSuperAdmin, organizationName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
        <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Skillomatic
            </span>
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
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  isActive
                    ? "bg-primary text-white"
                    : "bg-muted/50 group-hover:bg-accent-foreground/10"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2">
                <div className="flex items-center gap-2 px-3">
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-orange-200 to-transparent" />
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                    Admin
                  </p>
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-l from-orange-200 to-transparent" />
                </div>
              </div>
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-orange-100 text-orange-700 shadow-sm"
                        : "text-muted-foreground hover:bg-orange-50 hover:text-orange-600 hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                      isActive
                        ? "bg-orange-500 text-white"
                        : "bg-muted/50 group-hover:bg-orange-100"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {isSuperAdmin && (
            <>
              <div className="pt-6 pb-2">
                <div className="flex items-center gap-2 px-3">
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-purple-200 to-transparent" />
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                    Super Admin
                  </p>
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-l from-purple-200 to-transparent" />
                </div>
              </div>
              {superAdminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-purple-100 text-purple-700 shadow-sm"
                        : "text-muted-foreground hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                      isActive
                        ? "bg-purple-500 text-white"
                        : "bg-muted/50 group-hover:bg-purple-100"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="border-t p-4 bg-gradient-to-t from-muted/30 to-transparent">
          {organizationName && (
            <div className="flex items-center gap-2 mb-3 px-2 py-2 bg-muted/50 rounded-lg border border-border/50">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground truncate">{organizationName}</span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            {isSuperAdmin ? (
              <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Super
              </Badge>
            ) : isAdmin ? (
              <Badge className="text-xs bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0">Admin</Badge>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
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
