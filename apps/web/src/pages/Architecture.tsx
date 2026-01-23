/**
 * Architecture Page
 *
 * Technical deep dive for IT professionals and security teams.
 * Covers stack, data flow, OAuth, and security implementation.
 */
import {
  Server,
  Database,
  Shield,
  Lock,
  ArrowRight,
  CheckCircle,
  Globe,
  Key,
  Layers,
  Terminal,
  Cpu,
  FileCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const techStack = [
  {
    layer: 'Frontend',
    icon: Globe,
    color: 'bg-blue-500',
    technologies: [
      { name: 'React 19', description: 'UI framework' },
      { name: 'Vite', description: 'Build tool' },
      { name: 'Tailwind CSS', description: 'Styling' },
      { name: 'TypeScript', description: 'Type safety' },
    ],
    hosting: 'CloudFront CDN',
  },
  {
    layer: 'API',
    icon: Server,
    color: 'bg-purple-500',
    technologies: [
      { name: 'Hono', description: 'Web framework' },
      { name: 'Node.js', description: 'Runtime' },
      { name: 'AWS Lambda', description: 'Serverless compute' },
      { name: 'API Gateway', description: 'Request routing' },
    ],
    hosting: 'AWS Lambda (us-west-2)',
  },
  {
    layer: 'Database',
    icon: Database,
    color: 'bg-emerald-500',
    technologies: [
      { name: 'SQLite / Turso', description: 'Primary database' },
      { name: 'Drizzle ORM', description: 'Database access' },
      { name: 'libSQL', description: 'Edge-compatible SQL' },
    ],
    hosting: 'Turso (edge-replicated)',
  },
  {
    layer: 'OAuth',
    icon: Key,
    color: 'bg-amber-500',
    technologies: [
      { name: 'Nango', description: 'OAuth orchestration' },
      { name: 'OAuth 2.0', description: 'Auth protocol' },
      { name: 'Encrypted tokens', description: 'At-rest encryption' },
    ],
    hosting: 'Nango Cloud',
  },
  {
    layer: 'AI',
    icon: Cpu,
    color: 'bg-pink-500',
    technologies: [
      { name: 'Anthropic Claude', description: 'Primary LLM' },
      { name: 'OpenAI', description: 'Fallback' },
      { name: 'Groq', description: 'Fast inference fallback' },
    ],
    hosting: 'Direct API calls',
  },
];

const dataFlowDetailed = [
  {
    step: 1,
    title: 'User Request',
    description: 'Recruiter types a natural language request in the chat interface',
    technical: 'HTTPS POST to /api/chat with user message',
    dataHandled: 'Query text only—no PII in request',
    storage: 'Not stored',
  },
  {
    step: 2,
    title: 'LLM Processing',
    description: 'Claude determines which tools/skills to invoke',
    technical: 'Anthropic API call with tool definitions',
    dataHandled: 'System prompt + user query',
    storage: 'Anthropic retention policy applies',
  },
  {
    step: 3,
    title: 'Tool Execution',
    description: 'Skillomatic executes the requested action (e.g., ATS search)',
    technical: 'OAuth token retrieved from Nango, API call made',
    dataHandled: 'OAuth token (encrypted), API request/response',
    storage: 'Request logged (no response body)',
  },
  {
    step: 4,
    title: 'Response Assembly',
    description: 'Results formatted and returned to user',
    technical: 'JSON response streamed to client',
    dataHandled: 'Tool results passed to LLM, response generated',
    storage: 'Not stored—ephemeral',
  },
];

const securityLayers = [
  {
    title: 'Transport Security',
    items: [
      'TLS 1.3 for all connections',
      'HSTS enabled',
      'Certificate pinning for OAuth providers',
    ],
    icon: Lock,
  },
  {
    title: 'Authentication',
    items: [
      'JWT-based session tokens',
      'Secure httpOnly cookies',
      'CSRF protection',
      'Rate limiting on auth endpoints',
    ],
    icon: Key,
  },
  {
    title: 'Authorization',
    items: [
      'Role-based access control (RBAC)',
      'Per-integration permission scopes',
      'Admin-configurable policies',
    ],
    icon: Shield,
  },
  {
    title: 'Data Protection',
    items: [
      'No PII storage by design',
      'OAuth tokens encrypted at rest',
      'Audit logging for all actions',
      'Automatic data expiration',
    ],
    icon: Database,
  },
];

const oauthFlow = [
  {
    step: '1',
    actor: 'User',
    action: 'Clicks "Connect" for an integration',
  },
  {
    step: '2',
    actor: 'Skillomatic',
    action: 'Requests connect session from Nango',
  },
  {
    step: '3',
    actor: 'Nango',
    action: 'Returns short-lived session token',
  },
  {
    step: '4',
    actor: 'User',
    action: 'Redirected to provider OAuth consent screen',
  },
  {
    step: '5',
    actor: 'Provider',
    action: 'User authorizes, redirect back with auth code',
  },
  {
    step: '6',
    actor: 'Nango',
    action: 'Exchanges code for tokens, stores encrypted',
  },
  {
    step: '7',
    actor: 'Skillomatic',
    action: 'Records connection in our DB (no tokens stored locally)',
  },
];

const apiEndpoints = [
  {
    category: 'Authentication',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'Initiate OAuth login' },
      { method: 'GET', path: '/api/auth/callback', description: 'OAuth callback handler' },
      { method: 'POST', path: '/api/auth/logout', description: 'End session' },
    ],
  },
  {
    category: 'Integrations',
    endpoints: [
      { method: 'GET', path: '/api/integrations', description: 'List user integrations' },
      { method: 'POST', path: '/api/integrations/connect', description: 'Start OAuth flow' },
      { method: 'DELETE', path: '/api/integrations/:id', description: 'Revoke integration' },
    ],
  },
  {
    category: 'Skills (MCP)',
    endpoints: [
      { method: 'GET', path: '/api/v1/tools', description: 'List available tools' },
      { method: 'POST', path: '/api/v1/tools/:name', description: 'Execute tool' },
    ],
  },
  {
    category: 'Admin',
    endpoints: [
      { method: 'GET', path: '/api/admin/users', description: 'List organization users' },
      { method: 'DELETE', path: '/api/admin/users/:id', description: 'Delete user (full cleanup)' },
      { method: 'GET', path: '/api/admin/usage', description: 'Usage analytics' },
    ],
  },
];

