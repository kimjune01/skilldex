import type { IntegrationPublic } from '@skillomatic/shared';
import type { IntegrationAccessLevel } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plug,
  ExternalLink,
  Shield,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { providerIcons, type GoogleWorkspaceTool } from '@/lib/integrations';
import { getAppDownloadLink } from '@/lib/integrations';

interface GoogleWorkspaceToolRowProps {
  tool: GoogleWorkspaceTool;
  integration: IntegrationPublic | undefined;
  hasAnyGoogle: boolean;
  isConnecting: boolean;
  enablingTool: string | null;
  updatingAccessLevel: string | null;
  onEnable: (toolId: string, toolName: string) => void;
  onDisconnect: (integrationId: string, name: string) => void;
  onUpdateAccessLevel: (integrationId: string, level: IntegrationAccessLevel) => void;
}

export function GoogleWorkspaceToolRow({
  tool,
  integration,
  hasAnyGoogle,
  isConnecting,
  enablingTool,
  updatingAccessLevel,
  onEnable,
  onDisconnect,
  onUpdateAccessLevel,
}: GoogleWorkspaceToolRowProps) {
  const isConnected = integration?.status === 'connected';
  const Icon = providerIcons[tool.id] || Plug;
  const isEnabling = enablingTool === tool.id;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
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
        {/* App download/open link */}
        {(() => {
          const downloadInfo = getAppDownloadLink(tool.id);
          if (!downloadInfo) return null;
          return (
            <a
              href={downloadInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              title={downloadInfo.isMobile ? `Download ${tool.name} app` : `Open ${tool.name}`}
            >
              {downloadInfo.isMobile ? (
                <Download className="h-3.5 w-3.5" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{downloadInfo.label}</span>
            </a>
          );
        })()}
        {/* Access level dropdown - only show when connected */}
        {isConnected && integration && (
          <Select
            value={integration.accessLevel || 'read-write'}
            onValueChange={(value) => onUpdateAccessLevel(integration.id, value as IntegrationAccessLevel)}
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
              onEnable(tool.id, tool.name);
            } else if (integration) {
              onDisconnect(integration.id, tool.name);
            }
          }}
        />
      </div>
    </div>
  );
}
