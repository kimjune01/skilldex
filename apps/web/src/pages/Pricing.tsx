/**
 * Pricing Page
 *
 * Consulting-first pricing with self-serve secondary.
 * Easter eggs throughout for the curious.
 */
import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, ArrowRight, Zap, Users, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

// Fun facts that appear when clicking the robot
const funFacts = [
  "Fun fact: The average knowledge worker switches tabs 1,100 times per day. We counted.",
  "Did you know? Our first prototype was built during a coffee-fueled 48-hour hackathon.",
  "Secret: Click the robot 7 times for a surprise. Or don't. We're not your boss.",
  "True story: Our pricing was originally $69 but our accountant said we weren't 'professional' enough.",
];

// Strength emojis that burst out when clicking the robot
const STRENGTH_EMOJIS = [
  '💪', '🦾', '⚡', '🔥', '💥', '🚀', '✨', '🏋️', '👊', '🦸', '⭐', '🎯',
  '💪', '🦾', '⚡', '🔥', '💥', '🚀', '✨', '🏋️', '👊', '🦸', '⭐', '🎯',
];

interface EmojiParticle {
  id: number;
  emoji: string;
  vx: number;
  vy: number;
  spin: number;
  originX: number;
  originY: number;
}

const consultingServices = [
  {
    name: 'Discovery Call',
    price: 'Free',
    description: "30 minutes to understand your workflow and see if I can help.",
    features: [
      'Understand your current process',
      'Identify automation opportunities',
      'Honest assessment of what I can build',
      'No commitment required',
    ],
    cta: 'Book a Call',
    ctaHref: 'https://cal.com/june-kim-mokzq0/30min',
    highlight: false,
  },
  {
    name: 'Automation Build',
    price: '$500',
    priceNote: 'No charge until it works',
    description: 'I build a complete automation for one workflow, connected to your tools.',
    features: [
      'End-to-end workflow automation',
      'Connected to your real systems',
      'Works in Claude Desktop, ChatGPT, etc.',
      'Documentation and training',
      'Done in 1-2 days',
      "You don't pay until you're using it",
      'Then $29/mo to run it (Pro plan)',
    ],
    cta: 'Book a Call',
    ctaHref: 'https://cal.com/june-kim-mokzq0/30min',
    highlight: true,
  },
  {
    name: 'Multiple Automations',
    price: '$500',
    priceNote: 'per automation',
    description: 'Need more than one workflow automated? Same deal, same guarantee.',
    features: [
      'Each automation built to spec',
      'Bundle discount for 3+',
      'Team plan ($99/mo) for heavy usage',
      'Priority support included',
    ],
    cta: 'Book a Call',
    ctaHref: 'https://cal.com/june-kim-mokzq0/30min',
    highlight: false,
  },
];

const selfServeTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Try before you buy',
    features: [
      '500 tool calls/month',
      'Basic integrations',
      'Community support',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Most consulting clients',
    features: [
      '5,000 tool calls/month',
      'All integrations',
      'Email support',
      '$0.01/call after limit',
    ],
    cta: 'Get Started',
    ctaHref: '/login',
    icon: Users,
    recommended: true,
  },
];

const faqs = [
  {
    q: "What's included in an automation build?",
    a: "Everything needed to get your workflow running: connecting to your tools (email, calendar, spreadsheets, etc.), building the automation logic, testing it with real data, documentation, and training your team to use it.",
  },
  {
    q: "What if I want to do it myself?",
    a: "Totally fine! Self-serve is always available. Sign up, connect your integrations, and use it with your AI app. The free tier gives you 500 calls/month to try it out.",
  },
  {
    q: "How long does an automation build take?",
    a: "Most builds take 1-2 days from kickoff to delivery. Simpler workflows can be faster; complex multi-system integrations might take a bit longer.",
  },
  {
    q: "What tools can you connect to?",
    a: "Email (Gmail, Outlook), calendars, Google Sheets, Airtable, Stripe, CRMs (Salesforce, HubSpot), and many more. If it has an API, I can probably connect to it.",
  },
  {
    q: "Do I need to be technical?",
    a: "No. Once I build the automation, you just use it by chatting with your AI app. Say what you want to do, and it does it.",
  },
];

