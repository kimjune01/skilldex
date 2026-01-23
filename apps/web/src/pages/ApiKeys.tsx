import { useEffect, useState, useRef } from 'react';
import { apiKeys } from '../lib/api';
import type { ApiKeyPublic } from '@skillomatic/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Copy, AlertCircle, CheckCircle2, RefreshCw, Monitor, ChevronDown, Zap, Shield, Sparkles } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const hasAutoCreated = useRef(false);

  const loadKeys = async () => {
    try {
      const loadedKeys = await apiKeys.list();
      setKeys(loadedKeys);
      return loadedKeys;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createKey = async () => {
    setError('');
    setIsCreating(true);
    try {
      await apiKeys.create('Desktop Chat');
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setIsCreating(false);
    }
  };

  const regenerateKey = async () => {
    setError('');
    setIsCreating(true);
    try {
      // Revoke all existing keys
      for (const key of keys) {
        await apiKeys.revoke(key.id);
      }
      // Create new key
      await apiKeys.create('Desktop Chat');
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate key');
    } finally {
      setIsCreating(false);
      setShowRegenerateDialog(false);
    }
  };

  // Load keys and auto-create if none exist
  useEffect(() => {
    const init = async () => {
      const loadedKeys = await loadKeys();
      // Auto-create key if none exist (only once)
      if (loadedKeys.length === 0 && !hasAutoCreated.current) {
        hasAutoCreated.current = true;
        await createKey();
      }
    };
    init();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKey = keys[0]; // We only show one key now

  const [expandedApp, setExpandedApp] = useState<string | null>('claude');

  const mcpApps = [
    {
      id: 'claude',
      name: 'Claude Desktop',
      url: 'https://claude.ai/download',
      configPath: {
        mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
        windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
      },
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT Desktop',
      url: 'https://openai.com/chatgpt/desktop',
      configPath: {
        mac: '~/Library/Application Support/com.openai.chat/mcp.json',
        windows: '%APPDATA%\\com.openai.chat\\mcp.json',
      },
      note: 'Requires ChatGPT Plus subscription. Enable Developer Mode in settings first.',
    },
    {
      id: 'chatmcp',
      name: 'ChatMCP (Free)',
      url: 'https://chatmcp.com',
      configPath: {
        mac: '~/.chatmcp/mcp_config.json',
        windows: '%USERPROFILE%\\.chatmcp\\mcp_config.json',
      },
      note: 'Free, open-source MCP client.',
    },
    {
      id: 'deepchat',
      name: 'DeepChat (Free)',
      url: 'https://deepchat.dev',
      configPath: {
        mac: '~/Library/Application Support/DeepChat/mcp.json',
        windows: '%APPDATA%\\DeepChat\\mcp.json',
      },
      note: 'Free, cross-platform AI chat app.',
    },
  ];

  // API URL for MCP server (web is 5173, API is 3000 in dev)
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3000');

  const getMcpConfig = (key: string) => JSON.stringify({
    mcpServers: {
      skillomatic: {
        command: "npx",
        args: ["@skillomatic/mcp"],
        env: {
          SKILLOMATIC_API_KEY: key,
          SKILLOMATIC_API_URL: apiUrl
        }
      }
    }
  }, null, 2);

  const getMcpServerOnly = (key: string) => JSON.stringify({
    skillomatic: {
      command: "npx",
      args: ["@skillomatic/mcp"],
      env: {
        SKILLOMATIC_API_KEY: key,
        SKILLOMATIC_API_URL: apiUrl
      }
    }
  }, null, 2);

  if (isLoading || isCreating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {isCreating ? 'Setting up...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Desktop Chat</h1>
        <p className="text-muted-foreground mt-1">
          Use Skillomatic skills from Claude Desktop, ChatGPT, and other MCP-compatible apps
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Why Desktop Chat */}
      <Card className="bg-gradient-to-br from-primary/5 to-amber-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div>
            <h3 className="font-bold text-lg text-foreground mb-2">
              Why though?
            </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Desktop apps like Claude Desktop let you use Skillomatic right where you work:
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">No Tab Switching</p>
                    <p className="text-xs text-muted-foreground">Chat stays open while you work in your ATS, LinkedIn, email</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Use Your Own AI Account</p>
                    <p className="text-xs text-muted-foreground">No extra subscriptions—works with the Claude or ChatGPT you already have</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Works With Everything</p>
                    <p className="text-xs text-muted-foreground">Analyze resumes, scrape LinkedIn, draft emails—all in one flow</p>
                  </div>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>

      {/*
        =======================================================================
        MCP ONBOARDING: This UI shows the MCP server configuration that users
        copy to their Claude Desktop (or other MCP-compatible app).

        Onboarding is tracked server-side in /api/v1/me when the MCP server
        first connects and calls that endpoint to verify authentication.
        See: apps/api/src/routes/v1/me.ts

        When the MCP server connects (and org has desktopEnabled=true), the
        user's onboardingStep is advanced to DEPLOYMENT_CONFIGURED.
        =======================================================================
      */}
      {activeKey && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">MCP Server Setup</CardTitle>
                <CardDescription>
                  Add this configuration to connect Skillomatic to your chat app
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Choose your app */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <span className="font-medium">Choose your chat app</span>
              </div>
              <div className="ml-8 space-y-2">
                {mcpApps.map((app) => (
                  <Collapsible
                    key={app.id}
                    open={expandedApp === app.id}
                    onOpenChange={(open) => setExpandedApp(open ? app.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-3 text-left bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{app.name}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedApp === app.id ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 ml-6 space-y-2">
                      <div className="text-xs space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[50px]">macOS:</span>
                          <code className="bg-muted px-2 py-0.5 rounded break-all">{app.configPath.mac}</code>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground min-w-[50px]">Windows:</span>
                          <code className="bg-muted px-2 py-0.5 rounded break-all">{app.configPath.windows}</code>
                        </div>
                        {app.note && (
                          <p className="text-muted-foreground italic mt-1">{app.note}</p>
                        )}
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline mt-1"
                          >
                            Download {app.name} →
                          </a>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>

            {/* Step 2: Add config */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <span className="font-medium">Add this configuration</span>
              </div>
              <div className="ml-8 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {expandedApp === 'cline'
                    ? 'Add this server entry to your existing MCP servers:'
                    : 'If the file is empty or doesn\'t exist, use the full config. Otherwise, add just the server entry to your existing mcpServers object.'}
                </p>

                {expandedApp !== 'cline' && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Full config (for new files):</p>
                    <div className="relative">
                      <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getMcpConfig(activeKey.key)}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(getMcpConfig(activeKey.key), 'config-full')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copied === 'config-full' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {expandedApp === 'cline' ? 'Server entry:' : 'Server entry only (for existing files):'}
                  </p>
                  <div className="relative">
                    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getMcpServerOnly(activeKey.key)}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(getMcpServerOnly(activeKey.key), 'config-server')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copied === 'config-server' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Restart */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <span className="font-medium">Restart your chat app</span>
              </div>
              <p className="ml-8 text-sm text-muted-foreground">
                Quit and reopen the app to load the new configuration
              </p>
            </div>

            {/* Regenerate option */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">API Key:</span>{' '}
                  <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                    {activeKey.key.slice(0, 20)}...
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateDialog(true)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke your current key and create a new one. You'll need to update
              your chat app's configuration with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={regenerateKey}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
