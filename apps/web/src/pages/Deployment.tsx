/**
 * Deployment & Administration Page
 *
 * Guide for IT admins on rolling out Skillomatic to their organization.
 * Covers user management, permissions, onboarding, and offboarding.
 */
import {
  Users,
  UserMinus,
  Settings,
  Shield,
  Key,
  CheckCircle,
  ArrowRight,
  Clock,
  Eye,
  Lock,
  Activity,
  Mail,
  AlertTriangle,
  Plug,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const deploymentSteps = [
  {
    step: '1',
    title: 'Create Your Organization',
    description: 'Sign up and create your organization. You\'ll be the first admin.',
    time: '2 minutes',
    details: [
      'OAuth sign-in with Google or email/password',
      'Organization name and basic settings',
      'Automatic admin role assignment',
    ],
  },
  {
    step: '2',
    title: 'Connect Integrations',
    description: 'Link your ATS, email, and calendar systems.',
    time: '5 minutes',
    details: [
      'One-click OAuth for each integration',
      'Choose which integrations are available to users',
      'Set default permission levels (read-only vs. full)',
    ],
  },
  {
    step: '3',
    title: 'Invite Your Team',
    description: 'Send email invites to recruiters. They click a link to join.',
    time: '1 minute per user',
    details: [
      'Bulk invite via CSV or one-by-one',
      'Assign roles during invite',
      'Users inherit organization integrations',
    ],
  },
  {
    step: '4',
    title: 'Deploy Browser Extension',
    description: 'Distribute the Chrome extension for LinkedIn features.',
    time: 'Varies',
    details: [
      'Chrome Web Store link for self-install',
      'Or push via Chrome Enterprise policies',
      'Extension auto-connects to user accounts',
    ],
  },
];

const roles = [
  {
    name: 'User',
    description: 'Standard recruiter access',
    permissions: [
      'Use chat interface',
      'Access enabled integrations',
      'View own usage history',
    ],
    cannotDo: [
      'Invite other users',
      'Change organization settings',
      'Access admin dashboard',
    ],
    color: 'bg-blue-500',
  },
  {
    name: 'Admin',
    description: 'Organization administrator',
    permissions: [
      'Everything a User can do',
      'Invite and remove users',
      'Manage integration connections',
      'View all usage logs',
      'Configure permission policies',
    ],
    cannotDo: [
      'Access super-admin features',
      'Modify other organizations',
    ],
    color: 'bg-purple-500',
  },
  {
    name: 'Super Admin',
    description: 'Platform-level access (Skillomatic staff only)',
    permissions: [
      'Everything an Admin can do',
      'Manage all organizations',
      'Platform-wide settings',
    ],
    cannotDo: [],
    color: 'bg-red-500',
  },
];

const offboardingSteps = [
  {
    step: '1',
    title: 'Admin Deletes User',
    description: 'Click "Remove" next to the user in the admin dashboard',
    icon: UserMinus,
  },
  {
    step: '2',
    title: 'OAuth Tokens Revoked',
    description: 'All integration tokens for that user are invalidated via Nango',
    icon: Key,
  },
  {
    step: '3',
    title: 'API Keys Invalidated',
    description: 'Any API keys the user created are deactivated',
    icon: Lock,
  },
  {
    step: '4',
    title: 'User Data Deleted',
    description: 'Account, preferences, and usage logs removed from our database',
    icon: UserMinus,
  },
  {
    step: '5',
    title: 'Confirmation',
    description: 'Admin receives confirmation. User can no longer access Skillomatic.',
    icon: CheckCircle,
  },
];

const adminFeatures = [
  {
    title: 'Usage Dashboard',
    description: 'See who\'s using what, when. Track skill executions, API calls, and integration usage.',
    icon: Activity,
    available: true,
  },
  {
    title: 'User Management',
    description: 'Invite users, assign roles, and remove access. Bulk operations supported.',
    icon: Users,
    available: true,
  },
  {
    title: 'Integration Control',
    description: 'Choose which integrations are available to your organization.',
    icon: Plug,
    available: true,
  },
  {
    title: 'Permission Policies',
    description: 'Set read-only vs. write access at the organization level.',
    icon: Shield,
    available: true,
  },
  {
    title: 'Audit Logs',
    description: 'Detailed logs of all actions for compliance and security review.',
    icon: Eye,
    available: true,
  },
  {
    title: 'SSO/SAML',
    description: 'Single sign-on integration with your identity provider.',
    icon: Key,
    available: false,
    roadmap: true,
  },
];

const extensionDeployment = [
  {
    method: 'Self-Install',
    description: 'Users install from Chrome Web Store themselves',
    pros: ['No IT involvement needed', 'Users can update independently'],
    cons: ['Relies on user action', 'No central control'],
    icon: Download,
  },
  {
    method: 'Chrome Enterprise',
    description: 'Push to managed Chrome browsers via group policy',
    pros: ['Automatic deployment', 'Central control', 'Force install'],
    cons: ['Requires Chrome Enterprise', 'IT setup required'],
    icon: Settings,
  },
];

export default function Deployment() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
              <Settings className="h-3 w-3 mr-1" />
              IT Administration
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              Deployment &{' '}
              <span className="bg-gradient-to-r from-purple-500 to-primary bg-clip-text text-transparent">
                Administration
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Everything you need to roll out Skillomatic to your recruiting team.
              User management, permissions, onboarding, and offboarding.
            </p>
          </div>
        </div>
      </section>

      {/* Deployment Steps */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Getting Started
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Most organizations are fully deployed in under 30 minutes
            </p>
          </div>

          <div className="space-y-6">
            {deploymentSteps.map((step) => (
              <div key={step.step} className="card-robot rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[hsl(220_30%_20%)]">{step.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-[hsl(220_15%_50%)]">
                        <Clock className="h-3 w-3" />
                        {step.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 md:border-l md:border-[hsl(220_15%_90%)] md:pl-4">
                    <p className="text-[hsl(220_15%_45%)] mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_50%)]">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles & Permissions */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <Shield className="h-3 w-3 mr-1" />
              Access Control
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Roles & Permissions
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Role-based access control to match your organization's needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.name} className="card-robot rounded-2xl p-6">
                <div className={`h-12 w-12 rounded-xl ${role.color} flex items-center justify-center mb-4`}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-[hsl(220_30%_20%)] mb-1">{role.name}</h3>
                <p className="text-sm text-[hsl(220_15%_50%)] mb-4">{role.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">Can do</p>
                  <ul className="space-y-1">
                    {role.permissions.map((perm, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_45%)]">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>

                {role.cannotDo.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">Cannot do</p>
                    <ul className="space-y-1">
                      {role.cannotDo.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_50%)]">
                          <Lock className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Features */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Admin Dashboard Features
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Tools for managing your organization
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-robot rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      feature.available ? 'bg-primary' : 'bg-[hsl(220_15%_88%)]'
                    }`}>
                      <Icon className={`h-5 w-5 ${feature.available ? 'text-white' : 'text-[hsl(220_15%_50%)]'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[hsl(220_30%_20%)]">{feature.title}</h3>
                        {feature.roadmap && (
                          <Badge className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-600 border-0">
                            Roadmap
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[hsl(220_15%_50%)]">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Offboarding */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-500/10 text-red-600 border-red-500/20 font-bold">
              <UserMinus className="h-3 w-3 mr-1" />
              User Offboarding
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Clean Offboarding
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              When someone leaves, their data leaves with them. No zombie accounts.
            </p>
          </div>

          <div className="card-robot rounded-2xl p-6 md:p-8">
            <div className="flex flex-wrap justify-center gap-4 md:gap-2">
              {offboardingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="flex items-center gap-2">
                    <div className="flex flex-col items-center text-center w-32">
                      <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                        <Icon className="h-6 w-6 text-red-500" />
                      </div>
                      <h4 className="font-bold text-[hsl(220_30%_20%)] text-sm mb-1">{step.title}</h4>
                      <p className="text-xs text-[hsl(220_15%_50%)]">{step.description}</p>
                    </div>
                    {index < offboardingSteps.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-[hsl(220_15%_80%)] hidden md:block" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-sm text-emerald-700 text-center">
                <strong>Important:</strong> Since we don't store candidate data, there's nothing else to delete.
                The user's access is fully revoked and their footprint is removed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Deployment */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Browser Extension Deployment
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Two options for rolling out the LinkedIn extension
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {extensionDeployment.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.method} className="card-robot rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-black text-[hsl(220_30%_20%)]">{option.method}</h3>
                  </div>
                  <p className="text-[hsl(220_15%_45%)] mb-4">{option.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">Pros</p>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_45%)]">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">Cons</p>
                      <ul className="space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-[hsl(220_15%_45%)]">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            {con}
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

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              Need Help with Deployment?
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              We offer white-glove onboarding for enterprise customers.
              Let us handle the setup while you focus on recruiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:email@skillomatic.technology?subject=Enterprise%20Onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                Request Onboarding Help
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
