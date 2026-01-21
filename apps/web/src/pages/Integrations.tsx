import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrations } from '../lib/api';
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
  { id: 'greenhouse', name: 'Greenhouse' },
  { id: 'lever', name: 'Lever' },
  { id: 'ashby', name: 'Ashby' },
  { id: 'workable', name: 'Workable' },
];

// Calendar sub-providers
const calendarProviders = [
  { id: 'google-calendar', name: 'Google Calendar' },
  { id: 'outlook-calendar', name: 'Outlook Calendar' },
  { id: 'calendly', name: 'Calendly' },
];

// Email sub-providers
const emailProviders = [
  { id: 'gmail', name: 'Gmail' },
  { id: 'outlook', name: 'Outlook' },
];

const availableProviders: {
  id: IntegrationProvider;
  name: string;
  description: string;
  subProviders?: { id: string; name: string }[];
}[] = [
  {
    id: 'ats',
    name: 'ATS',
    description: 'Connect your Applicant Tracking System',
    subProviders: atsProviders,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn profile lookup (via browser extension)',
  },
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
    id: 'granola',
    name: 'Granola',
    description: 'Meeting notes sync',
  },
];

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(
    null
  );

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
    } else {
      // Direct connect for providers without sub-providers
      initiateOAuth(provider.id);
    }
  };

  const initiateOAuth = async (provider: string, subProvider?: string) => {
    setIsConnecting(true);
    setError('');

    try {
      const response = await integrations.connect(provider, subProvider);

      // Redirect to OAuth URL
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  const handleConfirmConnect = () => {
    if (connectDialogProvider) {
      initiateOAuth(connectDialogProvider.id, selectedSubProvider);
      setConnectDialogProvider(null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableProviders.map((provider) => {
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
                  {getStatusBadge(integration?.status || 'disconnected')}
                </div>
              </CardHeader>
              <CardContent>
                {integration && integration.status !== 'disconnected' ? (
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

      {/* Connect Dialog for providers with sub-providers */}
      <AlertDialog open={!!connectDialogProvider} onOpenChange={() => setConnectDialogProvider(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect {connectDialogProvider?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Select which {connectDialogProvider?.name.toLowerCase()} service you want to connect.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
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