export default function Pricing() {
  const [emojiBurst, setEmojiBurst] = useState<EmojiParticle[]>([]);
  const [showFunFact, setShowFunFact] = useState<string | null>(null);
  const [robotClicks, setRobotClicks] = useState(0);

  // Handle robot click for emoji burst
  const handleRobotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    const originY = e.clientY - rect.top;

    const newEmojis: EmojiParticle[] = STRENGTH_EMOJIS.map((emoji, i) => ({
      id: Date.now() + i,
      emoji,
      vx: (Math.random() - 0.5) * 20,
      vy: -Math.random() * 15 - 5,
      spin: (Math.random() - 0.5) * 720,
      originX,
      originY,
    }));

    setEmojiBurst(prev => [...prev, ...newEmojis]);
    setRobotClicks(prev => prev + 1);

    // Clear emojis after animation
    setTimeout(() => {
      setEmojiBurst(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)));
    }, 2000);
  };

  // Show fun fact on 7th click
  useEffect(() => {
    if (robotClicks === 7) {
      setShowFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
      setTimeout(() => setShowFunFact(null), 5000);
      setRobotClicks(0);
    }
  }, [robotClicks]);

  return (
    <div className="min-h-screen bg-background">
      {/* Fun fact popup */}
      {showFunFact && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-primary text-white p-4 rounded-xl shadow-lg z-50 animate-bounce">
          <p className="text-sm">{showFunFact}</p>
        </div>
      )}

      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
            Simple Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            Consulting or Self-Serve.{' '}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Your Choice.
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
            Want it done for you? I'll build it. Prefer to DIY? Self-serve is always available.
          </p>
          <p className="text-sm text-[hsl(220_15%_60%)] mt-2">
            Prices may change with one month notice.
          </p>
        </div>
      </section>

      {/* Consulting Services */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            Done-for-You Consulting
          </h2>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {consultingServices.map((service) => (
              <div
                key={service.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  service.highlight
                    ? 'robot-panel ring-2 ring-primary'
                    : 'card-robot'
                }`}
              >
                <h3 className="text-xl font-black text-[hsl(220_30%_15%)] mb-1">
                  {service.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-[hsl(220_30%_15%)]">
                    {service.price}
                  </span>
                  {service.priceNote && (
                    <span className="text-sm text-emerald-600 font-bold ml-2">
                      {service.priceNote}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[hsl(220_15%_45%)] mb-6">
                  {service.description}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_40%)]">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={service.ctaHref}
                  target={service.ctaHref.startsWith('http') ? '_blank' : undefined}
                  rel={service.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide transition-all ${
                    service.highlight
                      ? 'robot-button text-white border-0'
                      : 'bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] hover:bg-[hsl(220_15%_90%)]'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {service.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider with Easter Egg Robot */}
      <section className="py-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[hsl(220_15%_85%)]" />
            <div
              className="relative cursor-pointer select-none"
              onClick={handleRobotClick}
              title="Click me!"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center hover:scale-110 transition-transform">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              {/* Emoji burst container */}
              {emojiBurst.map((particle) => (
                <span
                  key={particle.id}
                  className="absolute text-2xl pointer-events-none animate-ping"
                  style={{
                    left: particle.originX,
                    top: particle.originY,
                    transform: `translate(-50%, -50%)`,
                    animation: `emoji-burst 2s ease-out forwards`,
                    '--vx': `${particle.vx}px`,
                    '--vy': `${particle.vy}px`,
                    '--spin': `${particle.spin}deg`,
                  } as React.CSSProperties}
                >
                  {particle.emoji}
                </span>
              ))}
            </div>
            <div className="flex-1 h-px bg-[hsl(220_15%_85%)]" />
          </div>
          <span className="text-sm font-bold text-[hsl(220_15%_50%)] mt-2 block">THEN PAY FOR WHAT YOU USE</span>
        </div>
      </section>

      {/* Self-Serve Tiers */}
      <section className="py-12 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-2 text-center">
            Usage Plans
          </h2>
          <p className="text-center text-[hsl(220_15%_45%)] mb-8">
            After setup, you pay for usage. Same plans whether I built it or you did.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {selfServeTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.name} className={`card-robot rounded-2xl p-6 ${tier.recommended ? 'ring-2 ring-primary' : ''}`}>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-[hsl(220_30%_15%)]">
                      {tier.name}
                    </h3>
                    {tier.recommended && (
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-2xl font-black text-[hsl(220_30%_15%)]">
                      {tier.price}
                    </span>
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
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] font-bold text-sm hover:bg-[hsl(220_15%_90%)] transition-colors"
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
      <section className="py-20 px-6">
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Not Sure Which Option?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Book a free discovery call. I'll learn about your workflow and recommend the best path forward.
          </p>
          <a
            href="https://cal.com/june-kim-mokzq0/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            <Calendar className="h-5 w-5" />
            Book a Discovery Call
          </a>
        </div>
      </section>

      <MarketingFooter />

      {/* CSS for emoji burst animation */}
      <style>{`
        @keyframes emoji-burst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateX(0) translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateX(var(--vx)) translateY(calc(var(--vy) + 100px)) rotate(var(--spin));
          }
        }
      `}</style>
    </div>
  );
}
