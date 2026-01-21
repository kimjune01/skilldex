/**
 * For IT Page
 *
 * Landing page targeted at IT professionals addressing common B2B SaaS concerns:
 * - Data security and ephemerality
 * - Control and visibility
 * - Easy deployment and offboarding
 */
import { Link } from 'react-router-dom';
import {
  Bot,
  Shield,
  Eye,
  Trash2,
  Lock,
  Server,
  FileCheck,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Database,
  Key,
  Users,
  Activity,
  Unplug,
  ShieldCheck,
  HardDrive,
  CloudOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const securityFeatures = [
  {
    icon: Trash2,
    title: 'Ephemeral by Design',
    description:
      'We process data, we don\'t hoard it. Chat messages aren\'t stored. Candidate data passes through—never persists. When you disconnect, the data\'s gone.',
    highlight: 'Zero data retention',
  },
  {
    icon: Lock,
    title: 'Your Credentials, Your Control',
    description:
      'OAuth tokens are encrypted at rest with AES-256. We never see plaintext credentials. Revoke access anytime from your identity provider.',
    highlight: 'AES-256 encryption',
  },
  {
    icon: Eye,
    title: 'Full Audit Trail',
    description:
      'Every API call, every skill execution, every integration access—logged and exportable. Know exactly what happened and when.',
    highlight: 'Complete visibility',
  },
  {
    icon: Unplug,
    title: 'Clean Offboarding',
    description:
      'Delete a user, and their data goes with them. OAuth tokens revoked, API keys invalidated, audit logs retained per your policy. No zombie accounts.',
    highlight: 'One-click removal',
  },
];

const complianceItems = [
  { label: 'Minimal Data Collection', status: 'certified', icon: FileCheck },
  { label: 'User Data Deletion', status: 'available', icon: Trash2 },
  { label: 'SSO/SAML Support', status: 'roadmap', icon: Key },
  { label: 'Role-Based Access Control', status: 'available', icon: Users },
  { label: 'Audit Logs', status: 'available', icon: Activity },
  { label: 'Source Code Access', status: 'available', icon: ShieldCheck },
];

const dataFlowSteps = [
  {
    label: 'User Request',
    description: 'Recruiter asks to search candidates',
    icon: Users,
    data: 'Query text only',
  },
  {
    label: 'Skill Execution',
    description: 'Skillomatic calls your ATS API',
    icon: Activity,
    data: 'OAuth token (encrypted)',
  },
  {
    label: 'Data Transit',
    description: 'Results pass through to AI',
    icon: Server,
    data: 'TLS 1.3 in transit',
  },
  {
    label: 'Response',
    description: 'User sees results, we forget them',
    icon: Trash2,
    data: 'Not stored',
  },
];

const commonConcerns = [
  {
    question: 'Where does our ATS data go?',
    answer:
      'Nowhere permanent. We query your ATS via OAuth, pass results to the AI model for processing, and return the response. We don\'t store candidate data, search results, or chat history.',
  },
  {
    question: 'What happens when we offboard someone?',
    answer:
      'Admin deletes user → OAuth tokens are revoked → API keys are invalidated → User data is purged. The whole process is immediate and irreversible. No waiting, no support tickets.',
  },
  {
    question: 'Can you access our data without us knowing?',
    answer:
      'No. Every API call is logged in your audit trail. We don\'t have a "backdoor" to your ATS. OAuth scopes are minimal and visible. You can revoke access from your ATS admin panel anytime.',
  },
  {
    question: 'What if Skillomatic shuts down?',
    answer:
      'Your data isn\'t here to begin with. Disconnect your OAuth integrations, delete your API keys, and you\'re done. There\'s no data migration because we don\'t hold your data hostage.',
  },
  {
    question: 'How do we know you\'re actually ephemeral?',
    answer:
      'Request a source code audit—we\'ll give you full access to review the codebase yourself. We\'re happy to walk through our data flow with your security team. Skepticism is welcome—we built this for skeptics.',
  },
];

const antiPatterns = [
  { bad: 'Stores chat history indefinitely', good: 'Chat messages not persisted' },
  { bad: 'Syncs your entire ATS database', good: 'Query-based, on-demand access' },
  { bad: 'Requires admin credentials', good: 'Standard OAuth with minimal scopes' },
  { bad: 'Complex offboarding process', good: 'Delete user = delete everything' },
  { bad: 'Vendor lock-in with data export fees', good: 'Nothing to export—data doesn\'t live here' },
];

export default function ForIT() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-[hsl(220_15%_88%)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl robot-button flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg logo-text text-[hsl(220_30%_20%)]">Skillomatic</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/for-recruiters"
              className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
            >
              Use Cases
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-[hsl(220_20%_40%)] hover:text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg robot-button text-white text-sm font-bold tracking-wide border-0"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <Shield className="h-3 w-3 mr-1" />
              Built for Security Teams
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              The B2B SaaS That{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Doesn't Want Your Data
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Most recruiting tools sync your entire ATS and store everything forever. We don't.
              Skillomatic is ephemeral by design—we process requests, return results, and forget.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Security%20Audit%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20access%20to%20review%20the%20Skillomatic%20source%20code%20for%20a%20security%20audit."
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
              >
                Request Audit
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href="#architecture"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                View Architecture
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Anti-patterns Section */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-3">
              What We Don't Do
            </h2>
            <p className="text-[hsl(220_15%_45%)]">
              Common B2B SaaS patterns that create security headaches
            </p>
          </div>
          <div className="space-y-3">
            {antiPatterns.map((pattern, index) => (
              <div
                key={index}
                className="card-robot rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              >
                <div className="flex items-center gap-3 flex-1">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-[hsl(220_15%_45%)] line-through">{pattern.bad}</span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-[hsl(220_30%_20%)] font-semibold">{pattern.good}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Security That Doesn't Require Trust
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              We designed Skillomatic so you don't have to trust us. Verify everything.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-robot rounded-2xl p-6 stagger-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-[hsl(220_15%_45%)]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Flow Architecture */}
      <section id="architecture" className="py-20 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How Data Flows (And Doesn't Stay)
            </h2>
            <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
              A typical request lifecycle. Notice what's missing: persistent storage.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataFlowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative">
                  <div className="robot-display rounded-xl p-5 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="led-light led-cyan" />
                      <span className="text-xs font-mono text-cyan-400/60 uppercase tracking-wider">
                        Step {index + 1}
                      </span>
                    </div>
                    <Icon className="h-8 w-8 text-cyan-400 mb-3" />
                    <h3 className="text-white font-bold mb-1">{step.label}</h3>
                    <p className="text-[hsl(220_15%_55%)] text-sm mb-3">{step.description}</p>
                    <div className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded inline-block">
                      {step.data}
                    </div>
                  </div>
                  {index < dataFlowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-4 w-4 text-cyan-400/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CloudOff className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                No candidate data stored. No chat logs retained. No sync database.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Grid */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Compliance & Enterprise Features
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)]">
              Everything you need to pass security review
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {complianceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="card-robot rounded-xl p-4 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      item.status === 'certified'
                        ? 'bg-emerald-500'
                        : item.status === 'available'
                        ? 'bg-cyan-500'
                        : 'bg-[hsl(220_15%_88%)]'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        item.status === 'certified' || item.status === 'available' ? 'text-white' : 'text-[hsl(220_15%_50%)]'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-bold text-[hsl(220_30%_20%)]">{item.label}</div>
                    <div className="text-xs text-[hsl(220_15%_50%)] uppercase tracking-wider">
                      {item.status === 'certified' ? 'Yes' : item.status === 'available' ? 'Available' : 'Roadmap'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Questions Your Security Team Will Ask
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)]">
              We've been through enough security reviews to anticipate these
            </p>
          </div>

          <div className="space-y-4">
            {commonConcerns.map((item, index) => (
              <div key={index} className="card-robot rounded-xl p-6">
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-3 flex items-start gap-3">
                  <span className="text-primary">Q:</span>
                  {item.question}
                </h3>
                <p className="text-[hsl(220_15%_45%)] pl-6">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Technical Specifications
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-robot rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h3 className="font-black text-[hsl(220_30%_20%)]">Data Storage</h3>
              </div>
              <ul className="space-y-2 text-[hsl(220_15%_45%)] text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  User accounts & preferences only
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Encrypted OAuth tokens (AES-256-GCM)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Audit logs (configurable retention)
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  No candidate/applicant data
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  No chat messages or history
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  No ATS sync or mirror
                </li>
              </ul>
            </div>

            <div className="card-robot rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="h-6 w-6 text-primary" />
                <h3 className="font-black text-[hsl(220_30%_20%)]">Infrastructure</h3>
              </div>
              <ul className="space-y-2 text-[hsl(220_15%_45%)] text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  AWS US regions (configurable)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  TLS 1.3 for all connections
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  WAF and DDoS protection
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Serverless (no persistent instances)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Automated security patching
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  99.9% uptime SLA
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Want to See the Code?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Request an audit and I'll give you access to the source code.
            Review the architecture yourself—no NDA required.
          </p>
          <a
            href="mailto:email@skillomatic.technology?subject=Security%20Audit%20Request&body=Hi%2C%20I%27d%20like%20to%20request%20access%20to%20review%20the%20Skillomatic%20source%20code%20for%20a%20security%20audit."
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-600 font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Request Audit
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">SKILLOMATIC</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[hsl(220_15%_60%)]">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Docs
              </a>
            </div>
            <div className="text-sm text-[hsl(220_15%_50%)]">
              © 2025 Skillomatic. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