export default function Architecture() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
              <Layers className="h-3 w-3 mr-1" />
              Technical Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              System{' '}
              <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                Architecture
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              A technical deep dive into how Skillomatic is built, how data flows,
              and how we've designed for security and ephemerality.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Technology Stack
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Modern, serverless architecture with minimal attack surface
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.layer} className="card-robot rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg ${layer.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-[hsl(220_30%_20%)]">{layer.layer}</h3>
                      <p className="text-xs text-[hsl(220_15%_50%)]">{layer.hosting}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {layer.technologies.map((tech) => (
                      <li key={tech.name} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[hsl(220_30%_25%)]">{tech.name}</span>
                        <span className="text-[hsl(220_15%_50%)]">{tech.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Request Lifecycle
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              How data flows through the system—and what doesn't get stored
            </p>
          </div>

          <div className="space-y-4">
            {dataFlowDetailed.map((step) => (
              <div key={step.step} className="card-robot rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[hsl(220_30%_20%)]">{step.title}</h3>
                    </div>
                  </div>
                  <div className="flex-1 grid md:grid-cols-3 gap-4 lg:border-l lg:border-[hsl(220_15%_90%)] lg:pl-4">
                    <div>
                      <p className="text-xs text-[hsl(220_15%_50%)] mb-1 uppercase tracking-wider">Description</p>
                      <p className="text-sm text-[hsl(220_15%_40%)]">{step.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(220_15%_50%)] mb-1 uppercase tracking-wider">Technical</p>
                      <p className="text-sm font-mono text-[hsl(220_15%_40%)]">{step.technical}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(220_15%_50%)] mb-1 uppercase tracking-wider">Storage</p>
                      <p className="text-sm font-semibold text-emerald-600">{step.storage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="py-20 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Security Architecture
            </h2>
            <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
              Defense in depth across all layers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div key={layer.title} className="robot-display rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h3 className="font-bold text-white">{layer.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {layer.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_60%)]">
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OAuth Flow */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
              <Key className="h-3 w-3 mr-1" />
              OAuth Implementation
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              OAuth 2.0 Flow via Nango
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              We never see or store your OAuth tokens directly—Nango handles that
            </p>
          </div>

          <div className="card-robot rounded-2xl p-6 md:p-8">
            <div className="space-y-4">
              {oauthFlow.map((step) => (
                <div key={step.step} className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-600 font-bold text-sm">{step.step}</span>
                  </div>
                  <div className="flex-1 pb-4 border-b border-[hsl(220_15%_92%)] last:border-0">
                    <span className="text-xs font-bold text-[hsl(220_15%_50%)] uppercase tracking-wider">
                      {step.actor}
                    </span>
                    <p className="text-[hsl(220_30%_25%)]">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-sm text-emerald-700">
                <strong>Key point:</strong> OAuth tokens are stored encrypted in Nango's infrastructure,
                not in our database. We only store a reference to the connection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <Terminal className="h-3 w-3 mr-1" />
              API Reference
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              API Endpoints
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Overview of the main API surface
            </p>
          </div>

          <div className="space-y-8">
            {apiEndpoints.map((category) => (
              <div key={category.category}>
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-4">{category.category}</h3>
                <div className="card-robot rounded-xl overflow-hidden">
                  <div className="divide-y divide-[hsl(220_15%_92%)]">
                    {category.endpoints.map((endpoint) => (
                      <div key={endpoint.path} className="p-4 flex items-center gap-4">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          endpoint.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-[hsl(220_30%_25%)]">{endpoint.path}</code>
                        <span className="text-sm text-[hsl(220_15%_50%)] ml-auto">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Source Code CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <FileCode className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              Want to See the Source?
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              We offer full source code access for security audits.
              Review the implementation yourself—no NDA required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Source%20Code%20Audit%20Request"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                Request Source Access
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/for-it"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                Back to IT Overview
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
