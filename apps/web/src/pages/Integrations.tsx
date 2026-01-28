import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Nango from '@nangohq/frontend';
import { integrations, type IntegrationAccessLevel } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
import { useToast } from '@/components/ui/toast';
import type { IntegrationPublic, IntegrationProvider } from '@skillomatic/shared';
import { getProvider, isProviderAllowedForIndividual, type PayIntentionTrigger } from '@skillomatic/shared';
import { PayIntentionDialog } from '@/components/PayIntentionDialog';
import { GoogleSheetsInfoDialog } from '@/components/GoogleSheetsInfoDialog';
import { IntegrationRequestDialog } from '@/components/IntegrationRequestDialog';
import { OnboardingBadge } from '@/components/ui/onboarding-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  CheckCircle2,
  AlertCircle,
  Plug,
  Unplug,
  RefreshCw,
  ExternalLink,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Import extracted modules
import {
  buildProviderConfigs,
  GOOGLE_WORKSPACE_TOOLS,
  GOOGLE_PROVIDER_IDS,
  ESSENTIAL_GOOGLE_PROVIDER_IDS,
  type ProviderConfig,
} from '@/lib/integrations';
import { EssentialProviderCard, GoogleWorkspaceToolRow, OtherProviderCard } from '@/components/integrations';

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, isIndividual, refreshUser } = useAuth();
  const { toast } = useToast();

  // Build provider configs from registry (memoized to avoid rebuilding on every render)
  const { essentialProviders, otherProviders, timeTrackingProviders } = useMemo(() => buildProviderConfigs(), []);

  // Dialog states
  const [connectDialogProvider, setConnectDialogProvider] = useState<{
    id: IntegrationProvider;
    name: string;
    subProviders?: { id: string; name: string }[];
  } | null>(null);
  const [selectedSubProvider, setSelectedSubProvider] = useState<string>('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<IntegrationAccessLevel>('read-write');
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);
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

  // Integration request dialog state
  const [integrationRequestOpen, setIntegrationRequestOpen] = useState(false);

  // API key input state (for api-key auth flow providers like Clockify)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');

  // Google reconnect dialog state
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

  // Check if Google is connected and advance onboarding if needed
  useEffect(() => {
    if (!user || isLoading) return;
    if (user.onboardingStep < ONBOARDING_STEPS.GOOGLE_CONNECTED) {
      const hasGoogleConnected = integrationList.some(
        i => ESSENTIAL_GOOGLE_PROVIDER_IDS.includes(i.provider as typeof ESSENTIAL_GOOGLE_PROVIDER_IDS[number]) && i.status === 'connected'
      );
      if (hasGoogleConnected) {
        refreshUser();
      }
    }
  }, [user, integrationList, isLoading, refreshUser]);

  // Listen for custom event to open integration request dialog
  useEffect(() => {
    const handleOpenDialog = () => setIntegrationRequestOpen(true);
    window.addEventListener('open-complain-dialog', handleOpenDialog);
    return () => window.removeEventListener('open-complain-dialog', handleOpenDialog);
  }, []);

  // Handle OAuth callback and pay intention query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');
    const payIntentionParam = searchParams.get('pay_intention');

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'invalid_state': 'Your connection request timed out. Please try again.',
        'missing_code_or_state': 'Connection was interrupted. Please try again.',
        'token_exchange_failed': 'Could not complete connection. Please try again.',
        'oauth_not_configured': 'OAuth is not configured. Please contact support.',
        'oauth_failed': 'Connection failed. Please try again.',
        'access_denied': 'You declined the connection request.',
      };
      setError(errorMessages[errorParam] || errorParam);
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }

    if (successParam) {
      setSuccessMessage(successParam);
      loadIntegrations();
      refreshUser();
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(''), 5000);
    }

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
  }, [searchParams, setSearchParams, refreshUser]);

  const isProviderBlocked = (provider: { id: string; subProviders?: { id: string }[] }): boolean => {
    if (!isIndividual) return false;
    if (provider.subProviders) {
      return provider.subProviders.every(sub => !isProviderAllowedForIndividual(sub.id));
    }
    return !isProviderAllowedForIndividual(provider.id);
  };

  const handleConnect = (provider: ProviderConfig) => {
    if (isIndividual) {
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

    setApiKeyInput('');
    setApiKeyError('');

    if (provider.subProviders && provider.subProviders.length > 0) {
      setConnectDialogProvider(provider);
      const allowedSubProviders = isIndividual
        ? provider.subProviders.filter(sub => isProviderAllowedForIndividual(sub.id))
        : provider.subProviders;
      setSelectedSubProvider(allowedSubProviders[0]?.id || provider.subProviders[0].id);
      setSelectedAccessLevel('read-write');
    } else {
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
      const providerConfig = getProvider(subProvider || provider);
      const oauthFlow = providerConfig?.oauthFlow || 'nango';

      if (oauthFlow === 'none') {
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
        const providerId = subProvider || provider;
        window.location.href = `${apiUrl}/integrations/${providerId}/connect?token=${encodeURIComponent(token || '')}`;
        return;
      }

      if (oauthFlow === 'api-key') {
        const providerId = subProvider || provider;
        if (!apiKeyInput || apiKeyInput.trim() === '') {
          setApiKeyError('Please enter your API key');
          setIsConnecting(false);
          return;
        }

        const response = await fetch(`${apiUrl}/integrations/${providerId}/connect-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ apiKey: apiKeyInput.trim(), accessLevel }),
        });

        const data = await response.json();
        if (!response.ok) {
          setApiKeyError(data.error?.message || `Failed to connect ${providerConfig?.displayName || providerId}`);
          setIsConnecting(false);
          return;
        }

        setSuccessMessage(data.data?.message || `${providerConfig?.displayName || providerId} connected successfully`);
        setApiKeyInput('');
        setApiKeyError('');
        await loadIntegrations();
        setIsConnecting(false);
        setTimeout(() => setSuccessMessage(''), 5000);
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
      if (err instanceof Error && err.message.includes('payment method')) {
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
        const googleIntegrations = integrationList.filter(
          i => GOOGLE_PROVIDER_IDS.includes(i.provider as typeof GOOGLE_PROVIDER_IDS[number]) && i.status === 'connected'
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

  const handleQuickDisconnect = async (integrationId: string, name: string) => {
    try {
      await integrations.disconnect(integrationId);
      await loadIntegrations();
      toast(`${name} disabled`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to disconnect', 'error');
    }
  };

  const handleEnableGoogleTool = async (toolId: string, toolName: string) => {
    setEnablingTool(toolId);
    try {
      await integrations.enableGoogleTool(toolId);
      await loadIntegrations();
      toast(`${toolName} enabled`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable tool';
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
    const matches = integrationList.filter((i) => i.provider === provider);
    return matches.find((i) => i.status === 'connected') || matches[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  // Computed values for the UI
  const hasEmail = integrationList.some(i => i.provider === 'email' && i.status === 'connected');
  const hasCalendar = integrationList.some(i => i.provider === 'calendar' && i.status === 'connected');
  const hasSheets = integrationList.some(i => i.provider === 'google-sheets' && i.status === 'connected');
  const allEssentialsConnected = hasEmail && hasCalendar && hasSheets;
  const noneConnected = !hasEmail && !hasCalendar && !hasSheets;
  const hasAnyGoogle = integrationList.some(i =>
    ESSENTIAL_GOOGLE_PROVIDER_IDS.includes(i.provider as typeof ESSENTIAL_GOOGLE_PROVIDER_IDS[number]) && i.status === 'connected'
  );
  const firstUnconnected = essentialProviders.find((p) => {
    const integration = getIntegrationStatus(p.id);
    return integration?.status !== 'connected';
  })?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-muted-foreground mt-1">
          Connect your tools so Skillomatic can help you work faster
        </p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Your data stays in your tools. We only store connection tokens, never your content.
          <Link to="/security" className="text-primary hover:underline">Learn more</Link>
        </p>
      </div>

      {/* Onboarding Banner */}
      {!allEssentialsConnected && (
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
      )}

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
          {hasAnyGoogle && (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essentialProviders.map((provider) => (
            <EssentialProviderCard
              key={provider.id}
              provider={provider}
              integration={getIntegrationStatus(provider.id)}
              showBadge={provider.id === firstUnconnected}
              isConnecting={isConnecting}
              updatingAccessLevel={updatingAccessLevel}
              onConnect={handleConnect}
              onUpdateAccessLevel={handleUpdateAccessLevel}
              onShowSheetsInfo={() => setSheetsInfoOpen(true)}
            />
          ))}
        </div>
      </div>

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
              {GOOGLE_WORKSPACE_TOOLS.map((tool) => (
                <GoogleWorkspaceToolRow
                  key={tool.id}
                  tool={tool}
                  integration={integrationList.find(i => i.provider === tool.id as typeof i.provider)}
                  hasAnyGoogle={hasAnyGoogle}
                  isConnecting={isConnecting}
                  enablingTool={enablingTool}
                  updatingAccessLevel={updatingAccessLevel}
                  onEnable={handleEnableGoogleTool}
                  onDisconnect={handleQuickDisconnect}
                  onUpdateAccessLevel={handleUpdateAccessLevel}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-border" />

      {/* Other Connections Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Other Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {otherProviders.map((provider) => (
            <OtherProviderCard
              key={provider.id}
              provider={provider}
              integration={getIntegrationStatus(provider.id)}
              blocked={isProviderBlocked(provider)}
              isConnecting={isConnecting}
              updatingAccessLevel={updatingAccessLevel}
              onConnect={handleConnect}
              onDisconnect={(id, name) => setDisconnectTarget({ id, name })}
              onUpdateAccessLevel={handleUpdateAccessLevel}
            />
          ))}

          {timeTrackingProviders.map((provider) => (
            <OtherProviderCard
              key={provider.id}
              provider={provider}
              integration={getIntegrationStatus(provider.id as IntegrationProvider)}
              blocked={isProviderBlocked(provider)}
              isConnecting={isConnecting}
              updatingAccessLevel={updatingAccessLevel}
              onConnect={handleConnect}
              onDisconnect={(id, name) => setDisconnectTarget({ id, name })}
              onUpdateAccessLevel={handleUpdateAccessLevel}
              variant="time-tracking"
            />
          ))}

          {/* Request new integration card */}
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Don't see your tool?</CardTitle>
                    <CardDescription>Request an integration and we'll look into it.</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                We can connect to most tools -{' '}
                <a href="https://nango.dev/integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  250+ already supported
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIntegrationRequestOpen(true)}
              >
                Request Integration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Dialog */}
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
            {connectDialogProvider?.id === 'scheduling' && (
              <Alert className="border-violet-200 bg-violet-50">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <AlertDescription className="text-violet-900">
                  <span className="font-medium">Pro feature:</span> Free accounts are limited to 5 scheduling requests per day. Upgrade anytime for unlimited access.
                </AlertDescription>
              </Alert>
            )}

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

            {(() => {
              const providerId = connectDialogProvider?.subProviders ? selectedSubProvider : connectDialogProvider?.id;
              const providerConfig = providerId ? getProvider(providerId) : null;
              const isApiKeyAuth = providerConfig?.oauthFlow === 'api-key';

              if (!isApiKeyAuth) return null;

              return (
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Paste your API key here"
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setApiKeyError('');
                    }}
                    className={apiKeyError ? 'border-red-500' : ''}
                  />
                  {apiKeyError && <p className="text-xs text-red-500">{apiKeyError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a
                      href={providerConfig?.apiKeySetupUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {providerConfig?.displayName} settings
                      <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </p>
                </div>
              );
            })()}

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
            {(() => {
              const providerId = connectDialogProvider?.subProviders ? selectedSubProvider : connectDialogProvider?.id;
              const providerConfig = providerId ? getProvider(providerId) : null;
              const isApiKeyAuth = providerConfig?.oauthFlow === 'api-key';

              return (
                <AlertDialogAction onClick={handleConfirmConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : isApiKeyAuth ? (
                    <>
                      <Plug className="h-4 w-4 mr-2" />
                      Connect with API Key
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect with OAuth
                    </>
                  )}
                </AlertDialogAction>
              );
            })()}
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

      <PayIntentionDialog
        open={payIntentionDialog.open}
        onClose={() => setPayIntentionDialog({ ...payIntentionDialog, open: false })}
        triggerType={payIntentionDialog.triggerType}
        triggerProvider={payIntentionDialog.triggerProvider}
        providerName={payIntentionDialog.providerName}
      />

      <GoogleSheetsInfoDialog
        open={sheetsInfoOpen}
        onClose={() => setSheetsInfoOpen(false)}
      />

      <IntegrationRequestDialog
        open={integrationRequestOpen}
        onClose={() => setIntegrationRequestOpen(false)}
      />

      {/* Google Reconnect Dialog */}
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
