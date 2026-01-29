import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, ExternalLink, CheckCircle2, ArrowRight, Globe, Monitor, Copy, Shield } from 'lucide-react';
import { useState } from 'react';

export default function MobileChat() {
  const [copied, setCopied] = useState<string | null>(null);

  // MCP endpoint URL - separate service in production, API endpoint in dev
  const mcpUrl = import.meta.env.VITE_MCP_URL ||
    (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/mcp` :
    window.location.origin.replace(':5173', ':3000') + '/mcp');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mobile Chat</h1>
        <p className="text-muted-foreground mt-1">
          Use Skillomatic tools from ChatGPT on your phone
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
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Authentication</p>
                      <p className="text-sm font-medium">OAuth</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select "OAuth" or "Mixed" - you'll be redirected to sign in with your Skillomatic account
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    3
                  </div>
                  <span className="font-medium">Authorize and connect</span>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    After clicking "Create", you'll be redirected to Skillomatic to authorize the connection.
                    Click "Authorize" to grant ChatGPT access to your tools.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    4
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

              {/* Security note */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mt-4">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Secure OAuth connection</p>
                  <p>Your credentials are never shared with ChatGPT. You can revoke access anytime from your API Keys settings.</p>
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
                    Sign in with the same account you used on desktop. Your Skillomatic connector syncs automatically — tap the <strong>+</strong> button in any chat to access your tools.
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
