/**
 * Layout Component
 *
 * Main application layout with sidebar navigation.
 * Renders protected content via React Router's Outlet.
 *
 * Features:
 * - Fixed left sidebar with navigation links
 * - Admin section visible only to admin users
 * - User info and logout at bottom
 */
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiKeys, complaints } from '../lib/api';
import { Home, Zap, Key, Plug, Users, Settings, LogOut, BarChart3, FileText, MessageSquare, Server, Building2, Mail, Crown, Bot, Circle, Wand2, Chrome, CreditCard, Menu, X, Smartphone, Bug, Loader2 } from 'lucide-react';
import { getOnboardingStepRoute } from '@skillomatic/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// Main navigation - visible to all authenticated users
// Order: Home first, then chat options (how to connect), then configuration (what it can do)
const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Desktop Chat', href: '/desktop-chat', icon: Key },
  { name: 'Mobile Chat', href: '/mobile-chat', icon: Smartphone },
  { name: 'Web Chat', href: '/chat', icon: MessageSquare },
  { name: 'Connections', href: '/integrations', icon: Plug },
  { name: 'Skills', href: '/skills', icon: Zap },
  { name: 'Extension', href: '/extension/install', icon: Chrome },
];

// Admin navigation - visible only to users with isAdmin=true
const adminNavigation = [
  { name: 'Skill Studio', href: '/admin/chat', icon: Wand2 },
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
  { name: 'Billing', href: '/admin/billing', icon: CreditCard },
];

export default function Layout() {
  const { user, logout, isAdmin, isSuperAdmin, isOnboarded, organizationName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [extensionApiKey, setExtensionApiKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [complainDialogOpen, setComplainDialogOpen] = useState(false);
  const [complainMessage, setComplainMessage] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [complaintsUrl, setComplaintsUrl] = useState<string | null>(null);

  // Listen for open-mobile-menu events from Chat page
  useEffect(() => {
    const handler = () => setMobileMenuOpen(true);
    window.addEventListener('open-mobile-menu', handler);
    return () => window.removeEventListener('open-mobile-menu', handler);
  }, []);

  // Listen for open-complain-dialog events from other pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setComplainMessage(detail);
      }
      setComplainDialogOpen(true);
    };
    window.addEventListener('open-complain-dialog', handler);
    return () => window.removeEventListener('open-complain-dialog', handler);
  }, []);

  // Fetch API key for browser extension auto-config
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const keys = await apiKeys.list();
        if (keys.length > 0) {
          setExtensionApiKey(keys[0].key);
        }
      } catch {
        // Silently fail - extension config is optional
      }
    };
    fetchApiKey();
  }, []);

  // Fetch complaints count for superadmins
  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchComplaintsCount = async () => {
      try {
        const data = await complaints.getCount();
        setComplaintsCount(data.count);
        setComplaintsUrl(data.url);
      } catch {
        // Silently fail
      }
    };
    fetchComplaintsCount();
  }, [isSuperAdmin]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleComplainSubmit = async () => {
    if (!complainMessage.trim()) return;

    setIsSubmittingComplaint(true);
    try {
      await complaints.create({
        message: complainMessage.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });
      toast('Bug report submitted! Thanks for the feedback.', 'success');
      setComplainMessage('');
      setComplainDialogOpen(false);
    } catch (error) {
      toast('Failed to submit bug report. Please try again.', 'error');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // API URL for the extension (web is 5173, API is 3000 in dev)
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3000');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Hidden element for browser extension auto-config */}
      {extensionApiKey && (
        <div
          id="skillomatic-extension-config"
          data-api-url={apiUrl}
          data-api-key={extensionApiKey}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
      {/* Mobile hamburger button - hidden on /chat since Chat has its own full-screen header */}
      <button
        className={cn(
          "fixed top-4 left-4 z-[60] md:hidden p-2 rounded-lg bg-background border shadow-md",
          location.pathname === '/chat' && "hidden"
        )}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar - Robot Vending Machine Panel */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 robot-panel flex flex-col",
        "transition-transform duration-300 ease-in-out",
        "-translate-x-full md:translate-x-0",
        mobileMenuOpen && "translate-x-0"
      )}>
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
              <span className="text-lg logo-text text-[hsl(220_30%_20%)]">
                Skillomatic
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[hsl(220_15%_50%)] uppercase font-body">
                Dispenser 3000
              </span>
            </div>
          </Link>
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
            // Show badge on the tab that corresponds to the next onboarding step
            // But don't show if user is already on that page
            const nextStepRoute = !isOnboarded && user ? getOnboardingStepRoute(user.onboardingStep) : null;
            const showSetupBadge = nextStepRoute === item.href && !isActive;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150 animate-mechanical",
                  isActive
                    ? "robot-button text-white shadow-md"
                    : "bg-[hsl(220_15%_88%)] text-[hsl(220_20%_35%)] border-2 border-[hsl(220_15%_78%)] hover:bg-[hsl(220_15%_85%)] hover:border-[hsl(220_15%_70%)]"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                    isActive
                      ? "bg-white/20"
                      : "bg-[hsl(220_15%_80%)] group-hover:bg-[hsl(220_15%_75%)]"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {showSetupBadge && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-white" />
                  )}
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
                    onClick={() => setMobileMenuOpen(false)}
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
                    onClick={() => setMobileMenuOpen(false)}
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
              {/* Complaints link - opens GitHub issues */}
              {complaintsUrl && (
                <a
                  href={complaintsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-150 animate-mechanical bg-[hsl(220_15%_88%)] text-[hsl(220_20%_35%)] border-2 border-[hsl(220_15%_78%)] hover:bg-amber-100 hover:border-amber-300 hover:text-amber-700"
                >
                  <div className="relative">
                    <div className="h-6 w-6 rounded flex items-center justify-center transition-all bg-[hsl(220_15%_80%)] group-hover:bg-amber-200">
                      <Bug className="h-3.5 w-3.5" />
                    </div>
                    {complaintsCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                        {complaintsCount > 9 ? '9+' : complaintsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs tracking-wide">Complaints</span>
                </a>
              )}
            </>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="border-t-2 border-[hsl(220_15%_75%)] p-3 bg-[hsl(220_15%_90%)]">
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
            onClick={() => setComplainDialogOpen(true)}
            className="w-full py-2 px-3 mb-2 rounded-lg bg-amber-100 border-2 border-amber-300 text-amber-700 text-xs font-bold tracking-wider uppercase hover:bg-amber-200 hover:border-amber-400 transition-all animate-mechanical flex items-center justify-center gap-2"
          >
            <Bug className="h-3.5 w-3.5" />
            Complain
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg bg-[hsl(220_15%_85%)] border-2 border-[hsl(220_15%_75%)] text-[hsl(220_20%_40%)] text-xs font-bold tracking-wider uppercase hover:bg-red-100 hover:border-red-300 hover:text-red-600 transition-all animate-mechanical flex items-center justify-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Eject User
          </button>
        </div>
      </aside>

      {/* Complain Dialog */}
      <Dialog open={complainDialogOpen} onOpenChange={setComplainDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-amber-600" />
              Complain More
            </DialogTitle>
            <DialogDescription>
              The app sucks, we know. If you think we'll actually read this, say something. Current page context will also be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={complainMessage}
              onChange={(e) => setComplainMessage(e.target.value)}
              placeholder="Describe the issue you're experiencing..."
              className="w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setComplainDialogOpen(false)}
              disabled={isSubmittingComplaint}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplainSubmit}
              disabled={!complainMessage.trim() || isSubmittingComplaint}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmittingComplaint ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Bug Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <div className="container py-8 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
