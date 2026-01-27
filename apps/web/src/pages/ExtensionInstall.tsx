/**
 * Extension Install Page
 *
 * Authenticated page for installing the browser extension.
 * Part of the onboarding flow with sideloading instructions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Chrome,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  FolderOpen,
  ToggleRight,
  Package,
  Settings,
} from 'lucide-react';
import { onboarding } from '@/lib/api';
import { EXTENSION_VERSION, EXTENSION_MIN_CHROME_VERSION } from '@skillomatic/shared';

const steps = [
  {
    number: 1,
    title: 'Download the extension',
    description: 'Download the ZIP file containing the extension.',
    icon: Download,
  },
  {
    number: 2,
    title: 'Extract the ZIP file',
    description: 'Unzip the downloaded file to a folder on your computer (e.g., Desktop or Documents).',
    icon: FolderOpen,
  },
  {
    number: 3,
    title: 'Open Chrome Extensions',
    description: 'Go to chrome://extensions in your browser or click Menu > Extensions > Manage Extensions.',
    icon: Chrome,
    code: 'chrome://extensions',
  },
  {
    number: 4,
    title: 'Enable Developer Mode',
    description: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page.',
    icon: ToggleRight,
  },
  {
    number: 5,
    title: 'Load the extension',
    description: 'Click "Load unpacked" and select the folder you extracted in step 2.',
    icon: Package,
  },
  {
    number: 6,
    title: 'Configure the extension',
    description: 'Click the extension icon in Chrome, then enter your API URL and key from the Desktop Chat page.',
    icon: Settings,
  },
];

export default function ExtensionInstall() {
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [completedStep, setCompletedStep] = useState(false);

  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);
    try {
      await onboarding.completeStep('EXTENSION_INSTALLED');
      setCompletedStep(true);
    } catch (error) {
      console.error('Failed to mark extension step complete:', error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[hsl(220_30%_20%)] tracking-tight">
            Install Browser Extension
          </h1>
          <p className="text-[hsl(220_15%_50%)] mt-1">
            Enable web page extraction for your AI assistant
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Coming to Chrome Web Store
        </Badge>
      </div>

      {/* Download Card */}
      <Card className="card-robot rounded-xl overflow-hidden">
        <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl robot-button flex items-center justify-center">
              <Chrome className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="font-black tracking-wide text-[hsl(220_30%_20%)]">
                Skillomatic Scraper Extension
              </CardTitle>
              <p className="text-sm text-[hsl(220_15%_50%)]">
                Version {EXTENSION_VERSION} - Chrome {EXTENSION_MIN_CHROME_VERSION}+
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a href="/skillomatic-scraper.zip" download className="w-full sm:w-auto">
              <Button className="robot-button border-0 w-full sm:w-auto gap-2">
                <Download className="h-5 w-5" />
                Download Extension (ZIP)
              </Button>
            </a>
            <p className="text-sm text-[hsl(220_15%_50%)]">
              Manual installation required until Chrome Web Store approval
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card className="card-robot rounded-xl overflow-hidden">
        <CardHeader className="bg-[hsl(220_15%_92%)] border-b-2 border-[hsl(220_15%_82%)]">
          <CardTitle className="font-black tracking-wide text-[hsl(220_30%_20%)]">
            Installation Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-[hsl(220_15%_50%)]" />
                      <h3 className="font-bold text-[hsl(220_30%_20%)]">{step.title}</h3>
                    </div>
                    <p className="text-[hsl(220_15%_50%)]">{step.description}</p>
                    {step.code && (
                      <code className="mt-2 inline-block bg-[hsl(220_15%_95%)] px-3 py-1.5 rounded-lg text-sm font-mono text-[hsl(220_20%_40%)] border border-[hsl(220_15%_88%)]">
                        {step.code}
                      </code>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion */}
          <div className="mt-8 pt-6 border-t-2 border-[hsl(220_15%_90%)]">
            {completedStep ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div className="flex-1">
                  <p className="font-bold text-green-700">Extension step completed!</p>
                  <p className="text-sm text-green-600">You can continue with the next onboarding step.</p>
                </div>
                <Link to="/home">
                  <Button variant="outline" className="gap-2">
                    Back to Home
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[hsl(220_15%_50%)]">
                  Once you've installed and configured the extension, mark this step as complete.
                </p>
                <Button
                  onClick={handleMarkComplete}
                  disabled={isMarkingComplete}
                  className="robot-button border-0 gap-2"
                >
                  {isMarkingComplete ? (
                    'Saving...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Link */}
      <div className="text-center">
        <p className="text-sm text-[hsl(220_15%_50%)]">
          Need help?{' '}
          <Link to="/extension" className="text-primary hover:underline inline-flex items-center gap-1">
            View full documentation
            <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
