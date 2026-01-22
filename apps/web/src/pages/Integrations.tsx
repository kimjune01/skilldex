import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nango from '@nangohq/frontend';
import { integrations, type IntegrationAccessLevel } from '../lib/api';
import type { IntegrationPublic, IntegrationProvider } from '@skillomatic/shared';
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
} from 'lucide-react';

const providerIcons: Record<IntegrationProvider, typeof Briefcase> = {
  ats: Briefcase,
  linkedin: Linkedin,
  email: Mail,
  calendar: Calendar,
  granola: FileText,
};

// ATS sub-providers for specific ATS selection
const atsProviders = [
  { id: 'zoho-recruit', name: 'Zoho Recruit' },
  { id: 'greenhouse', name: 'Greenhouse' },
  { id: 'lever', name: 'Lever' },
  { id: 'ashby', name: 'Ashby' },
  { id: 'workable', name: 'Workable' },
  { id: 'icims', name: 'iCIMS (Beta)' },
  { id: 'workday', name: 'Workday (Beta)' },
  { id: 'taleo', name: 'Oracle Taleo (Beta)' },
  { id: 'successfactors', name: 'SAP SuccessFactors (Beta)' },
  { id: 'smartrecruiters', name: 'SmartRecruiters (Beta)' },
  { id: 'jobvite', name: 'Jobvite (Beta)' },
  { id: 'bamboohr', name: 'BambooHR (Beta)' },
  { id: 'jazzhr', name: 'JazzHR (Beta)' },
  { id: 'bullhorn', name: 'Bullhorn (Beta)' },
  { id: 'recruitee', name: 'Recruitee (Beta)' },
];

// Calendar sub-providers
const calendarProviders = [
  { id: 'google-calendar', name: 'Google Calendar' },
  { id: 'outlook-calendar', name: 'Outlook Calendar' },
  { id: 'calendly', name: 'Calendly' },
];

// Email sub-providers - IDs must match Nango Integration IDs
const emailProviders = [
  { id: 'google-mail', name: 'Gmail' },
  { id: 'outlook', name: 'Outlook' },
];

type ProviderConfig = {
  id: IntegrationProvider;
  name: string;
  description: string;
  subProviders?: { id: string; name: string }[];
};

// Essential integrations - core recruiting workflow
const essentialProviders: ProviderConfig[] = [
  {
    id: 'email',
    name: 'Email',
    description: 'Email integration for outreach',
    subProviders: emailProviders,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Calendar integration for scheduling',
    subProviders: calendarProviders,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn profile lookup (via browser extension)',
  },
];

// Other integrations - specialized tools
const otherProviders: ProviderConfig[] = [
  {
    id: 'ats',
    name: 'ATS',
    description: 'Connect your Applicant Tracking System',
    subProviders: atsProviders,
  },
  {
    id: 'granola',
    name: 'Granola',
    description: 'Meeting notes sync',
  },
];

const availableProviders = [...essentialProviders, ...otherProviders];

export default function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  // Handle OAuth callback query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

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
  }, [searchParams, setSearchParams]);

  const handleConnect = (provider: (typeof availableProviders)[0]) => {
    if (provider.subProviders && provider.subProviders.length > 0) {
      // Show dialog to select sub-provider
      setConnectDialogProvider(provider);
      setSelectedSubProvider(provider.subProviders[0].id);
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

      // Special handling for Gmail - use direct OAuth instead of Nango
      if (provider === 'email' && (subProvider === 'google-mail' || subProvider === 'gmail')) {
        window.location.href = `${apiUrl}/integrations/gmail/connect?token=${encodeURIComponent(token || '')}`;
        return;
      }

      // Special handling for Google Calendar - use direct OAuth instead of Nango
      if (provider === 'calendar' && subProvider === 'google-calendar') {
        window.location.href = `${apiUrl}/integrations/google-calendar/connect?token=${encodeURIComponent(token || '')}`;
        return;
      }

      // For other providers, use Nango Connect UI
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
    return integrationList.find((i) => i.provider === provider);
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
          Connect external services to enable skill capabilities
        </p>
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

            return (
              <Card key={provider.id} className={isConnected ? 'border-green-200 bg-green-50/30' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
                        <Icon
                          className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(integration?.status || 'disconnected')}
                      {isConnected && getAccessLevelBadge(integration?.accessLevel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {integration && integration.status !== 'disconnected' ? (
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
    </div>
  );
}
