import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last updated: January 2026</p>

        <div className="prose prose-slate max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Skillomatic ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Skillomatic is a platform that provides AI-powered recruiting skills for use with Claude Code, Claude Desktop, and other MCP-compatible applications. The Service includes:
          </p>
          <ul>
            <li>A web dashboard for managing skills, integrations, and API keys</li>
            <li>An MCP server for connecting to desktop chat applications</li>
            <li>A browser extension for LinkedIn profile extraction</li>
            <li>Integration with third-party ATS and recruiting tools</li>
          </ul>

          <h2>3. Account Registration</h2>
          <p>
            To use the Service, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized account access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree NOT to use the Service to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Harvest or collect personal data without consent</li>
            <li>Violate the terms of service of third-party platforms (e.g., LinkedIn)</li>
            <li>Engage in discriminatory hiring practices</li>
            <li>Send spam or unsolicited communications</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>

          <h2>5. Third-Party Integrations</h2>
          <p>
            The Service integrates with third-party platforms including LinkedIn, various ATS systems, and AI providers. You acknowledge that:
          </p>
          <ul>
            <li>You must comply with the terms of service of all integrated platforms</li>
            <li>We are not responsible for the availability or functionality of third-party services</li>
            <li>Third-party services may have their own privacy policies and data practices</li>
            <li>OAuth connections grant us limited access as authorized by you</li>
          </ul>

          <h2>6. LinkedIn Usage</h2>
          <p>
            The browser extension allows extraction of LinkedIn profile data. By using this feature, you agree that:
          </p>
          <ul>
            <li>You will use LinkedIn data only for legitimate recruiting purposes</li>
            <li>You are responsible for compliance with LinkedIn's Terms of Service</li>
            <li>You will not engage in excessive automated scraping</li>
            <li>Skillomatic is not liable for any LinkedIn account restrictions resulting from your use</li>
          </ul>

          <h2>7. API Keys and Security</h2>
          <p>
            API keys provide access to the Service. You are responsible for:
          </p>
          <ul>
            <li>Keeping API keys confidential and secure</li>
            <li>Revoking compromised keys immediately</li>
            <li>All usage associated with your API keys</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            The Service, including its design, code, and documentation, is owned by Skillomatic. You retain ownership of your data. By using the Service, you grant us a limited license to process your data as necessary to provide the Service.
          </p>

          <h2>9. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>,
            which is incorporated into these Terms by reference.
          </p>

          <h2>10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SKILLOMATIC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Skillomatic from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or violation of any third-party rights.
          </p>

          <h2>13. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason. Upon termination, your right to use the Service ceases immediately.
          </p>

          <h2>14. Modifications</h2>
          <p>
            We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms. We will notify users of significant changes.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
          </p>

          <h2>16. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{' '}
            <a href="mailto:legal@skillomatic.technology" className="text-indigo-600 hover:underline">
              legal@skillomatic.technology
            </a>
          </p>
        </div>
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
