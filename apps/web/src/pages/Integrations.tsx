import { useEffect, useState } from 'react';
import { integrations } from '../lib/api';
import type { IntegrationPublic, IntegrationProvider } from '@skilldex/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Briefcase,
  Linkedin,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Plug,
  Unplug,
  RefreshCw,
  ExternalLink,
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

export default function Integrations() {
  const [integrationList, setIntegrationList] = useState<IntegrationPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);

  const loadIntegrations = () => {
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
  }, []);

  const handleConnect = async (provider: string) => {
    try {
      const result = await integrations.connect(provider);
      setOauthUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await integrations.disconnect(disconnectTarget.id);
      loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnectTarget(null);
    }
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
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
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
                          Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}
                        </>
                      )}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
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

      <Alert variant="warning">
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Integration connections are managed via Nango. In development mode, the ATS
          integration connects to a mock ATS server. LinkedIn lookup uses browser
          automation (linky-scraper-addon) and doesn't require OAuth.
        </AlertDescription>
      </Alert>

      {/* OAuth URL Dialog */}
      <Dialog open={!!oauthUrl} onOpenChange={() => setOauthUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Integration</DialogTitle>
            <DialogDescription>
              In production, you would be redirected to complete the OAuth flow.
              For development, here is the OAuth URL:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-3 rounded-md overflow-x-auto">
            <code className="text-sm font-mono break-all">{oauthUrl}</code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOauthUrl(null)}>
              Close
            </Button>
            <Button onClick={() => oauthUrl && window.open(oauthUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
