import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Nango from '@nangohq/frontend';
import { integrations, type IntegrationAccessLevel } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import type { IntegrationPublic, IntegrationProvider } from '@skillomatic/shared';
import { getProviders, getProvider, type IntegrationCategory, isProviderAllowedForIndividual, type PayIntentionTrigger } from '@skillomatic/shared';
import { PayIntentionDialog } from '@/components/PayIntentionDialog';
import { GoogleSheetsInfoDialog } from '@/components/GoogleSheetsInfoDialog';
import { OnboardingBadge } from '@/components/ui/onboarding-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Briefcase,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plug,
  Unplug,
  RefreshCw,
  ExternalLink,
  Clock,
  Shield,
  ShieldCheck,
  Table2,
  Lock,
  Sparkles,
  Lightbulb,
  HardDrive,
  FileText,
  ClipboardList,
  Users,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

/**
 * Icon mapping for integration providers.
 */
const providerIcons: Partial<Record<IntegrationProvider | string, LucideIcon>> = {
  ats: Briefcase,
  email: Mail,
  calendar: Calendar,
  scheduling: Calendar,
  'google-sheets': Table2,
  'google-drive': HardDrive,
  'google-docs': FileText,
  'google-forms': ClipboardList,
  'google-contacts': Users,
  'google-tasks': ListTodo,
};

/**
 * Google Workspace tools configuration
 */
const GOOGLE_WORKSPACE_TOOLS = [
  { id: 'google-drive', name: 'Drive', description: 'Search and share files' },
  { id: 'google-docs', name: 'Docs', description: 'Draft and edit documents' },
  { id: 'google-forms', name: 'Forms', description: 'Collect responses' },
  { id: 'google-contacts', name: 'Contacts', description: 'Look up contact info' },
  { id: 'google-tasks', name: 'Tasks', description: 'Create and track tasks' },
] as const;

/**
 * Get sub-providers for a category from the registry.
 * Includes devOnly providers when in development mode.
 */
function getSubProvidersForCategory(category: IntegrationCategory): { id: string; name: string }[] {
  const includeDevOnly = import.meta.env.DEV;
  return getProviders({ category, includeDevOnly }).map((p) => ({
    id: p.id,
    name: p.displayName,
  }));
}


type ProviderConfig = {
  id: IntegrationProvider;
  name: string;
  description: string;
  subProviders?: { id: string; name: string }[];
};

/**
 * UI configuration for integration providers.
 * Uses registry for sub-providers where applicable.
 */
