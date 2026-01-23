/**
 * How It Works Page
 *
 * Simple, clear explanation for recruiters who are used to copy-pasting from ChatGPT.
 * Emphasizes that this is NOT another chatbot - it actually does the work.
 */
import {
  MessageSquare,
  Plug,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowDown,
  Bot,
  Linkedin,
  Mail,
  Calendar,
  Users,
  Play,
  Clock,
  Shield,
  Eye,
  MousePointer,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const steps = [
  {
    number: '01',
    title: 'Connect Your Tools',
    description:
      'Link your ATS (Greenhouse, Lever, etc.), email, and calendar. One-click OAuth—no API keys to copy, no IT tickets needed.',
    icon: Plug,
    color: 'bg-blue-500',
    details: [
      'Takes about 2 minutes per integration',
      'Uses the same login you already have',
      'You control exactly what Skillomatic can access',
      'Disconnect anytime from your dashboard',
    ],
  },
  {
    number: '02',
    title: 'Install the Browser Extension',
    description:
      'Add our Chrome extension to search LinkedIn profiles. It runs in your browser using your LinkedIn session—no separate login required.',
    icon: MousePointer,
    color: 'bg-[#0A66C2]',
    details: [
      'Works with LinkedIn Recruiter and Sales Navigator',
      'Uses your existing LinkedIn session',
      'No API limits or fake accounts',
      'Rate-limited to stay within LinkedIn guidelines',
    ],
  },
  {
    number: '03',
    title: 'Chat Like You Would With ChatGPT',
    description:
      'Open the Skillomatic chat and type what you want to do in plain English. No special commands, no training needed.',
    icon: MessageSquare,
    color: 'bg-purple-500',
    details: [
      '"Find senior engineers in NYC with React experience"',
      '"Draft outreach emails for my pipeline"',
      '"Schedule interviews for candidates who passed screening"',
      '"Send me a weekly summary of my pipeline"',
    ],
  },
  {
    number: '04',
    title: 'Review and Approve',
    description:
      'Skillomatic shows you exactly what it plans to do before taking action. You approve, it executes. Nothing happens without your say-so.',
    icon: Eye,
    color: 'bg-emerald-500',
    details: [
      'See drafted messages before they send',
      'Review candidate lists before adding to ATS',
      'Approve calendar invites before booking',
      'Edit anything before it goes out',
    ],
  },
];

const notChatGPT = [
  {
    chatgpt: 'Copy-paste responses into your tools',
    skillomatic: 'Actually sends the email, adds the candidate, books the meeting',
  },
  {
    chatgpt: 'Generic templates that need heavy editing',
    skillomatic: 'Personalized content using real candidate data from LinkedIn',
  },
  {
    chatgpt: 'Starts fresh every conversation',
    skillomatic: 'Knows your pipeline, your preferences, your open reqs',
  },
  {
    chatgpt: 'Can only give you text',
    skillomatic: 'Searches LinkedIn, updates your ATS, sends emails, books meetings',
  },
];

const realExamples = [
  {
    prompt: '"Add Sarah Chen to my ML Engineer pipeline in Greenhouse"',
    result: 'Candidate created in Greenhouse with LinkedIn data, tagged, and added to your req.',
    time: '3 seconds',
    icon: Users,
  },
  {
    prompt: '"Send follow-ups to everyone who hasn\'t responded in 5 days"',
    result: '12 personalized follow-up emails drafted, reviewed, and sent.',
    time: '2 minutes',
    icon: Mail,
  },
  {
    prompt: '"Find 20 backend engineers at fintech companies in NYC"',
    result: '20 profiles found, enriched with contact info, ready to add to your pipeline.',
    time: '45 seconds',
    icon: Linkedin,
  },
  {
    prompt: '"Schedule onsites for my shortlist this week"',
    result: 'Checked 5 interviewer calendars, found overlaps, sent invite options to 3 candidates.',
    time: '1 minute',
    icon: Calendar,
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
              <Bot className="h-3 w-3 mr-1" />
              Simple Setup, Real Results
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              How It{' '}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Actually Works
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              If you've used ChatGPT, you already know how to use Skillomatic.
              The difference? Instead of copy-pasting outputs, Skillomatic actually does the work for you.
            </p>
          </div>
        </div>
      </section>

      {/* Not ChatGPT Section */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-3">
              This Isn't Another ChatGPT Wrapper
            </h2>
            <p className="text-[hsl(220_15%_45%)]">
              You're probably tired of AI tools that just give you text to copy-paste. We are too.
            </p>
          </div>

          <div className="space-y-3">
            {notChatGPT.map((item, index) => (
              <div
                key={index}
                className="card-robot rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-6 w-6 rounded-full bg-[hsl(220_15%_90%)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[hsl(220_15%_50%)]">GPT</span>
                  </div>
                  <span className="text-[hsl(220_15%_45%)]">{item.chatgpt}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-primary/40 hidden sm:block flex-shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[hsl(220_30%_20%)] font-semibold">{item.skillomatic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step by Step */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Four Steps to Get Started
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Most recruiters are up and running in under 10 minutes
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  <div className="card-robot rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Step number and icon */}
                      <div className="flex md:flex-col items-center gap-4 md:gap-3">
                        <div className="text-4xl font-black text-[hsl(220_15%_85%)]">{step.number}</div>
                        <div className={`h-14 w-14 rounded-xl ${step.color} flex items-center justify-center`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-[hsl(220_30%_20%)] mb-2">{step.title}</h3>
                        <p className="text-[hsl(220_15%_45%)] mb-4">{step.description}</p>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_50%)]">
                              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Connector arrow */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4">
                      <ArrowDown className="h-6 w-6 text-[hsl(220_15%_80%)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real Examples */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              What You Can Actually Say
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Real prompts from real recruiters. Plain English, real results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {realExamples.map((example, index) => {
              const Icon = example.icon;
              return (
                <div key={index} className="card-robot rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/20 mb-3">
                        <p className="text-[hsl(220_30%_25%)] text-sm font-medium">{example.prompt}</p>
                      </div>
                      <p className="text-[hsl(220_15%_45%)] text-sm mb-2">{example.result}</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                        <Clock className="h-3 w-3" />
                        {example.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <div className="text-center mb-8">
              <Shield className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
                You're Always in Control
              </h2>
              <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto">
                Worried about AI doing something you didn't want? We get it. That's why Skillomatic
                shows you everything before it happens.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Eye className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Preview Everything</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  See exactly what will happen before you approve
                </p>
              </div>
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Approve Actions</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  Nothing sends or updates without your explicit OK
                </p>
              </div>
              <div className="text-center p-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Edit Anytime</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">
                  Modify drafts, change selections, adjust before sending
                </p>
              </div>
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-purple-500">
        <div className="max-w-4xl mx-auto text-center">
          <Play className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Stop Copy-Pasting?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join recruiters who save hours every day by letting AI do the busywork
            while they focus on building relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Play className="h-5 w-5" />
              Request Demo
            </a>
            <Link
              to="/for-recruiters"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
