import { ArrowLeft, Download, Chrome, Shield, Zap, Settings } from 'lucide-react';
import { EXTENSION_VERSION, EXTENSION_MIN_CHROME_VERSION } from '@skillomatic/shared';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { apiKeys } from '@/lib/api';

export default function Extension() {
  const extensionZipUrl = '/skillomatic-scraper.zip';
  const { user } = useAuth();
  const [extensionApiKey, setExtensionApiKey] = useState<string | null>(null);

  // Fetch API key for extension auto-config (only for logged-in users)
  useEffect(() => {
    if (!user) return;

    apiKeys.list().then(keys => {
      if (keys.length > 0) {
        setExtensionApiKey(keys[0].key);
      }
    }).catch(() => {
      // Ignore errors - extension config is optional
    });
  }, [user]);

  // API URL for the extension
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3000');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hidden element for browser extension auto-config (logged-in users only) */}
      {extensionApiKey && (
        <div
          id="skillomatic-extension-config"
          data-api-url={apiUrl}
          data-api-key={extensionApiKey}
          data-redirect-url="/home"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Skillomatic
          </Link>
          <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
            Privacy Policy
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6">
            <Chrome className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Skillomatic Scraper Extension
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Browser companion that lets your AI assistant read web pages using your authenticated session.
          </p>
        </div>

        {/* Download Card */}
        <Card className="mb-12 border-2 border-indigo-100">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Install the Extension</h2>
            <p className="text-slate-600 mb-6">
              Download and install in Chrome Developer Mode
            </p>
            <a href={extensionZipUrl} download>
              <Button size="lg" className="gap-2">
                <Download className="h-5 w-5" />
                Download Extension (ZIP)
              </Button>
            </a>
            <p className="text-sm text-slate-500 mt-4">
              Version {EXTENSION_VERSION} • Chrome {EXTENSION_MIN_CHROME_VERSION}+
            </p>
          </CardContent>
        </Card>

        {/* Installation Steps */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Installation Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium">Download and extract</h3>
                <p className="text-slate-600">Download the ZIP file above and extract it to a folder on your computer.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium">Open Chrome Extensions</h3>
                <p className="text-slate-600">
                  Navigate to <code className="bg-slate-100 px-2 py-0.5 rounded">chrome://extensions</code> in your browser.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium">Enable Developer Mode</h3>
                <p className="text-slate-600">Toggle "Developer mode" in the top right corner of the extensions page.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-medium">Load the extension</h3>
                <p className="text-slate-600">Click "Load unpacked" and select the extracted folder.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                5
              </div>
              <div>
                <h3 className="font-medium">Configure your API key</h3>
                <p className="text-slate-600">
                  Click the extension icon, enter your Skillomatic API URL and key from the{' '}
                  <Link to="/desktop-chat" className="text-indigo-600 hover:underline">Desktop Chat page</Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Real-time Tasks</h3>
              <p className="text-sm text-slate-600">
                Connects via WebSocket to receive scrape tasks instantly from your Claude Code skills.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Your Session</h3>
              <p className="text-sm text-slate-600">
                Uses your existing browser session - no credentials stored or shared.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-indigo-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Rate Limited</h3>
              <p className="text-sm text-slate-600">
                Built-in throttling between requests for polite, responsible scraping.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">What websites does the extension access?</h3>
              <p className="text-slate-600 text-sm">
                The extension can access any website you request through Skillomatic. It uses your existing browser session, so it can only see pages you're already authorized to view. Sensitive domains (login pages, password managers) are blocked.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Is my data safe?</h3>
              <p className="text-slate-600 text-sm">
                Yes. The extension only communicates with your configured Skillomatic API. No data is sent to third parties. See our <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> for details.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">How does authentication work?</h3>
              <p className="text-slate-600 text-sm">
                The extension opens pages in background tabs using your existing browser session. If you're logged into a website, the extension can access pages you have permission to view — no extra credentials needed.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Why isn't this in the Chrome Web Store?</h3>
              <p className="text-slate-600 text-sm">
                We're working on Chrome Web Store approval. For now, developer mode installation works perfectly and gives you the same functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillomatic. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link to="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
          <Link to="/" className="hover:text-slate-700">Home</Link>
        </div>
      </footer>
    </div>
  );
}