function buildProviderConfigs(): {
  essentialProviders: ProviderConfig[];
  otherProviders: ProviderConfig[];
} {
  // Essential integrations - Gmail, Calendar, and Sheets
  const essentialProviders: ProviderConfig[] = [
    {
      id: 'email',
      name: 'Email',
      description: 'Read, draft, and send messages',
      subProviders: getSubProvidersForCategory('email'),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Schedule meetings and check availability',
      subProviders: getSubProvidersForCategory('calendar'),
    },
    {
      id: 'google-sheets',
      name: 'Sheets',
      description: 'Store and analyze your data',
    },
  ];

  // Other integrations - specialized tools
  const otherProviders: ProviderConfig[] = [
    {
      id: 'scheduling',
      name: 'Scheduling',
      description: 'Let clients book time with you',
      subProviders: [
        { id: 'calendly', name: 'Calendly' },
        { id: 'cal-com', name: 'Cal.com' },
      ],
    },
    {
      id: 'ats',
      name: 'ATS',
      description: 'Connect your Applicant Tracking System',
      subProviders: getSubProvidersForCategory('ats'),
    },
  ];

  return { essentialProviders, otherProviders };
}

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { isIndividual } = useAuth();
  const { toast } = useToast();

  // Build provider configs from registry (memoized to avoid rebuilding on every render)
  const { essentialProviders, otherProviders } = useMemo(() => buildProviderConfigs(), []);
  const availableProviders = useMemo(
    () => [...essentialProviders, ...otherProviders],
    [essentialProviders, otherProviders]
  );

  // Dialog states
  const [connectDialogProvider, setConnectDialogProvider] = useState<{
    id: IntegrationProvider;
    name: string;
    subProviders?: { id: string; name: string }[];
  } | null>(null);
  const [selectedSubProvider, setSelectedSubProvider] = useState<string>('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<IntegrationAccessLevel>('read-write');
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [updatingAccessLevel, setUpdatingAccessLevel] = useState<string | null>(null);

  // Pay intention dialog state
  const [payIntentionDialog, setPayIntentionDialog] = useState<{
    open: boolean;
    triggerType: PayIntentionTrigger;
    triggerProvider?: string;
    providerName?: string;
  }>({ open: false, triggerType: 'premium_integration' });

  // Google Sheets info dialog state
  const [sheetsInfoOpen, setSheetsInfoOpen] = useState(false);

  // Google reconnect dialog state (when user tries to enable a tool we don't have access to)
  const [reconnectDialog, setReconnectDialog] = useState<{ open: boolean; toolName: string } | null>(null);

  // Track enabling state for Google Workspace tools
  const [enablingTool, setEnablingTool] = useState<string | null>(null);

  // Nango Connect UI ref
  const nangoConnectRef = useRef<ReturnType<Nango['openConnectUI']> | null>(null);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const data = await integrations.list();
      setIntegrationList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  // Handle OAuth callback and pay intention query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const payIntentionParam = searchParams.get('pay_intention');

    if (errorParam) {
      setError(errorParam);
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }

    if (successParam) {
      setSuccessMessage(successParam);
      loadIntegrations(); // Refresh list after successful connection
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    // Handle pay intention callback from Stripe
    if (payIntentionParam === 'success') {
      setSuccessMessage('Payment method added! You can now connect premium integrations.');
      searchParams.delete('pay_intention');
      searchParams.delete('id');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(''), 5000);
    } else if (payIntentionParam === 'cancelled') {
      searchParams.delete('pay_intention');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /**
   * Check if a provider is allowed for the current user.
   * Individual users have restricted access to certain providers.
   * For providers with sub-providers, blocked only if ALL sub-providers are blocked.
   */
  const isProviderBlocked = (provider: { id: string; subProviders?: { id: string }[] }): boolean => {
    if (!isIndividual) return false;
    if (provider.subProviders) {
      return provider.subProviders.every(sub => !isProviderAllowedForIndividual(sub.id));
    }
    return !isProviderAllowedForIndividual(provider.id);
  };

  const handleConnect = (provider: (typeof availableProviders)[0]) => {
    // Check if individual user is trying to connect a blocked provider
    if (isIndividual) {
      // For providers with sub-providers, check if ALL sub-providers are blocked
      if (provider.subProviders) {
        const allBlocked = provider.subProviders.every(sub => !isProviderAllowedForIndividual(sub.id));
        if (allBlocked) {
          setError('This integration requires an organization account. Create or join an organization to access ATS integrations.');
          return;
        }
      } else if (!isProviderAllowedForIndividual(provider.id)) {
        setError('This integration requires an organization account. Create or join an organization to access this integration.');
        return;
      }
    }

    if (provider.subProviders && provider.subProviders.length > 0) {
      // Show dialog to select sub-provider
      setConnectDialogProvider(provider);
      // For individual users, pre-select the first allowed sub-provider
      const allowedSubProviders = isIndividual
        ? provider.subProviders.filter(sub => isProviderAllowedForIndividual(sub.id))
        : provider.subProviders;
      setSelectedSubProvider(allowedSubProviders[0]?.id || provider.subProviders[0].id);
      setSelectedAccessLevel('read-write'); // Reset to default
    } else {
      // Direct connect for providers without sub-providers - show dialog for access level
      setConnectDialogProvider(provider);
      setSelectedAccessLevel('read-write');
    }
  };

  const initiateOAuth = async (provider: string, subProvider?: string, accessLevel?: IntegrationAccessLevel) => {
    setIsConnecting(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');

      // Get provider config from registry to determine OAuth flow
      // Check subProvider first, then fall back to provider ID (for standalone providers like google-sheets)
      const providerConfig = getProvider(subProvider || provider);
      const oauthFlow = providerConfig?.oauthFlow || 'nango';

      // Handle different OAuth flows based on registry config
      if (oauthFlow === 'none') {
        // Direct connect without OAuth (e.g., mock-ats in dev)
        const response = await fetch(`${apiUrl}/integrations/${subProvider}/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to connect ${providerConfig?.displayName || subProvider}`);
        }
        setSuccessMessage(`${providerConfig?.displayName || subProvider} connected successfully`);
        await loadIntegrations();
        setIsConnecting(false);
        setTimeout(() => setSuccessMessage(''), 5000);
        return;
      }

      if (oauthFlow === 'google-direct') {
        // Use direct Google OAuth instead of Nango
        const providerId = subProvider || provider;
        window.location.href = `${apiUrl}/integrations/${providerId}/connect?token=${encodeURIComponent(token || '')}`;
        return;
      }

      // Default: Use Nango Connect UI
      const allowedIntegrations = subProvider ? [subProvider] : undefined;

      const nango = new Nango();
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === 'close') {
            setIsConnecting(false);
            nangoConnectRef.current = null;
          } else if (event.type === 'connect') {
            setSuccessMessage('Integration connected successfully');
            loadIntegrations();
            setIsConnecting(false);
            nangoConnectRef.current = null;
            setTimeout(() => setSuccessMessage(''), 5000);
          }
        },
      });

      nangoConnectRef.current = connect;

      const session = await integrations.getSession(allowedIntegrations, accessLevel, provider);
      connect.setSessionToken(session.token);
    } catch (err) {
      // Check if this is a pay intention required error
      if (err instanceof Error && err.message.includes('payment method')) {
        // Show pay intention dialog
        const providerConfig = getProvider(subProvider || provider);
        setPayIntentionDialog({
          open: true,
          triggerType: isIndividual ? 'individual_ats' : 'premium_integration',
          triggerProvider: subProvider || provider,
          providerName: providerConfig?.displayName,
        });
        setIsConnecting(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  const handleConfirmConnect = () => {
    if (connectDialogProvider) {
      const subProvider = connectDialogProvider.subProviders ? selectedSubProvider : undefined;
      initiateOAuth(connectDialogProvider.id, subProvider, selectedAccessLevel);
      setConnectDialogProvider(null);
    }
  };

  const handleUpdateAccessLevel = async (integrationId: string, newLevel: IntegrationAccessLevel) => {
    setUpdatingAccessLevel(integrationId);
    try {
      await integrations.updateAccessLevel(integrationId, newLevel);
      await loadIntegrations();
      toast(`Access level updated to ${newLevel === 'read-write' ? 'Full access' : 'Read only'}`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access level');
    } finally {
      setUpdatingAccessLevel(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    try {
      if (disconnectTarget.id === 'google-all') {
        // Disconnect all Google integrations (essentials + workspace tools)
        const googleProviders = ['email', 'calendar', 'google-sheets', 'google-drive', 'google-docs', 'google-forms', 'google-contacts', 'google-tasks'];
        const googleIntegrations = integrationList.filter(
          i => googleProviders.includes(i.provider) && i.status === 'connected'
        );
        for (const int of googleIntegrations) {
          await integrations.disconnect(int.id);
        }
      } else {
        await integrations.disconnect(disconnectTarget.id);
      }
      await loadIntegrations();
      setSuccessMessage(`${disconnectTarget.name} disconnected successfully`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }

    setDisconnectTarget(null);
  };

  // Quick disconnect without confirmation dialog (for toggles)
  const handleQuickDisconnect = async (integrationId: string, name: string) => {
    try {
      await integrations.disconnect(integrationId);
      await loadIntegrations();
      toast(`${name} disabled`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to disconnect', 'error');
    }
  };

  // Enable a non-essential Google Workspace tool
  const handleEnableGoogleTool = async (toolId: string, toolName: string) => {
    setEnablingTool(toolId);
    try {
      await integrations.enableGoogleTool(toolId);
      await loadIntegrations();
      toast(`${toolName} enabled`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable tool';
      // If scope wasn't granted (permission denied), show reconnect dialog
      if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('not granted')) {
        setReconnectDialog({ open: true, toolName });
      } else {
        toast(errorMessage, 'error');
      }
    } finally {
      setEnablingTool(null);
    }
  };

  const getIntegrationStatus = (provider: IntegrationProvider) => {
    // Prioritize connected integrations over disconnected ones
    const matches = integrationList.filter((i) => i.provider === provider);
    return matches.find((i) => i.status === 'connected') || matches[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" /> Not connected
          </Badge>
        );
    }
  };

  const getAccessLevelBadge = (accessLevel?: string) => {
    if (accessLevel === 'read-only') {
      return (
        <Badge variant="secondary" className="text-xs">
          <Shield className="h-3 w-3 mr-1" /> Read only
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <ShieldCheck className="h-3 w-3 mr-1" /> Full access
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-muted-foreground mt-1">
          Connect your tools so Skillomatic can help you work faster
        </p>
      </div>

      {/* Onboarding: Show until email, calendar, and sheets are connected */}
      {(() => {
        const hasEmail = integrationList.some(i => i.provider === 'email' && i.status === 'connected');
        const hasCalendar = integrationList.some(i => i.provider === 'calendar' && i.status === 'connected');
        const hasSheets = integrationList.some(i => i.provider === 'google-sheets' && i.status === 'connected');
        const allConnected = hasEmail && hasCalendar && hasSheets;
        const noneConnected = !hasEmail && !hasCalendar && !hasSheets;

        if (allConnected) return null;

        return (
          <div id="connect-google" className="bg-amber-50 border-amber-200 rounded-lg p-5 border relative">
            <OnboardingBadge elementId="connect-google" className="absolute -top-2 -right-2" />
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">
                  Connect your tools to get started
                </p>
                <p className="text-sm text-amber-800 mb-4">
                  {noneConnected
                    ? "One click connects Gmail, Calendar, and Sheets—everything you need to get started."
                    : "Skillomatic works best when it can access your data. Connect the essentials to unlock the full experience."}
                </p>

                {/* Show one-click button if nothing is connected yet */}
                {noneConnected ? (
                  <Button
                    size="lg"
                    onClick={() => {
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                      const token = localStorage.getItem('token');
                      window.location.href = `${apiUrl}/integrations/google/connect?token=${encodeURIComponent(token || '')}`;
                    }}
                    disabled={isConnecting}
                    className="w-full sm:w-auto"
                  >
                    {isConnecting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plug className="h-4 w-4 mr-2" />
                    )}
                    Connect Google (Gmail, Calendar, Sheets)
                  </Button>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className={`rounded-md p-3 ${hasEmail ? 'bg-green-100 border border-green-300' : 'bg-white/60'}`}>
                      <p className="font-medium text-amber-900 mb-1 flex items-center gap-2">
                        {hasEmail && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        1. Email
                      </p>
                      <p className="text-amber-700">Send messages and follow-ups</p>
                    </div>
                    <div className={`rounded-md p-3 ${hasCalendar ? 'bg-green-100 border border-green-300' : 'bg-white/60'}`}>
                      <p className="font-medium text-amber-900 mb-1 flex items-center gap-2">
                        {hasCalendar && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        2. Calendar
                      </p>
                      <p className="text-amber-700">Schedule meetings and check availability</p>
                    </div>
                    <div className={`rounded-md p-3 ${hasSheets ? 'bg-green-100 border border-green-300' : 'bg-white/60'}`}>
                      <p className="font-medium text-amber-900 mb-1 flex items-center gap-2">
                        {hasSheets && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        3. Sheets
                      </p>
                      <p className="text-amber-700">Spreadsheets for tracking data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Essentials Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Essentials</h2>
          {/* Show disconnect button when any Google essential is connected */}
          {integrationList.some(i => ['email', 'calendar', 'google-sheets'].includes(i.provider) && i.status === 'connected') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDisconnectTarget({ id: 'google-all', name: 'Google' })}
            >
              <Unplug className="h-4 w-4 mr-1" />
              Disconnect Google
            </Button>
          )}
        </div>
        {(() => {
          // Find first unconnected essential (in order: email, calendar)
          const firstUnconnected = essentialProviders.find((p) => {
            const integration = getIntegrationStatus(p.id);
            return integration?.status !== 'connected';
          })?.id;

          return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essentialProviders.map((provider) => {
            const integration = getIntegrationStatus(provider.id);
            const isConnected = integration?.status === 'connected';
            const Icon = providerIcons[provider.id] || Plug;
            const showBadge = provider.id === firstUnconnected;

            return (
              <Card key={provider.id} className={isConnected ? 'border-green-200 bg-green-50/30' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                        <Icon
                          className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {provider.name}
                          {provider.id === 'google-sheets' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetsInfoOpen(true);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Lightbulb className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                              How it works
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">{provider.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {integration && integration.status !== 'disconnected' ? (
                    <div className="space-y-2">
                      {getStatusBadge(integration.status)}
                      {/* Access level selector for connected integrations */}
                      {isConnected && (
                        <div className="flex items-center justify-between pt-1">
                          <Select
                            value={integration.accessLevel || 'read-write'}
                            onValueChange={(value) => handleUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
                            disabled={updatingAccessLevel === integration.id}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              {(integration.accessLevel || 'read-write') === 'read-write' ? (
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Full access
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Read only
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read-write">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Full access
                                </span>
                              </SelectItem>
                              <SelectItem value="read-only">
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Read only
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => handleConnect(provider)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plug className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
          );
        })()}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Google Workspace Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Google Workspace</h2>
          <p className="text-sm text-muted-foreground">Enable the tools you want to use</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {(() => {
                // Check if Google is connected at all (any essentials connected)
                const hasAnyGoogle = integrationList.some(i =>
                  ['email', 'calendar', 'google-sheets'].includes(i.provider) && i.status === 'connected'
                );

                return GOOGLE_WORKSPACE_TOOLS.map((tool) => {
                  const integration = integrationList.find(i => i.provider === tool.id as typeof i.provider);
                  const isConnected = integration?.status === 'connected';
                  const Icon = providerIcons[tool.id] || Plug;
                  const isEnabling = enablingTool === tool.id;

                  return (
                    <div key={tool.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                          <Icon className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {tool.name}
                            {isEnabling && (
                              <span className="ml-2 text-xs text-muted-foreground">(enabling...)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Access level dropdown - only show when connected */}
                        {isConnected && integration && (
                          <Select
                            value={integration.accessLevel || 'read-write'}
                            onValueChange={(value) => handleUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
                            disabled={updatingAccessLevel === integration.id}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              {(integration.accessLevel || 'read-write') === 'read-write' ? (
                                <span className="flex items-center gap-1.5">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Full
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5" /> Read only
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read-write">
                                <span className="flex items-center gap-1.5">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Full
                                </span>
                              </SelectItem>
                              <SelectItem value="read-only">
                                <span className="flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5" /> Read only
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {/* Toggle switch */}
                        <Switch
                          checked={isConnected}
                          disabled={isConnecting || enablingTool === tool.id || (!hasAnyGoogle && !isConnected)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Enable the tool by copying tokens from existing Google integration
                              handleEnableGoogleTool(tool.id, tool.name);
                            } else if (integration) {
                              // Quick disconnect with toast (no confirmation dialog)
                              handleQuickDisconnect(integration.id, tool.name);
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Other Connections Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Other Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherProviders.map((provider) => {
            const integration = getIntegrationStatus(provider.id);
            const isConnected = integration?.status === 'connected';
            const Icon = providerIcons[provider.id] || Plug;
            const blocked = isProviderBlocked(provider);

            return (
              <Card
                key={provider.id}
                className={`flex flex-col ${
                  isConnected
                    ? 'border-green-200 bg-green-50/30'
                    : blocked
                      ? 'opacity-60 border-dashed'
                      : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : blocked ? 'bg-muted/50' : 'bg-muted'}`}>
                        <Icon
                          className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {provider.name}
                          {provider.id === 'scheduling' && (
                            <Badge className="text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                              Pro
                            </Badge>
                          )}
                          {blocked && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Org Only
                            </Badge>
                          )}
                          {provider.id === 'google-sheets' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetsInfoOpen(true);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              <Lightbulb className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                              How it works
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!blocked && getStatusBadge(integration?.status || 'disconnected')}
                      {isConnected && getAccessLevelBadge(integration?.accessLevel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  {blocked ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        This integration requires an organization account.
                      </p>
                      <Link to="/onboarding/account-type">
                        <Button variant="outline" className="w-full">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Upgrade to Organization
                        </Button>
                      </Link>
                    </div>
                  ) : integration && integration.status !== 'disconnected' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {integration.lastSyncAt && (
                            <>
                              <RefreshCw className="h-3 w-3 inline mr-1" />
                              Last sync:{' '}
                              {integration.lastSyncAt instanceof Date
                                ? integration.lastSyncAt.toLocaleDateString()
                                : new Date(integration.lastSyncAt).toLocaleDateString()}
                            </>
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDisconnectTarget({ id: integration.id, name: provider.name })}
                        >
                          <Unplug className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                      {/* Access level selector for connected integrations */}
                      {isConnected && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Access level:</Label>
                          <Select
                            value={integration.accessLevel || 'read-write'}
                            onValueChange={(value) => handleUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
                            disabled={updatingAccessLevel === integration.id}
                          >
                            <SelectTrigger className="h-7 w-[140px] text-xs">
                              {(integration.accessLevel || 'read-write') === 'read-write' ? (
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Full access
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Read only
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read-write">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" /> Full access
                                </span>
                              </SelectItem>
                              <SelectItem value="read-only">
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" /> Read only
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {provider.id === 'scheduling' && (
                        <p className="text-xs text-muted-foreground text-center">
                          Don't have an account?{' '}
                          <a href="https://calendly.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Calendly</a>
                          {' · '}
                          <a href="https://cal.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cal.com</a>
                        </p>
                      )}
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(provider)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plug className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Placeholder for requesting new integrations */}
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">I wanna connect my app!</CardTitle>
                    <CardDescription>Missing an integration? Let us know what you need.</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                See what's possible:{' '}
                <a href="https://nango.dev/integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  250+ integrations
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.dispatchEvent(new CustomEvent('open-complain-dialog'))}
              >
                Complain
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Dialog for providers */}
      <AlertDialog open={!!connectDialogProvider} onOpenChange={() => setConnectDialogProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect {connectDialogProvider?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              {connectDialogProvider?.subProviders
                ? `Select which ${connectDialogProvider?.name.toLowerCase()} service you want to connect.`
                : `Configure your ${connectDialogProvider?.name.toLowerCase()} connection settings.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Pro feature notice for scheduling */}
            {connectDialogProvider?.id === 'scheduling' && (
              <Alert className="border-violet-200 bg-violet-50">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <AlertDescription className="text-violet-900">
                  <span className="font-medium">Pro feature:</span> Free accounts are limited to 5 scheduling requests per day. Upgrade anytime for unlimited access.
                </AlertDescription>
              </Alert>
            )}

            {/* Sub-provider selection (if applicable) */}
            {connectDialogProvider?.subProviders && (
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={selectedSubProvider} onValueChange={setSelectedSubProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectDialogProvider?.subProviders?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Access level selection */}
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={selectedAccessLevel} onValueChange={(v) => setSelectedAccessLevel(v as IntegrationAccessLevel)}>
                <SelectTrigger>
                  {selectedAccessLevel === 'read-write' ? (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Full access
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Read only
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read-write">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Full access
                      </span>
                      <span className="text-xs text-muted-foreground">Read and write data</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="read-only">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Read only
                      </span>
                      <span className="text-xs text-muted-foreground">Only read data, no modifications</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedAccessLevel === 'read-only'
                  ? 'Some skills that require write access will be limited.'
                  : 'Skills will have full access to this integration.'}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConnect}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect with OAuth
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              {disconnectTarget?.id === 'google-all'
                ? 'This will disconnect all Google services (Gmail, Calendar, Sheets, Drive, Docs, Forms, Contacts, and Tasks). Skills that use these integrations will stop working until you reconnect.'
                : `Are you sure you want to disconnect ${disconnectTarget?.name}? Skills that require this integration will stop working until you reconnect.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect{disconnectTarget?.id === 'google-all' ? ' All' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Intention Dialog - Prompts for payment method before premium integrations */}
      <PayIntentionDialog
        open={payIntentionDialog.open}
        onClose={() => setPayIntentionDialog({ ...payIntentionDialog, open: false })}
        triggerType={payIntentionDialog.triggerType}
        triggerProvider={payIntentionDialog.triggerProvider}
        providerName={payIntentionDialog.providerName}
      />

      {/* Google Sheets Info Dialog - Educational modal */}
      <GoogleSheetsInfoDialog
        open={sheetsInfoOpen}
        onClose={() => setSheetsInfoOpen(false)}
      />

      {/* Google Reconnect Dialog - When user tries to enable a tool they didn't grant access to */}
      <AlertDialog open={reconnectDialog?.open} onOpenChange={() => setReconnectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permission Required</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You didn't grant access to <strong>{reconnectDialog?.toolName}</strong> when connecting Google.
              </p>
              <p>
                To enable this tool, you'll need to reconnect Google and grant the additional permission.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setReconnectDialog(null);
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const token = localStorage.getItem('token');
                window.location.href = `${apiUrl}/integrations/google/connect?token=${encodeURIComponent(token || '')}`;
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect Google
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
