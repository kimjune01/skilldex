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
import { Copy, AlertCircle, CheckCircle2, RefreshCw, Monitor } from 'lucide-react';

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

  const getMcpConfig = (key: string) => JSON.stringify({
    mcpServers: {
      skillomatic: {
        command: "npx",
        args: ["@skillomatic/mcp"],
        env: {
          SKILLOMATIC_API_KEY: key,
          SKILLOMATIC_API_URL: window.location.origin
        }
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
            {/* Step 1: Install */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <span className="font-medium">Find your config file</span>
              </div>
              <div className="ml-8 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Claude Desktop:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </div>
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
              <div className="ml-8">
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre">
{getMcpConfig(activeKey.key)}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(getMcpConfig(activeKey.key), 'config')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied === 'config' ? 'Copied!' : 'Copy'}
                  </Button>
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
