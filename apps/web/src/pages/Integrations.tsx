import { useEffect, useState } from 'react';
import { integrations } from '../lib/api';
import type { IntegrationPublic, IntegrationProvider } from '@skilldex/shared';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  RotateCcw,
} from 'lucide-react';

const providerIcons: Record<IntegrationProvider, typeof Briefcase> = {
  ats: Briefcase,
  linkedin: Linkedin,
  email: Mail,
  calendar: Calendar,
  granola: FileText,
};

const availableProviders: { id: IntegrationProvider; name: string; description: string }[] = [
  { id: 'ats', name: 'ATS', description: 'Applicant Tracking System integration' },
  { id: 'linkedin', name: 'LinkedIn', description: 'LinkedIn profile lookup (via browser)' },
  { id: 'email', name: 'Email', description: 'Email drafting and sending' },
  { id: 'calendar', name: 'Calendar', description: 'Interview scheduling' },
  { id: 'granola', name: 'Granola', description: 'Meeting notes sync' },
];

// Mock connected state for demo purposes
const mockConnectedProviders: IntegrationProvider[] = ['ats', 'email', 'calendar'];

export default function Integrations() {
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const useMockData = true;

  // Dialog states
  const [oauthDialogProvider, setOauthDialogProvider] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Mock integrations for demo
  const mockIntegrations: IntegrationPublic[] = mockConnectedProviders.map((provider, index) => ({
    id: `mock-${provider}`,
    provider,
    status: 'connected' as const,
    lastSyncAt: new Date(Date.now() - index * 86400000), // Stagger last sync dates
    createdAt: new Date(Date.now() - 30 * 86400000),
  }));

  const loadIntegrations = () => {
    if (useMockData) {
      setIntegrationList(mockIntegrations);
      setIsLoading(false);
      return;
    }

    integrations
      .list()
      .then(setIntegrationList)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load integrations');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadIntegrations();
  }, [useMockData]);

  const handleConnect = (provider: string) => {
    setOauthDialogProvider(provider);
  };

  const handleAuthorize = async () => {
    if (!oauthDialogProvider) return;

    setIsAuthorizing(true);

    // Simulate OAuth authorization
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (useMockData) {
      // Add to mock connected list
      const newIntegration: IntegrationPublic = {
        id: `mock-${oauthDialogProvider}`,
        provider: oauthDialogProvider as IntegrationProvider,
        status: 'connected',
        lastSyncAt: new Date(),
        createdAt: new Date(),
      };
      setIntegrationList(prev => [...prev, newIntegration]);
    }

    setIsAuthorizing(false);
    setOauthDialogProvider(null);
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    if (useMockData) {
      setIntegrationList(prev => prev.filter(i => i.id !== disconnectTarget.id));
    } else {
      try {
        await integrations.disconnect(disconnectTarget.id);
        loadIntegrations();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to disconnect');
      }
    }

    setDisconnectTarget(null);
  };

  const handleReset = () => {
    setIntegrationList(mockIntegrations);
    setResetDialogOpen(false);
  };

  const getIntegrationStatus = (provider: IntegrationProvider) => {
    return integrationList.find((i) => i.provider === provider);
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
          Connect your external services to use with Claude Code skills
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
                      <Icon className={`h-5 w-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'success' : 'secondary'}>
                    {isConnected ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Not connected</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isConnected && integration ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {integration.lastSyncAt && (
                        <>
                          <RefreshCw className="h-3 w-3 inline mr-1" />
                          Last sync: {integration.lastSyncAt instanceof Date
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
                    onClick={() => handleConnect(provider.id)}
                  >
                    <Plug className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reset button - faint at the bottom */}
      <div className="pt-8 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground/50 hover:text-muted-foreground"
          onClick={() => setResetDialogOpen(true)}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset integrations to default
        </Button>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={() => setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect the {disconnectTarget?.name} integration?
              Skills that require this integration will stop working until you reconnect.
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

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Integrations</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all integrations to their default demo state (ATS, Email, and Calendar connected).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fake OAuth Dialog */}
      <Dialog open={!!oauthDialogProvider} onOpenChange={() => !isAuthorizing && setOauthDialogProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {oauthDialogProvider && (() => {
                const Icon = providerIcons[oauthDialogProvider as IntegrationProvider];
                return <Icon className="h-6 w-6 text-primary" />;
              })()}
            </div>
            <DialogTitle>
              Connect to {availableProviders.find(p => p.id === oauthDialogProvider)?.name}
            </DialogTitle>
            <DialogDescription>
              Skilldex is requesting access to your {availableProviders.find(p => p.id === oauthDialogProvider)?.name} account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">This will allow Skilldex to:</p>
              <div className="space-y-2">
                {oauthDialogProvider === 'ats' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Read candidate profiles and applications
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Create and update candidates
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Move candidates through pipeline stages
                    </div>
                  </>
                )}
                {oauthDialogProvider === 'linkedin' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Search and view public profiles
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Access profile details and work history
                    </div>
                  </>
                )}
                {oauthDialogProvider === 'email' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Send emails on your behalf
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Read email templates
                    </div>
                  </>
                )}
                {oauthDialogProvider === 'calendar' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      View your calendar availability
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Create and manage interview events
                    </div>
                  </>
                )}
                {oauthDialogProvider === 'granola' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Read meeting notes and transcripts
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Sync notes to candidate profiles
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" defaultChecked disabled className="mt-0.5 h-4 w-4 rounded border-gray-300" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                By authorizing, you agree to Skilldex's Terms of Service and Privacy Policy
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleAuthorize}
              disabled={isAuthorizing}
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Authorize Skilldex
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setOauthDialogProvider(null)}
              disabled={isAuthorizing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
