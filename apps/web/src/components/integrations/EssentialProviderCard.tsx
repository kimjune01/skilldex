import type { IntegrationPublic } from '@skillomatic/shared';
import type { IntegrationAccessLevel } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw,
  ExternalLink,
  Clock,
  Shield,
  ShieldCheck,
  Lightbulb,
  Download,
} from 'lucide-react';
import { providerIcons, type ProviderConfig } from '@/lib/integrations';
import { getAppDownloadLink } from '@/lib/integrations';

interface EssentialProviderCardProps {
  provider: ProviderConfig;
  integration: IntegrationPublic | undefined;
  showBadge: boolean;
  isConnecting: boolean;
  updatingAccessLevel: string | null;
  onConnect: (provider: ProviderConfig) => void;
  onUpdateAccessLevel: (integrationId: string, level: IntegrationAccessLevel) => void;
  onShowSheetsInfo: () => void;
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

export function EssentialProviderCard({
  provider,
  integration,
  showBadge,
  isConnecting,
  updatingAccessLevel,
  onConnect,
  onUpdateAccessLevel,
  onShowSheetsInfo,
}: EssentialProviderCardProps) {
  const isConnected = integration?.status === 'connected';
  const Icon = providerIcons[provider.id] || Plug;

  return (
    <Card className={isConnected ? 'border-green-200 bg-green-50/30' : ''}>
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
                      onShowSheetsInfo();
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
            <div className="flex items-center justify-between">
              {getStatusBadge(integration.status)}
              {(() => {
                const downloadInfo = getAppDownloadLink(provider.id);
                if (!downloadInfo) return null;
                return (
                  <a
                    href={downloadInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    title={downloadInfo.isMobile ? `Download ${provider.name} app` : `Open ${provider.name}`}
                  >
                    {downloadInfo.isMobile ? (
                      <Download className="h-3.5 w-3.5" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    <span>{downloadInfo.label}</span>
                  </a>
                );
              })()}
            </div>
            {isConnected && (
              <div className="flex items-center justify-between pt-1">
                <Select
                  value={integration.accessLevel || 'read-write'}
                  onValueChange={(value) => onUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
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
              onClick={() => onConnect(provider)}
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
}
