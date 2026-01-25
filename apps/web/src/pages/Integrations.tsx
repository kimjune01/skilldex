import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Nango from '@nangohq/frontend';
import { integrations, type IntegrationAccessLevel } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { IntegrationPublic, IntegrationProvider } from '@skillomatic/shared';
import { getProviders, getProvider, type IntegrationCategory, isProviderAllowedForIndividual, type PayIntentionTrigger } from '@skillomatic/shared';
import { PayIntentionDialog } from '@/components/PayIntentionDialog';
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
  Linkedin,
  Mail,
  Calendar,
  FileText,
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
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon mapping for integration providers.
 * Uses category-based icons with provider-specific overrides.
 */
const providerIcons: Record<IntegrationProvider, LucideIcon> = {
  ats: Briefcase,
  linkedin: Linkedin,
  email: Mail,
  calendar: Calendar,
  granola: FileText,
  airtable: Table2,
  'google-sheets': Table2,
};

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
  // Essential integrations - core recruiting workflow
  const essentialProviders: ProviderConfig[] = [
    {
      id: 'email',
      name: 'Email',
      description: 'Email integration for outreach',
      subProviders: getSubProvidersForCategory('email'),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Calendar integration for scheduling',
      subProviders: getSubProvidersForCategory('calendar'),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'LinkedIn profile lookup (via browser extension)',
    },
  ];

  // Other integrations - specialized tools
  // Database providers from registry (e.g., Airtable)
  const databaseProviders = getProviders({ category: 'database' });

  const otherProviders: ProviderConfig[] = [
    {
      id: 'ats',
      name: 'ATS',
      description: 'Connect your Applicant Tracking System',
      subProviders: getSubProvidersForCategory('ats'),
    },
    // Add each database provider as a standalone integration
    ...databaseProviders.map((p) => ({
      id: p.id as IntegrationProvider,
      name: p.displayName,
      description: `Connect your ${p.displayName} account`,
    })),
    {
      id: 'granola',
      name: 'Granola',
      description: 'Meeting notes sync',
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
   */
  const isProviderBlocked = (providerId: string): boolean => {
    if (!isIndividual) return false;
    return !isProviderAllowedForIndividual(providerId);
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
      setSuccessMessage(`Access level updated to ${newLevel === 'read-write' ? 'Full access' : 'Read only'}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update access level');
    } finally {
      setUpdatingAccessLevel(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    try {
      await integrations.disconnect(disconnectTarget.id);
      await loadIntegrations();
      setSuccessMessage('Integration disconnected successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }

    setDisconnectTarget(null);
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
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your tools so Skillomatic can help you work faster
        </p>
      </div>

      {/* Individual account upgrade banner */}
      {isIndividual && (
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 border-primary/20 rounded-lg p-5 border">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-primary mb-1">
                You're on a Free Individual Account
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Individual accounts include email, calendar, and Google Sheets.
                Create or join an organization to unlock ATS integrations and team features.
              </p>
              <Link to="/onboarding/account-type">
                <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade to Organization
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Motivation + conceptual explanation */}
      <div className="bg-amber-50 border-amber-200 rounded-lg p-5 border">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 mb-2">
              Skillomatic needs your tools to work
            </p>
            <p className="text-sm text-amber-800 mb-4">
              Without connections, there's no candidate data to search, nowhere to track progress, and no way to send emails. Connect at least one tool from each category below to unlock the full experience.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/60 rounded-md p-3">
                <p className="font-medium text-amber-900 mb-1">1. Where candidates live</p>
                <p className="text-amber-700">Your ATS or a spreadsheet—this is your source of truth</p>
              </div>
              <div className="bg-white/60 rounded-md p-3">
                <p className="font-medium text-amber-900 mb-1">2. How you reach them</p>
                <p className="text-amber-700">Email to send outreach and follow-ups</p>
              </div>
              <div className="bg-white/60 rounded-md p-3">
                <p className="font-medium text-amber-900 mb-1">3. How you schedule</p>
                <p className="text-amber-700">Calendar to book interviews and check availability</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        <h2 className="text-lg font-semibold mb-4">Essentials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essentialProviders.map((provider) => {
            const integration = getIntegrationStatus(provider.id);
            const isConnected = integration?.status === 'connected';
            const Icon = providerIcons[provider.id];

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
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <CardDescription className="text-xs">{provider.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {integration && integration.status !== 'disconnected' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(integration.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDisconnectTarget({ id: integration.id, name: provider.name })}
                        >
                          <Unplug className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Access level selector for connected integrations */}
                      {isConnected && (
                        <div className="flex items-center justify-between pt-1">
                          <Select
                            value={integration.accessLevel || 'read-write'}
                            onValueChange={(value) => handleUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
                            disabled={updatingAccessLevel === integration.id}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue />
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
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Other Integrations Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Other Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherProviders.map((provider) => {
            const integration = getIntegrationStatus(provider.id);
            const isConnected = integration?.status === 'connected';
            const Icon = providerIcons[provider.id];
            const blocked = isProviderBlocked(provider.id);

            return (
              <Card
                key={provider.id}
                className={
                  isConnected
                    ? 'border-green-200 bg-green-50/30'
                    : blocked
                      ? 'opacity-60 border-dashed'
                      : ''
                }
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
                          {blocked && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Org Only
                            </Badge>
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
                <CardContent>
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
                              <SelectValue />
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
                  )}
                </CardContent>
              </Card>
            );
          })}
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
                  <SelectValue />
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
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect the {disconnectTarget?.name} integration? Skills
              that require this integration will stop working until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
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
    </div>
  );
}
