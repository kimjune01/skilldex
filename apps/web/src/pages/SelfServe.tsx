/**
 * Self-Serve Page
 *
 * For DIY users who want to set up Skillomatic themselves.
 */
import { CheckCircle, ArrowRight, Zap, Users, Building2, Plug, Bot, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Try it out',
    features: [
      '500 tool calls/month',
      'Basic integrations',
      'Community support',
      'Works with Claude Desktop & ChatGPT',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
    icon: Zap,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For power users',
    features: [
      '5,000 tool calls/month',
      'All integrations',
      'Email support',
      '$0.01/call after limit',
      'Priority processing',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
    icon: Users,
    highlight: true,
  },
  {
    name: 'Team',
    price: '$99',
    period: '/month',
    description: 'For small teams',
    features: [
      '25,000 tool calls/month',
      'Multiple users',
      'Priority support',
      '$0.005/call after limit',
      'Shared integrations',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
    icon: Building2,
    highlight: false,
  },
];

const steps = [
  {
    number: '1',
    title: 'Sign Up',
    description: 'Create a free account. No credit card required to start.',
    icon: Users,
  },
  {
    number: '2',
    title: 'Connect Integrations',
    description: 'Link your tools — email, calendar, spreadsheets, payments. One-click OAuth for most.',
    icon: Plug,
  },
  {
    number: '3',
    title: 'Get Your MCP Config',
    description: 'Copy the MCP server configuration into Claude Desktop or your AI app of choice.',
    icon: Bot,
  },
  {
    number: '4',
    title: 'Start Chatting',
    description: 'Tell your AI what to do. It now has access to your tools through Skillomatic.',
    icon: MessageSquare,
  },
];

const faqs = [
  {
    q: 'What is MCP?',
    a: 'MCP (Model Context Protocol) is an open standard created by Anthropic that lets AI assistants connect to external tools and data. Think of it like USB for AI — a universal way to plug capabilities into your AI. Skillomatic is an MCP server, meaning it gives your AI the ability to interact with your business tools (email, calendar, spreadsheets, etc.).',
  },
  {
    q: 'Which AI apps work with Skillomatic?',
    a: 'Claude Desktop is the main one right now — it has native MCP support. ChatGPT works via our browser extension. Other MCP-compatible apps like Cursor and Continue also work. As more AI apps adopt MCP, they\'ll work with Skillomatic automatically.',
  },
  {
    q: 'What counts as a "tool call"?',
    a: 'Each action Skillomatic takes on your behalf — checking your calendar, querying a spreadsheet, sending an email — is one tool call. Reading data and writing data each count as separate calls.',
  },
  {
    q: 'Can I switch between self-serve and consulting?',
    a: 'Yes. Many people start with self-serve to try things out, then reach out for consulting when they want custom workflows or need help with complex automation. You can also go the other way — start with consulting, then manage it yourself.',
  },
  {
    q: 'Is my data secure?',
    a: "We don't store your business data or message content. Your OAuth tokens are encrypted at rest. We only access what you explicitly authorize, and you can disconnect integrations anytime. See our privacy policy for details.",
  },
  {
    q: 'Do I need to be technical to use this?',
    a: "For self-serve, you'll need to copy-paste a config snippet into Claude Desktop — it takes about 2 minutes. After that, you just chat in plain English. No coding required.",
  },
];

export default function SelfServe() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
            <Zap className="h-3 w-3 mr-1" />
            Self-Serve Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            Set It Up{' '}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Yourself
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
            Prefer DIY? Connect your integrations, get your MCP config, and use Skillomatic with Claude Desktop, ChatGPT, or any compatible AI app.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            How Self-Serve Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[hsl(220_15%_45%)]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-2 text-center">
            Simple Pricing
          </h2>
          <p className="text-center text-[hsl(220_15%_45%)] mb-8">
            Start free, upgrade when you need more.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`rounded-2xl p-6 ${
                    tier.highlight ? 'robot-panel ring-2 ring-primary' : 'card-robot'
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-black text-[hsl(220_30%_15%)] mb-1">{tier.name}</h3>
                  <div className="mb-2">
                    <span className="text-2xl font-black text-[hsl(220_30%_15%)]">{tier.price}</span>
                    <span className="text-[hsl(220_15%_50%)]">{tier.period}</span>
                  </div>
                  <p className="text-sm text-[hsl(220_15%_50%)] mb-4">{tier.description}</p>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_45%)]">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={tier.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide transition-all ${
                      tier.highlight
                        ? 'robot-button text-white border-0'
                        : 'bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] hover:bg-[hsl(220_15%_90%)]'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            Common Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card-robot rounded-xl p-5">
                <h3 className="font-black text-[hsl(220_30%_15%)] mb-2">{faq.q}</h3>
                <p className="text-sm text-[hsl(220_15%_45%)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prefer Done-for-You */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Calendar className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-4">
            Prefer Done-for-You?
          </h2>
          <p className="text-[hsl(220_15%_45%)] mb-6">
            If setting this up yourself sounds like too much work, I can build the automation for you. Tell me what you want to automate and I'll handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide border-0"
            >
              <Calendar className="h-4 w-4" />
              Book a Discovery Call
            </a>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] font-bold tracking-wide hover:bg-[hsl(220_15%_90%)] transition-colors"
            >
              See Consulting Rates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Create a free account and connect your first integration in under 5 minutes.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            <Zap className="h-5 w-5" />
            Start for Free
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
