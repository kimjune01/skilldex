import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Skillomatic
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-8">Last updated: January 2026</p>

        <div className="prose prose-slate max-w-none">
          <h2>Overview</h2>
          <p>
            Skillomatic ("we", "our", or "us") provides an automation platform that integrates with Claude and other AI assistants. This privacy policy explains how we collect, use, and protect your information when you use our web application and browser extension.
          </p>

          <h2>Information We Collect</h2>

          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Password (hashed, never stored in plain text)</li>
            <li>Organization affiliation</li>
          </ul>

          <h3>Usage Data</h3>
          <p>We collect information about how you use Skillomatic:</p>
          <ul>
            <li>Skills executed and their status (success/failure)</li>
            <li>Timestamps of skill executions</li>
            <li>API key usage statistics</li>
          </ul>

          <h3>Browser Extension</h3>
          <p>The Skillomatic Scraper browser extension:</p>
          <ul>
            <li><strong>Does NOT</strong> collect browsing history</li>
            <li><strong>Does NOT</strong> store login credentials for any website</li>
            <li><strong>Does NOT</strong> send data to third parties</li>
            <li><strong>Only</strong> accesses web pages when explicitly requested by your Claude Code skills</li>
            <li><strong>Only</strong> communicates with your configured Skillomatic API</li>
          </ul>
          <p>
            The extension uses your existing browser session to access pages you are already logged into. No credentials are captured or transmitted.
          </p>

          <h2>How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and maintain the Skillomatic service</li>
            <li>Authenticate your access to skills and APIs</li>
            <li>Display usage analytics in your dashboard</li>
            <li>Improve our services</li>
            <li>Communicate service updates (if opted in)</li>
          </ul>

          <h2>Data Storage and Security</h2>
          <ul>
            <li>All data is encrypted in transit (TLS/HTTPS)</li>
            <li>Passwords are hashed using industry-standard algorithms</li>
            <li>API keys are generated using cryptographically secure methods</li>
            <li>Database hosted on secure cloud infrastructure (AWS)</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li><strong>Integration providers:</strong> When you connect third-party services (e.g., Gmail, Stripe) via OAuth, we share necessary authentication tokens with those services as authorized by you.</li>
            <li><strong>Service providers:</strong> Infrastructure providers (AWS, Turso) who help us operate our services, bound by confidentiality agreements.</li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Export your data</li>
            <li>Revoke API keys at any time</li>
            <li>Disconnect integrations</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li>Account data is retained while your account is active</li>
            <li>Usage logs are retained for 90 days</li>
            <li>Deleted accounts are purged within 30 days</li>
          </ul>

          <h2>Cookies</h2>
          <p>
            We use essential cookies for authentication (JWT tokens stored in localStorage). We do not use tracking cookies or third-party analytics.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Skillomatic is not intended for users under 18 years of age. We do not knowingly collect information from children.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. We will notify users of significant changes via email or in-app notification.
          </p>

          <h2>Contact Us</h2>
          <p>
            For privacy-related questions or to exercise your rights, contact us at:{' '}
            <a href="mailto:privacy@skillomatic.technology" className="text-indigo-600 hover:underline">
              privacy@skillomatic.technology
            </a>
          </p>

          <h2>Web Scraping Disclaimer</h2>
          <p>
            The Skillomatic Scraper extension enables access to web pages using your own authenticated browser session. By using this feature, you acknowledge that:
          </p>
          <ul>
            <li>You are responsible for complying with each website's Terms of Service</li>
            <li>You will use scraped data only for legitimate business purposes</li>
            <li>Skillomatic does not store your credentials or bypass any authentication</li>
            <li>Excessive or automated scraping may violate some websites' policies</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Skillomatic. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link to="/extension" className="hover:text-slate-700">Browser Extension</Link>
          <Link to="/" className="hover:text-slate-700">Home</Link>
        </div>
      </footer>
    </div>
  );
}
