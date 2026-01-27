import { useEffect, useState, useRef } from 'react';
import { apiKeys, onboarding } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { ONBOARDING_STEPS } from '@skillomatic/shared';
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
import { Copy, AlertCircle, CheckCircle2, RefreshCw, Zap, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApiKeys() {
  const { user, refreshUser } = useAuth();
  const [keys, setKeys] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const hasAutoCreated = useRef(false);
  const hasAdvancedOnboarding = useRef(false);

  // Auto-advance onboarding when user visits Desktop Chat page
  useEffect(() => {
    if (hasAdvancedOnboarding.current || !user) return;

    const step = user.onboardingStep;
    // If user is at GOOGLE_CONNECTED, advance to API_KEY_GENERATED
    if (step >= ONBOARDING_STEPS.GOOGLE_CONNECTED && step < ONBOARDING_STEPS.API_KEY_GENERATED) {
      hasAdvancedOnboarding.current = true;
      onboarding.completeStep('API_KEY_GENERATED').then(() => {
        refreshUser();
      }).catch(console.error);
    }
  }, [user, refreshUser]);

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

  const [selectedProvider, setSelectedProvider] = useState<string>('claude');

  // MCP endpoint URL - different in dev vs prod
  // In dev: localhost:3001 (standalone MCP server)
  // In prod: mcp.skillomatic.technology
  const isLocalDev = window.location.hostname === 'localhost';
  const mcpEndpoint = isLocalDev
    ? 'http://localhost:3001/mcp'
    : 'https://mcp.skillomatic.technology/mcp';

  // Claude Desktop config (uses mcp-remote bridge)
  const getClaudeConfig = (key: string) => {
    const args = [
      'mcp-remote',
      mcpEndpoint,
      '--header',
      `Authorization: Bearer ${key}`
    ];
    if (isLocalDev) {
      args.push('--allow-http');
    }
    return JSON.stringify({
      mcpServers: {
        skillomatic: {
          command: 'npx',
          args
        }
      }
    }, null, 2);
  };

  // ChatGPT config (direct HTTP - requires remote server)
  const getChatGPTConfig = (key: string) => {
    return JSON.stringify({
      mcpServers: {
        skillomatic: {
          url: isLocalDev ? 'https://mcp.skillomatic.technology/mcp' : mcpEndpoint,
          headers: {
            Authorization: `Bearer ${key}`
          }
        }
      }
    }, null, 2);
  };

  // Other apps config (generic mcp-remote)
  const getOtherConfig = (key: string) => {
    const args = [
      'mcp-remote',
      mcpEndpoint,
      '--header',
      `Authorization: Bearer ${key}`
    ];
    if (isLocalDev) {
      args.push('--allow-http');
    }
    return JSON.stringify({
      mcpServers: {
        skillomatic: {
          command: 'npx',
          args
        }
      }
    }, null, 2);
  };

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
                    <p className="text-sm font-medium">Works with resumes and PDFs</p>
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
                <CardTitle className="text-lg">Connect Your Chat App</CardTitle>
                <CardDescription>
                  Choose your app and follow the setup instructions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="claude" value={selectedProvider} onValueChange={setSelectedProvider}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="claude">Claude</TabsTrigger>
                <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
              </TabsList>

              {/* Claude Desktop Setup */}
              <TabsContent value="claude" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                      Download Claude Desktop
                    </h4>
                    <p className="text-sm text-muted-foreground ml-7">
                      <a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        claude.ai/download <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                      Open config file
                    </h4>
                    <div className="ml-7 text-sm space-y-1">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">macOS:</span>{' '}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Windows:</span>{' '}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">%APPDATA%\Claude\claude_desktop_config.json</code>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                      Paste this configuration
                    </h4>
                    <div className="ml-7 relative">
                      <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getClaudeConfig(activeKey.key)}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(getClaudeConfig(activeKey.key), 'claude-config')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copied === 'claude-config' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                      Restart Claude Desktop
                    </h4>
                    <p className="text-sm text-muted-foreground ml-7">
                      Quit and reopen Claude Desktop to load the configuration
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* ChatGPT Setup */}
              <TabsContent value="chatgpt" className="space-y-4">
                {isLocalDev && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      ChatGPT requires a remote server. The config below uses production URL since localhost won't work.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                      Requirements
                    </h4>
                    <ul className="text-sm text-muted-foreground ml-7 list-disc list-inside space-y-1">
                      <li>ChatGPT Plus, Pro, or Team subscription</li>
                      <li>ChatGPT Desktop app (mobile syncs automatically)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                      Enable Developer Mode
                    </h4>
                    <p className="text-sm text-muted-foreground ml-7">
                      Settings → Developer → Enable Developer Mode
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">3</span>
                      Add MCP Server
                    </h4>
                    <div className="ml-7 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Settings → Developer → Add MCP Server → "Add manually"
                      </p>
                      <div className="relative">
                        <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getChatGPTConfig(activeKey.key)}
                        </pre>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(getChatGPTConfig(activeKey.key), 'chatgpt-config')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copied === 'chatgpt-config' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">4</span>
                      Works on mobile too
                    </h4>
                    <p className="text-sm text-muted-foreground ml-7">
                      Once connected on desktop, Skillomatic syncs to ChatGPT mobile automatically
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Other Apps Setup */}
              <TabsContent value="other" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Most MCP-compatible apps use a JSON config file. Here's a generic configuration:
                  </p>

                  <div className="relative">
                    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getOtherConfig(activeKey.key)}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(getOtherConfig(activeKey.key), 'other-config')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copied === 'other-config' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Popular MCP Apps</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="font-medium">ChatMCP</span>
                          <span className="text-muted-foreground ml-2">Free, open-source</span>
                        </div>
                        <a href="https://chatmcp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          chatmcp.com <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="font-medium">DeepChat</span>
                          <span className="text-muted-foreground ml-2">Free, cross-platform</span>
                        </div>
                        <a href="https://deepchat.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          deepchat.dev <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="font-medium">Cursor</span>
                          <span className="text-muted-foreground ml-2">AI code editor</span>
                        </div>
                        <a href="https://cursor.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                          cursor.com <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Config file locations vary by app. Check your app's documentation for the exact path.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* API Key / Regenerate */}
            <div className="pt-4 mt-6 border-t">
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
