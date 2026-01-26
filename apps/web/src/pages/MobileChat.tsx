import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, ExternalLink, CheckCircle2, ArrowRight, Globe, Monitor, Copy, RefreshCw } from 'lucide-react';
import { apiKeys } from '../lib/api';

export default function MobileChat() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // MCP endpoint URL
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3000');
  const mcpUrl = `${apiUrl}/mcp`;

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const keys = await apiKeys.list();
        if (keys.length > 0) {
          setApiKey(keys[0].key);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mobile Chat</h1>
        <p className="text-muted-foreground mt-1">
          Use Skillomatic skills from ChatGPT on your phone
        </p>
      </div>

      <Card className="bg-gradient-to-br from-emerald-500/5 to-primary/5 border-emerald-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Smartphone className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                ChatGPT Mobile + Skillomatic
              </h3>
              <p className="text-muted-foreground text-sm">
                Set up Skillomatic on ChatGPT web or desktop, then it automatically syncs to your mobile app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Setup Instructions</CardTitle>
              <CardDescription>
                Choose your setup method - both sync to mobile automatically
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="web" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="web" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                ChatGPT Web
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                ChatGPT Desktop
              </TabsTrigger>
            </TabsList>

            {/* Web Setup Tab */}
            <TabsContent value="web" className="space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <span className="font-medium">Enable Developer Mode</span>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Go to{' '}
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      chatgpt.com
                    </a>
                    {' '}and navigate to:
                  </p>
                  <code className="block bg-muted px-3 py-2 rounded-lg text-sm">
                    Settings → Connectors → Advanced → Enable Developer Mode
                  </code>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <span className="font-medium">Add Skillomatic connector</span>
                </div>
                <div className="ml-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    In Connectors settings, click "Create" and enter:
                  </p>
                  <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm font-medium">Skillomatic</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Connector URL</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono break-all">
                          {mcpUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyToClipboard(mcpUrl, 'mcp-url')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copied === 'mcp-url' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                    {apiKey && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Authentication</p>
                        <p className="text-sm">Bearer Token</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 bg-background px-3 py-2 rounded text-xs font-mono break-all">
                            {apiKey}
                          </code>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => copyToClipboard(apiKey, 'api-key')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copied === 'api-key' ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!apiKey && (
                    <p className="text-xs text-amber-600">
                      No API key found.{' '}
                      <Link to="/desktop-chat" className="underline">
                        Generate one first
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <span className="font-medium">Open ChatGPT mobile app</span>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sign in with the same account. Your connector syncs automatically.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://apps.apple.com/app/chatgpt/id6448311069"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      App Store
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.openai.chatgpt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Play Store
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Desktop Setup Tab */}
            <TabsContent value="desktop" className="space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </div>
                  <span className="font-medium">Set up ChatGPT Desktop</span>
                </div>
                <div className="ml-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Configure the Skillomatic MCP server on ChatGPT Desktop. Your connectors will automatically sync to mobile.
                  </p>
                  <Link
                    to="/desktop-chat"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Go to Desktop Chat setup
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    2
                  </div>
                  <span className="font-medium">Install ChatGPT mobile app</span>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Download the official ChatGPT app for your device:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://apps.apple.com/app/chatgpt/id6448311069"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      App Store (iOS)
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.openai.chatgpt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Play Store (Android)
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <span className="font-medium">Sign in and start chatting</span>
                </div>
                <div className="ml-8">
                  <p className="text-sm text-muted-foreground">
                    Sign in with the same account you used on desktop. Your Skillomatic connector syncs automatically — tap the <strong>+</strong> button in any chat to access your recruiting tools.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Requirements note */}
          <div className="pt-4 mt-6 border-t space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Requirements:</strong> ChatGPT Plus, Pro, or Team subscription required for MCP connectors.
            </p>
            <p className="text-sm">
              <a
                href="https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Official OpenAI documentation
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
