/**
 * How It Works Page
 *
 * Consulting-first flow: Discovery → Build → Deliver
 */
import {
  Calendar,
  Code,
  Zap,
  CheckCircle,
  ArrowDown,
  Bot,
  MessageSquare,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const steps = [
  {
    number: '01',
    title: 'Discovery Call',
    description:
      "We start with a 30-minute call. You tell me what's repetitive and painful in your workflow. I ask questions to understand how you work and what tools you use.",
    icon: Calendar,
    color: 'bg-blue-500',
    details: [
      'Understand your current workflow',
      'Identify automation opportunities',
      'Assess technical feasibility',
      'No commitment required',
    ],
  },
  {
    number: '02',
    title: 'I Build the Automation',
    description:
      'I create the automation, connecting to your real systems — email, calendar, spreadsheets, payments, whatever you use. I test it with real data to make sure it works.',
    icon: Code,
    color: 'bg-primary',
    details: [
      'Connected to your actual tools',
      'Tested with real data',
      'Documentation included',
      'Usually done in 1-2 days',
    ],
  },
  {
    number: '03',
    title: 'You Use It',
    description:
      'The automation runs in Claude Desktop, ChatGPT, or any MCP-compatible app. Just tell your AI what to do and it does it — no copy-pasting, no manual steps.',
    icon: Bot,
    color: 'bg-emerald-500',
    details: [
      'Works with your existing AI app',
      'Plain English requests',
      'Review before any action executes',
      'Support and adjustments included',
    ],
  },
];

const whatMakesItDifferent = [
  {
    traditional: 'Generic consulting advice',
    skillomatic: 'Working automation you can use immediately',
  },
  {
    traditional: 'Months of implementation',
    skillomatic: 'Delivered in 1-2 days',
  },
  {
    traditional: 'Requires IT involvement',
    skillomatic: 'OAuth connections, no IT tickets',
  },
  {
    traditional: 'You still do the work',
    skillomatic: 'AI does the work; you review and approve',
  },
];

const afterDelivery = [
  {
    icon: MessageSquare,
    title: 'Chat Interface',
    description: 'Just tell your AI what to do in plain English. No commands, no training.',
  },
  {
    icon: Shield,
    title: 'You Stay in Control',
    description: 'See exactly what will happen before approving any action.',
  },
  {
    icon: Clock,
    title: 'Save Hours Daily',
    description: 'Repetitive tasks that took hours now take seconds.',
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
              <Zap className="h-3 w-3 mr-1" />
              Simple Process
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
              How It{' '}
              <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                Works
              </span>
            </h1>
            <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
              You tell me what you want to automate. I build it. You use it with your AI assistant.
              Simple as that.
            </p>
          </div>
        </div>
      </section>

      {/* Not Traditional Consulting */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-3">
              Not Traditional Consulting
            </h2>
            <p className="text-[hsl(220_15%_45%)]">
              I don't give you a deck and wish you luck. I build the automation for you.
            </p>
          </div>

          <div className="space-y-3">
            {whatMakesItDifferent.map((item, index) => (
              <div
                key={index}
                className="card-robot rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-6 w-6 rounded-full bg-[hsl(220_15%_90%)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[hsl(220_15%_50%)]">OLD</span>
                  </div>
                  <span className="text-[hsl(220_15%_45%)]">{item.traditional}</span>
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
              The Process
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              From first call to working automation in 1-2 days
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

      {/* After Delivery */}
      <section className="py-20 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              What Happens After
            </h2>
            <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              Once the automation is delivered, here's how you'll use it day-to-day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {afterDelivery.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card-robot rounded-2xl p-6 text-center">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-black text-[hsl(220_30%_20%)] mb-2">{item.title}</h3>
                  <p className="text-sm text-[hsl(220_15%_45%)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ongoing Support */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-8 relative">
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <div className="text-center mb-8">
              <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-black text-[hsl(220_30%_20%)] mb-3">
                Ongoing Support Available
              </h2>
              <p className="text-[hsl(220_15%_45%)] max-w-xl mx-auto">
                Need adjustments as your workflow evolves? Want to add new automations?
                I offer monthly retainers for ongoing support.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Priority Support</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">Quick responses when something needs fixing</p>
              </div>
              <div className="text-center p-4">
                <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">Adjustments</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">Tweaks and improvements as needed</p>
              </div>
              <div className="text-center p-4">
                <Code className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-bold text-[hsl(220_30%_20%)] mb-1">New Automations</h3>
                <p className="text-sm text-[hsl(220_15%_50%)]">Add more workflows over time</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/pricing"
                className="text-sm text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                See retainer pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <Calendar className="h-12 w-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Let's Talk About Your Workflow
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            30-minute discovery call. No commitment. I'll tell you if I can help — and if I can't, I'll point you in the right direction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Calendar className="h-5 w-5" />
              Book a Discovery Call
            </a>
            <Link
              to="/self-serve"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Prefer DIY? Try Self-Serve
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
