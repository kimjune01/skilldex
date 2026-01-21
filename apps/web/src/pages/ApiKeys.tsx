import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiKeys } from '../lib/api';
import type { ApiKeyPublic, ApiKeyCreateResponse } from '@skillomatic/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Copy, Key, Trash2, AlertCircle, CheckCircle2, RefreshCw, Monitor, ChevronDown, ChevronRight, Zap, ArrowRight } from 'lucide-react';

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);

  const loadKeys = () => {
    apiKeys
      .list()
      .then((loadedKeys) => {
        setKeys(loadedKeys);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load API keys');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const key = await apiKeys.create(newKeyName || undefined);
      setCreatedKey(key);
      setNewKeyName('');
      loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await apiKeys.revoke(revokeTarget.id);
      loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevokeTarget(null);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || 'new');
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  const hasKeys = keys.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Desktop Chat</h1>
        <p className="text-muted-foreground mt-1">
          Use Skillomatic skills from Claude Desktop, ChatGPT, and other chat apps
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Getting started - progressive disclosure */}
      {!hasKeys ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Two steps to use Skillomatic skills in your chat app
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Generate your API key</p>
                  <p className="text-sm text-muted-foreground">This authenticates your chat app with Skillomatic</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-sm font-medium shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Install a skill</p>
                  <p className="text-sm text-muted-foreground">Each skill has setup instructions for your specific chat app</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <form onSubmit={handleCreate} className="flex gap-3">
                <Input
                  placeholder="Device name (e.g., Work Laptop)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Next step: Install skills */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">API key ready</CardTitle>
                  <CardDescription>Now install skills to use in your chat app</CardDescription>
                </div>
                <Button asChild>
                  <Link to="/skills">
                    <Zap className="h-4 w-4 mr-2" />
                    Browse Skills
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Collapsible keys management */}
          <Collapsible open={keysOpen} onOpenChange={setKeysOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Key className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">API Keys</CardTitle>
                        <CardDescription>
                          {keys.length} {keys.length === 1 ? 'key' : 'keys'} active
                        </CardDescription>
                      </div>
                    </div>
                    {keysOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <form onSubmit={handleCreate} className="flex gap-2">
                    <Input
                      placeholder="Device name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">
                      <Key className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </form>

                  <div className="space-y-3">
                    {keys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{key.name}</span>
                            {key.lastUsedAt && (
                              <Badge variant="secondary" className="text-xs">
                                Last active: {new Date(key.lastUsedAt).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded truncate max-w-xs">
                              {key.key}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => copyToClipboard(key.key, key.id)}
                            >
                              <Copy className="h-3 w-3" />
                              {copied === key.id && <span className="ml-1 text-xs">Copied!</span>}
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}

      {/* Created key notification with MCP setup */}
      {createdKey && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">API Key Created!</CardTitle>
            </div>
            <CardDescription>
              Add this to your Claude Desktop configuration to connect Skillomatic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div>
              <label className="text-sm font-medium">Your API Key</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-white border rounded px-3 py-2 font-mono text-sm overflow-x-auto">
                  {createdKey.key}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(createdKey.key)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied === 'new' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* MCP Config */}
            <div>
              <label className="text-sm font-medium">Claude Desktop Config</label>
              <p className="text-xs text-muted-foreground mb-2">
                Add to ~/Library/Application Support/Claude/claude_desktop_config.json
              </p>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre">
{`{
  "mcpServers": {
    "skillomatic": {
      "command": "npx",
      "args": ["@skillomatic/mcp"],
      "env": {
        "SKILLOMATIC_API_KEY": "${createdKey.key}",
        "SKILLOMATIC_API_URL": "${window.location.origin}"
      }
    }
  }
}`}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(JSON.stringify({
                    mcpServers: {
                      skillomatic: {
                        command: "npx",
                        args: ["@skillomatic/mcp"],
                        env: {
                          SKILLOMATIC_API_KEY: createdKey.key,
                          SKILLOMATIC_API_URL: window.location.origin
                        }
                      }
                    }
                  }, null, 2), 'config')}
                >
                  <Copy className="h-3 w-3" />
                  {copied === 'config' && <span className="ml-1">Copied!</span>}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button asChild size="sm">
                <Link to="/skills">
                  <Zap className="h-4 w-4 mr-1" />
                  Browse Skills
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatedKey(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{revokeTarget?.name}"?
              Any skills using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
