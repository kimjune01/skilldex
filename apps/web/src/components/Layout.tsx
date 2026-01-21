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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Home, Zap, Key, Plug, Users, Settings, LogOut, BarChart3, FileText, MessageSquare, Server, Building2, Mail, Crown, Bot, Circle } from 'lucide-react';

// Main navigation - visible to all authenticated users
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Skills', href: '/skills', icon: Zap },
  { name: 'Desktop App', href: '/keys', icon: Key },
  { name: 'Connections', href: '/integrations', icon: Plug },
  { name: 'Activity', href: '/usage', icon: BarChart3 },
];

// Admin navigation - visible only to users with isAdmin=true
const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Invites', href: '/admin/invites', icon: Mail },
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
      {/* Left Sidebar - Robot Vending Machine Panel */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 robot-panel flex flex-col">
        {/* Corner screws decoration */}
        <div className="absolute top-3 left-3 screw" />
        <div className="absolute top-3 right-3 screw" />
        <div className="absolute bottom-3 left-3 screw" />
        <div className="absolute bottom-3 right-3 screw" />

        {/* Logo - Robot display screen style */}
        <div className="h-20 flex items-center justify-center px-4 border-b-2 border-[hsl(220_15%_75%)]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl robot-button flex items-center justify-center transition-transform group-hover:scale-105">
                <Bot className="h-5 w-5 text-white" />
              </div>
              {/* Status LED */}
              <div className="absolute -top-1 -right-1 led-light led-green" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[hsl(220_30%_20%)]">
                SKILLOMATIC
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[hsl(220_15%_50%)] uppercase">
                Dispenser 3000
              </span>
            </div>
          </Link>
        </div>

        {/* Demo Mode Toggle - Control Panel Style */}
        <div className="px-3 py-3 border-b-2 border-[hsl(220_15%_75%)] bg-[hsl(220_15%_92%)]">
          <div className="robot-display rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("led-light", isDemoMode ? "led-orange" : "led-cyan")} />
                <span className={cn(
                  "text-xs font-bold tracking-wider uppercase",
                  isDemoMode ? "text-amber-400" : "text-cyan-400"
                )}>
                  {isDemoMode ? "Demo Mode" : "Live Mode"}
                </span>
              </div>
              <Switch
                checked={isDemoMode}
                onCheckedChange={toggleDemoMode}
                aria-label="Toggle demo mode"
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            {isDemoMode && (
              <p className="text-[10px] text-amber-400/80 mt-1 font-mono">
                &gt; SIMULATED DATA ACTIVE
              </p>
            )}
          </div>
        </div>

        {/* Navigation - Button Panel */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {/* Section label */}
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="h-px flex-1 bg-[hsl(220_15%_80%)]" />
            <span className="text-[10px] font-bold tracking-widest text-[hsl(220_15%_55%)] uppercase">
              Select
            </span>
            <div className="h-px flex-1 bg-[hsl(220_15%_80%)]" />
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 animate-mechanical",
                  isActive
                    ? "robot-button text-white shadow-md"
                    : "bg-[hsl(220_15%_88%)] text-[hsl(220_20%_35%)] border-2 border-[hsl(220_15%_78%)] hover:bg-[hsl(220_15%_85%)] hover:border-[hsl(220_15%_70%)]"
                )}
              >
                <div className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                  isActive
                    ? "bg-white/20"
                    : "bg-[hsl(220_15%_80%)] group-hover:bg-[hsl(220_15%_75%)]"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="tracking-wide">{item.name}</span>
                {isActive && (
                  <Circle className="ml-auto h-2 w-2 fill-current" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-5 pb-2">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-px flex-1 bg-amber-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="led-light led-orange" style={{ width: 6, height: 6 }} />
                    <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                      Admin
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-amber-300" />
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
                      "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 animate-mechanical",
                      isActive
                        ? "robot-button text-white shadow-md"
                        : "bg-[hsl(220_15%_88%)] text-[hsl(220_20%_35%)] border-2 border-[hsl(220_15%_78%)] hover:bg-[hsl(220_15%_85%)] hover:border-[hsl(220_15%_70%)]"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded flex items-center justify-center transition-all",
                      isActive
                        ? "bg-white/20"
                        : "bg-[hsl(220_15%_80%)] group-hover:bg-[hsl(220_15%_75%)]"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs tracking-wide">{item.name}</span>
                    {isActive && (
                      <Circle className="ml-auto h-2 w-2 fill-current" />
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {isSuperAdmin && (
            <>
              <div className="pt-5 pb-2">
                <div className="flex items-center gap-2 px-2">
                  <div className="h-px flex-1 bg-purple-300" />
                  <div className="flex items-center gap-1.5">
                    <div className="led-light led-cyan" style={{ width: 6, height: 6 }} />
                    <span className="text-[10px] font-bold tracking-widest text-purple-600 uppercase">
                      Super
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-purple-300" />
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
                      "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 animate-mechanical",
                      isActive
                        ? "robot-button text-white shadow-md"
                        : "bg-[hsl(220_15%_88%)] text-[hsl(220_20%_35%)] border-2 border-[hsl(220_15%_78%)] hover:bg-[hsl(220_15%_85%)] hover:border-[hsl(220_15%_70%)]"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded flex items-center justify-center transition-all",
                      isActive
                        ? "bg-white/20"
                        : "bg-[hsl(220_15%_80%)] group-hover:bg-[hsl(220_15%_75%)]"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs tracking-wide">{item.name}</span>
                    {isActive && (
                      <Circle className="ml-auto h-2 w-2 fill-current" />
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section at bottom - Dispenser slot style */}
        <div className="border-t-2 border-[hsl(220_15%_75%)] p-3 bg-[hsl(220_15%_90%)]">
          {/* Coin slot decoration */}
          <div className="flex justify-center mb-3">
            <div className="coin-slot" />
          </div>

          {organizationName && (
            <div className="robot-display rounded-md p-2 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 truncate uppercase tracking-wider">
                  {organizationName}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-[hsl(220_15%_95%)] border-2 border-[hsl(220_15%_85%)]">
            <div className="relative">
              <div className="h-9 w-9 rounded-lg robot-button flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 led-light led-green" style={{ width: 6, height: 6 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[hsl(220_30%_20%)] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-[hsl(220_15%_50%)] truncate font-mono">{user?.email}</p>
            </div>
            {isSuperAdmin ? (
              <Badge className="text-[10px] bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 font-bold">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                SUPER
              </Badge>
            ) : isAdmin ? (
              <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-bold">
                ADMIN
              </Badge>
            ) : null}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg bg-[hsl(220_15%_85%)] border-2 border-[hsl(220_15%_75%)] text-[hsl(220_20%_40%)] text-xs font-bold tracking-wider uppercase hover:bg-red-100 hover:border-red-300 hover:text-red-600 transition-all animate-mechanical flex items-center justify-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Eject User
          </button>
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
