import { Link } from 'react-router-dom';
import type { IntegrationPublic } from '@skillomatic/shared';
import type { IntegrationAccessLevel } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plug,
  Unplug,
  RefreshCw,
  Clock,
  Shield,
  ShieldCheck,
  Lock,
  Sparkles,
  Timer,
} from 'lucide-react';
import { providerIcons, type ProviderConfig } from '@/lib/integrations';

interface OtherProviderCardProps {
  provider: ProviderConfig;
  integration: IntegrationPublic | undefined;
  blocked: boolean;
  isConnecting: boolean;
  updatingAccessLevel: string | null;
  onConnect: (provider: ProviderConfig) => void;
  onDisconnect: (id: string, name: string) => void;
  onUpdateAccessLevel: (integrationId: string, level: IntegrationAccessLevel) => void;
  variant?: 'default' | 'time-tracking';
}

function getStatusBadge(status: string) {
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
}

function getAccessLevelBadge(accessLevel?: string) {
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
}

export function OtherProviderCard({
  provider,
  integration,
  blocked,
  isConnecting,
  updatingAccessLevel,
  onConnect,
  onDisconnect,
  onUpdateAccessLevel,
  variant = 'default',
}: OtherProviderCardProps) {
  const isConnected = integration?.status === 'connected';
  const Icon = providerIcons[provider.id] || (variant === 'time-tracking' ? Timer : Plug);

  return (
    <Card
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
                onClick={() => onDisconnect(integration.id, provider.name)}
              >
                <Unplug className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Access level:</Label>
                <Select
                  value={integration.accessLevel || 'read-write'}
                  onValueChange={(value) => onUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
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
            {variant === 'time-tracking' && (
              <p className="text-xs text-muted-foreground text-center">
                Free time tracking.{' '}
                <a href="https://clockify.me/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Create account
                </a>
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => onConnect(provider)}
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
}
