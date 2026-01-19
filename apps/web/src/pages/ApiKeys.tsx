import { useEffect, useState } from 'react';
import { apiKeys } from '../lib/api';
import type { ApiKeyPublic, ApiKeyCreateResponse } from '@skilldex/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Copy, Key, Trash2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const loadKeys = () => {
    apiKeys
      .list()
      .then(setKeys)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-1">
          Generate API keys to authenticate your Claude Code skills
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {createdKey && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>API Key Created!</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">Copy this key and add it to your shell profile.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border rounded px-3 py-2 font-mono text-sm overflow-x-auto">
                {createdKey.key}
              </code>
              <Button
                size="sm"
                onClick={() => copyToClipboard(createdKey.key)}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied === 'new' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="mt-3 bg-white border rounded p-2 text-xs overflow-x-auto">
              export SKILLDEX_API_KEY="{createdKey.key}"
            </pre>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreatedKey(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Key</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4">
            <Input
              placeholder="Key name (optional)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Key className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your API Keys</CardTitle>
          <CardDescription>
            {keys.length} {keys.length === 1 ? 'key' : 'keys'} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {key.lastUsedAt && (
                        <Badge variant="secondary" className="text-xs">
                          Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded truncate max-w-md">
                        {key.key}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(key.key, key.id)}
                      >
                        <Copy className="h-4 w-4" />
                        {copied === key.id ? 'Copied!' : ''}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(key.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the API key "{revokeTarget?.name}"?
              This action cannot be undone and any skills using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
