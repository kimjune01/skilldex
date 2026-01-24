/**
 * Integrations Landing Page
 *
 * Shows all supported ATS, email, calendar, and other integrations.
 * Addresses recruiter concerns about whether their specific tools are supported.
 */
import {
  Users,
  Mail,
  Calendar,
  Search,
  CheckCircle,
  ArrowRight,
  Play,
  Plug,
  Clock,
  Shield,
  RefreshCw,
  Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const integrationCategories = [
  {
    title: 'Applicant Tracking Systems',
    description: 'Search candidates, update pipelines, add new prospects—all from chat.',
    icon: Users,
    color: 'bg-emerald-500',
    integrations: [
      { name: 'Greenhouse', status: 'live', popular: true },
      { name: 'Lever', status: 'live', popular: true },
      { name: 'Ashby', status: 'live', popular: true },
      { name: 'Workday', status: 'live', popular: true },
      { name: 'BambooHR', status: 'live', popular: false },
      { name: 'SmartRecruiters', status: 'live', popular: false },
      { name: 'Jobvite', status: 'live', popular: false },
      { name: 'JazzHR', status: 'live', popular: false },
      { name: 'Breezy HR', status: 'live', popular: false },
      { name: 'Recruitee', status: 'live', popular: false },
      { name: 'Manatal', status: 'live', popular: false },
      { name: 'Recruiterflow', status: 'live', popular: false },
    ],
    capabilities: [
      'Search candidates by skills, experience, and tags',
      'Add new candidates with LinkedIn data',
      'Move candidates through pipeline stages',
      'Add notes and feedback',
      'View candidate history and activity',
    ],
  },
  {
    title: 'Email',
    description: 'Draft, review, and send recruiting emails without leaving the chat.',
    icon: Mail,
    color: 'bg-red-500',
    integrations: [
      { name: 'Gmail / Google Workspace', status: 'live', popular: true },
      { name: 'Microsoft Outlook', status: 'live', popular: true },
      { name: 'Microsoft 365', status: 'live', popular: false },
    ],
    capabilities: [
      'Draft personalized outreach emails',
      'Send emails directly (with your approval)',
      'Track who opened and responded',
      'Schedule follow-ups',
      'Search past email threads',
    ],
  },
  {
    title: 'Calendar & Scheduling',
    description: 'Check availability and book interviews without the back-and-forth.',
    icon: Calendar,
    color: 'bg-purple-500',
    integrations: [
      { name: 'Google Calendar', status: 'live', popular: true },
      { name: 'Microsoft Calendar', status: 'live', popular: true },
      { name: 'Calendly', status: 'live', popular: true },
    ],
    capabilities: [
      'Check interviewer availability',
      'Find overlapping free slots',
      'Hook up your calendar to book meetings',
      'Send scheduling links to candidates',
      'Handle timezone conversions',
    ],
  },
  {
    title: 'Sourcing',
    description: 'Find candidates across multiple platforms from one place.',
    icon: Search,
    color: 'bg-[#0A66C2]',
    integrations: [
      { name: 'LinkedIn (via extension)', status: 'live', popular: true },
      { name: 'LinkedIn Recruiter', status: 'live', popular: true },
      { name: 'LinkedIn Sales Navigator', status: 'live', popular: false },
    ],
    capabilities: [
      'Search profiles with natural language',
      'Bulk enrich profile data',
      'Draft personalized outreach',
      'Track connection request status',
      'Sync candidates to your ATS',
    ],
  },
  {
    title: 'Communication',
    description: 'Stay in the loop with your team without switching apps.',
    icon: Mail,
    color: 'bg-pink-500',
    integrations: [
      { name: 'Slack', status: 'live', popular: true },
      { name: 'Microsoft Teams', status: 'live', popular: true },
      { name: 'Discord', status: 'live', popular: false },
      { name: 'Google Chat', status: 'live', popular: false },
    ],
    capabilities: [
      'Get pipeline updates in your channels',
      'Receive candidate response notifications',
      'Share candidate profiles with hiring managers',
      'Get daily/weekly recruiting summaries',
    ],
  },
  {
    title: 'Video Conferencing',
    description: 'Create meeting links automatically when scheduling interviews.',
    icon: Video,
    color: 'bg-blue-500',
    integrations: [
      { name: 'Zoom', status: 'live', popular: true },
      { name: 'Google Meet', status: 'live', popular: true },
      { name: 'Microsoft Teams', status: 'live', popular: false },
    ],
    capabilities: [
      'Auto-generate meeting links',
      'Include links in calendar invites',
      'Set up recurring interview slots',
    ],
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'One-Click OAuth',
    description: 'Click "Connect" and sign in with your existing credentials. No API keys, no IT tickets.',
  },
  {
    step: '2',
    title: 'Minimal Permissions',
    description: 'We only request the access we need. You can see exactly what permissions are requested before granting.',
  },
  {
    step: '3',
    title: 'Instant Access',
    description: 'Start using the integration immediately. Ask Skillomatic to search your ATS or draft an email.',
  },
  {
    step: '4',
    title: 'Disconnect Anytime',
    description: 'One click to revoke access. You can also revoke from your ATS/email admin panel directly.',
  },
];

const securityPoints = [
  {
    title: 'OAuth 2.0 Standard',
    description: 'Industry-standard authentication. Your password never touches our servers.',
    icon: Shield,
  },
  {
    title: 'Encrypted at Rest',
    description: 'OAuth tokens are encrypted and managed via Nango. We never see plaintext credentials.',
    icon: RefreshCw,
  },
  {
    title: 'Minimal Scopes',
    description: 'We request only the permissions needed. Read-only where possible, write access only when required.',
    icon: CheckCircle,
  },
  {
    title: 'Easy Revocation',
    description: 'Disconnect from Skillomatic or revoke access directly from your tool\'s admin panel.',
    icon: Plug,
  },
];

export default function IntegrationsLanding() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <Plug className="h-3 w-3 mr-1" />
              500+ Integrations via Nango
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              All Your Tools,{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                One Conversation
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Connect your ATS, email, calendar, and sourcing tools in minutes.
              Then control them all from a single chat interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
              >
                Connect Your Tools
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#all-integrations"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                See All Integrations
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How Connection Works */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-3">
              Connect in Under 2 Minutes
            </h2>
            <p className="text-[hsl(220_15%_45%)]">No API keys to copy. No IT department needed.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="card-robot rounded-xl p-5 text-center">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-2">{item.title}</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Integrations */}
      <section id="all-integrations" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Supported Integrations
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Check if your tools are supported. Don't see something? Let us know.
            </p>
          </div>

          <div className="space-y-12">
            {integrationCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[hsl(220_30%_20%)]">{category.title}</h3>
                      <p className="text-sm text-[hsl(220_15%_50%)]">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Integrations list */}
                    <div className="card-robot rounded-xl p-5">
                      <h4 className="font-bold text-[hsl(220_30%_20%)] mb-4 text-sm uppercase tracking-wider">
                        Supported Tools
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.integrations.map((integration) => (
                          <div
                            key={integration.name}
                            className="flex items-center gap-2 text-sm"
                          >
                            {integration.status === 'live' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            )}
                            <span className={integration.status === 'live' ? 'text-[hsl(220_30%_25%)]' : 'text-[hsl(220_15%_50%)]'}>
                              {integration.name}
                            </span>
                            {integration.popular && (
                              <Badge className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-0">
                                Popular
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="card-robot rounded-xl p-5">
                      <h4 className="font-bold text-[hsl(220_30%_20%)] mb-4 text-sm uppercase tracking-wider">
                        What You Can Do
                      </h4>
                      <ul className="space-y-2">
                        {category.capabilities.map((capability, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_45%)]">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {capability}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <Shield className="h-3 w-3 mr-1" />
              Secure by Design
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Your Credentials Are Safe
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              We use OAuth so your passwords never touch our servers. Here's how we protect your access.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="card-robot rounded-xl p-5 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-[hsl(220_30%_20%)] mb-2">{point.title}</h3>
                  <p className="text-sm text-[hsl(220_15%_50%)]">{point.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/security"
              className="text-sm text-primary font-bold hover:underline inline-flex items-center gap-1"
            >
              Learn more about security
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Request Integration */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <Plug className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              500+ More Integrations Available
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              We use Nango for OAuth, which supports 500+ APIs across CRM, HRIS, accounting,
              project management, and more. If it has an API, we can likely connect to it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://nango.dev/docs/integrations/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                Browse All Integrations
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="mailto:email@skillomatic.technology?subject=Integration%20Request"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                Request a Specific Integration
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-emerald-500">
        <div className="max-w-4xl mx-auto text-center">
          <Plug className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Connect Your Tools?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Most recruiters are up and running in under 10 minutes.
            Connect your ATS, email, and calendar today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <a
              href="mailto:email@skillomatic.technology?subject=Demo%20Request"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <Play className="h-5 w-5" />
              Request Demo
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
