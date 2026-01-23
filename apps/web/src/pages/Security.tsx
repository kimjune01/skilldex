/**
 * Security Page
 *
 * Addresses recruiter concerns about data safety, candidate privacy,
 * and what happens to their information. Written for non-technical users.
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
  UserX,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const keyPoints = [
  {
    icon: Eye,
    title: 'We Don\'t Store Candidate Data',
    description:
      'When you search your ATS or LinkedIn, the results pass through our servers to give you an answer—then we forget them. We don\'t build a database of your candidates.',
    color: 'bg-blue-500',
  },
  {
    icon: Lock,
    title: 'Your Passwords Stay With You',
    description:
      'We use OAuth (the same "Sign in with Google" you see everywhere). Your ATS password, email password, and LinkedIn login never touch our servers.',
    color: 'bg-purple-500',
  },
  {
    icon: Trash2,
    title: 'Easy to Walk Away',
    description:
      'Delete your account and everything goes with it. We don\'t hold your data hostage. There\'s no export fee because there\'s nothing to export—your data isn\'t here.',
    color: 'bg-red-500',
  },
  {
    icon: Shield,
    title: 'You Control What We Can Do',
    description:
      'Start with read-only access if you\'re cautious. Enable write access when you\'re ready. You can always revoke permissions from your ATS or email admin panel.',
    color: 'bg-emerald-500',
  },
];

const whatWeStore = [
  { item: 'Your email and name (for your account)', stored: true },
  { item: 'Which integrations you\'ve connected', stored: true },
  { item: 'API usage logs (when you used which skill)', stored: true },
  { item: 'OAuth tokens (encrypted, via Nango)', stored: true },
  { item: 'Candidate names, emails, or resumes', stored: false },
  { item: 'Your chat conversations', stored: false },
  { item: 'LinkedIn search results', stored: false },
  { item: 'ATS candidate data', stored: false },
  { item: 'Email contents', stored: false },
];

const faqItems = [
  {
    question: 'Can you see the candidates I search for?',
    answer:
      'Candidate data passes through our servers to process your request, but we don\'t log or store it. We see the request ("find engineers in NYC"), process it, return results, and move on. Think of us as a phone operator connecting your call—we route the conversation but don\'t record it.',
  },
  {
    question: 'What if Skillomatic gets hacked?',
    answer:
      'Since we don\'t store candidate data, there\'s nothing to steal. Attackers couldn\'t get a list of your candidates because we don\'t have one. OAuth tokens are encrypted and can be revoked instantly from your integrations\' admin panels.',
  },
  {
    question: 'Can I use this for GDPR-covered candidates?',
    answer:
      'Yes. Since we don\'t store candidate PII, we\'re not creating a new data controller relationship. You\'re still the controller of your ATS data—we just help you access it more efficiently. That said, you should still follow your organization\'s data policies.',
  },
  {
    question: 'What happens when I delete my account?',
    answer:
      'We delete your user record, revoke all OAuth tokens, invalidate your API keys, and remove your usage logs. Since we never stored your candidate data in the first place, there\'s nothing else to delete.',
  },
  {
    question: 'Can my company audit your security?',
    answer:
      'Yes. We offer source code access for security audits. Email us to request access—no NDA required. We\'d rather you verify our claims than take our word for it.',
  },
  {
    question: 'Is my chat history saved?',
    answer:
      'No. Chat conversations happen between your browser and the AI model (Claude). We don\'t see or store them. When you close the chat, it\'s gone.',
  },
];

const dataFlow = [
  {
    step: 1,
    title: 'You Ask a Question',
    example: '"Find senior engineers at fintech companies in NYC"',
    whatHappens: 'Your request goes to Claude (the AI)',
  },
  {
    step: 2,
    title: 'AI Calls Our Tools',
    example: 'Claude decides to search LinkedIn',
    whatHappens: 'We route the search to your LinkedIn session via the extension',
  },
  {
    step: 3,
    title: 'Data Passes Through',
    example: 'LinkedIn returns 25 profiles',
    whatHappens: 'Results go to Claude for processing—we don\'t store them',
  },
  {
    step: 4,
    title: 'You Get Your Answer',
    example: '"Here are 25 engineers matching your criteria..."',
    whatHappens: 'Claude shows you the results. We\'ve already forgotten them.',
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
              We Don't Want{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Your Data
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              Most recruiting tools sync your entire ATS and store everything forever.
              We don't. Here's exactly what we do and don't do with your information.
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
              A typical request, step by step. Notice: nothing persists.
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
                End result: We helped you find candidates, but we don't have a copy.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Your Controls */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              You're in Control
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Start cautious, scale up when you're ready
            </p>
          </div>

          <div className="robot-panel rounded-2xl p-8 relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-2">Start Read-Only</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  Search your ATS and view candidates without any write access. Perfect for testing.
                </p>
              </div>
              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Key className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-2">Enable Writes</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  When you're ready, enable adding candidates and sending emails. Everything still requires your approval.
                </p>
              </div>
              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <UserX className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-2">Revoke Anytime</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  Disconnect from your Skillomatic dashboard, or revoke access directly from your ATS admin panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="card-robot rounded-xl p-6">
                <h3 className="font-black text-[hsl(220_30%_20%)] mb-3">{item.question}</h3>
                <p className="text-[hsl(220_15%_45%)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500 to-cyan-500">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Want to Verify Our Claims?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Request a security audit. We'll give you access to our source code
            so you can verify everything we've said here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:email@skillomatic.technology?subject=Security%20Audit%20Request"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-600 font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              Request Audit
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              to="/for-it"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              IT Security Details
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
