/**
 * Security Page
 *
 * Addresses concerns about data safety and privacy.
 * Written for non-technical users.
 */
import {
  Shield,
  Eye,
  Lock,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Key,
  Database,
  CloudOff,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const keyPoints = [
  {
    icon: Eye,
    title: 'Your Data Stays in Your Systems',
    description:
      'When your AI queries your CRM or sends an email, the action happens in your tools. We route the requests but don\'t store the content of your business data.',
    color: 'bg-blue-500',
  },
  {
    icon: Lock,
    title: 'OAuth, Not Passwords',
    description:
      'We use OAuth (the same "Sign in with Google" you see everywhere). Your passwords for CRM, email, and other tools never touch our servers.',
    color: 'bg-purple-500',
  },
  {
    icon: Trash2,
    title: 'Easy to Walk Away',
    description:
      'Delete your account and everything goes with it. Disconnect integrations anytime. We don\'t hold your data hostage because your data isn\'t here.',
    color: 'bg-red-500',
  },
  {
    icon: Shield,
    title: 'You Control Permissions',
    description:
      'Start with read-only access if you\'re cautious. Enable write access when you\'re ready. Revoke permissions anytime from your dashboard or your tools\' admin panels.',
    color: 'bg-emerald-500',
  },
];

const whatWeStore = [
  { item: 'Your email and name (for your account)', stored: true },
  { item: 'Which integrations you\'ve connected', stored: true },
  { item: 'Usage logs (when you used which tools)', stored: true },
  { item: 'OAuth tokens (encrypted)', stored: true },
  { item: 'Your CRM records or contacts', stored: false },
  { item: 'Your email contents', stored: false },
  { item: 'Your chat conversations', stored: false },
  { item: 'Documents or files from your tools', stored: false },
];

const faqItems = [
  {
    question: 'Can you see my business data?',
    answer:
      'We can see metadata (what tools you connect, what actions run) but not the content. Your CRM records, emails, and documents stay in your systems. We route requests but don\'t log the responses.',
  },
  {
    question: 'What if Skillomatic gets hacked?',
    answer:
      'Since we don\'t store your business data, there\'s nothing to steal. Attackers couldn\'t get your contacts or emails because we don\'t have them. OAuth tokens are encrypted and can be revoked instantly.',
  },
  {
    question: 'What happens when I delete my account?',
    answer:
      'We delete your user record, revoke all OAuth tokens, invalidate your API keys, and remove your usage logs. Since we never stored your business data, there\'s nothing else to delete.',
  },
  {
    question: 'Can my company audit your security?',
    answer:
      'Yes. Happy to walk through the architecture, share documentation, or answer technical questions. We\'d rather you verify our claims than take our word for it.',
  },
  {
    question: 'What about the AI? Does it remember my data?',
    answer:
      'Claude and ChatGPT don\'t retain conversation data between sessions. When you close the chat, the context is gone. Neither we nor the AI providers build a persistent profile of your data.',
  },
  {
    question: 'Is this compliant with GDPR/CCPA?',
    answer:
      'Since we don\'t store personal data from your systems, we\'re not creating new data controller relationships. You remain the controller of your data. That said, follow your organization\'s data policies.',
  },
];

const dataFlow = [
  {
    step: 1,
    title: 'You Ask Your AI',
    example: '"Add this lead to my CRM with notes from our call"',
    whatHappens: 'Your AI receives the request',
  },
  {
    step: 2,
    title: 'AI Calls Skillomatic',
    example: 'AI decides to use the CRM integration',
    whatHappens: 'We authenticate via OAuth and route the request to your CRM',
  },
  {
    step: 3,
    title: 'Action Happens in Your Tool',
    example: 'CRM creates the new lead record',
    whatHappens: 'Your CRM confirms success — we pass this back to the AI',
  },
  {
    step: 4,
    title: 'You Get Confirmation',
    example: '"Done! Added John Smith to your CRM pipeline"',
    whatHappens: 'AI confirms the action. We logged that a CRM action happened, not the data itself.',
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              <Shield className="h-3 w-3 mr-1" />
              Security & Privacy
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              Your Data Stays{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Yours
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              We connect your AI to your tools, but your business data stays in your systems.
              Here's exactly what we do and don't do with your information.
            </p>
          </div>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {keyPoints.map((point) => {
              const Icon = point.icon;
              return (
                <div key={point.title} className="card-robot rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${point.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[hsl(220_30%_20%)] mb-2">{point.title}</h3>
                      <p className="text-[hsl(220_15%_45%)]">{point.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Store */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Database className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              What We Store (And Don't)
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Complete transparency about what's in our database
            </p>
          </div>

          <div className="card-robot rounded-2xl overflow-hidden">
            <div className="divide-y divide-[hsl(220_15%_90%)]">
              {whatWeStore.map((item, index) => (
                <div key={index} className="flex items-center gap-4 px-6 py-4">
                  {item.stored ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  <span className={item.stored ? 'text-[hsl(220_30%_25%)]' : 'text-[hsl(220_15%_50%)] line-through'}>
                    {item.item}
                  </span>
                  <span className={`ml-auto text-xs font-bold ${item.stored ? 'text-emerald-600' : 'text-red-400'}`}>
                    {item.stored ? 'Stored' : 'NOT stored'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Data Flows */}
      <section className="py-20 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How Your Data Flows
            </h2>
            <p className="text-lg text-[hsl(220_15%_60%)] max-w-2xl mx-auto">
              A typical request, step by step
            </p>
          </div>

          <div className="space-y-4">
            {dataFlow.map((step) => (
              <div key={step.step} className="robot-display rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 md:w-48 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 font-bold text-sm">{step.step}</span>
                    </div>
                    <span className="text-white font-bold">{step.title}</span>
                  </div>
                  <div className="flex-1 md:border-l md:border-[hsl(220_20%_25%)] md:pl-4">
                    <div className="text-sm text-cyan-400/80 font-mono mb-1">{step.example}</div>
                    <div className="text-[hsl(220_15%_55%)] text-sm">{step.whatHappens}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CloudOff className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                End result: We helped you take action, but we don't have a copy of your data.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Security Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="card-robot rounded-xl p-6">
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-2">{item.question}</h3>
                <p className="text-[hsl(220_15%_45%)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 text-center relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <Key className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
              Questions About Security?
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto mb-6">
              Happy to walk through the architecture or answer specific questions on a call.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://cal.com/june-kim-mokzq0/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg robot-button text-white font-bold tracking-wide border-0"
              >
                <Calendar className="h-4 w-4" />
                Book a Call
              </a>
              <Link
                to="/faq"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide hover:bg-[hsl(220_15%_88%)] transition-colors"
              >
                More FAQs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
