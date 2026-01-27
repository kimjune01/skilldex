/**
 * Pricing Page
 *
 * Freemium model: Generous free tier with Google integrations,
 * paid tier for business integrations (ATS, CRM, etc.)
 */
import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, ArrowRight, Zap, Building2, Bot, X, Sparkles } from 'lucide-react';
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

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Everything you need to run your business with AI',
    features: [
      { text: 'Full Google Workspace (Gmail, Calendar, Sheets, Drive, Contacts, Tasks)', included: true },
      { text: 'Notion, Trello, GitHub', included: true },
      { text: 'Calendly & Cal.com', included: true },
      { text: 'Unlimited tool calls', included: true },
      { text: 'Works with Claude, ChatGPT, etc.', included: true },
    ],
    cta: 'Get Started Free',
    ctaHref: '/login',
    icon: Zap,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Add business integrations when you need them',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Stripe (payments & invoices)', included: true },
      { text: 'Outlook & Outlook Calendar', included: true },
      { text: 'Airtable', included: true },
      { text: 'ATS integrations (Greenhouse, Lever, etc.)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations on request', included: true },
    ],
    cta: 'Start Free, Upgrade Later',
    ctaHref: '/login',
    icon: Building2,
    highlight: true,
    badge: 'Most Popular',
  },
];

const comparisonData = {
  free: {
    name: 'Free',
    integrations: [
      // Google stack
      { name: 'Gmail', icon: '📧' },
      { name: 'Google Calendar', icon: '📅' },
      { name: 'Google Sheets', icon: '📊' },
      { name: 'Google Drive', icon: '📁' },
      { name: 'Google Contacts', icon: '👥' },
      { name: 'Google Tasks', icon: '✓' },
      // Scheduling
      { name: 'Calendly', icon: '🗓️' },
      { name: 'Cal.com', icon: '📆' },
      // Third party (full-featured free)
      { name: 'Notion', icon: '📝' },
      { name: 'Trello', icon: '📋' },
      { name: 'GitHub', icon: '🐙' },
    ],
  },
  pro: {
    name: 'Pro',
    integrations: [
      { name: 'Stripe', icon: '💳' },
      { name: 'Outlook', icon: '📬' },
      { name: 'Airtable', icon: '🗄️' },
      { name: 'Greenhouse', icon: '🌱' },
      { name: 'Lever', icon: '🔧' },
      { name: 'Ashby', icon: '📋' },
      { name: 'Workable', icon: '💼' },
      { name: 'Zoho Recruit', icon: '🎯' },
    ],
  },
};

const faqs = [
  {
    q: 'Is the free tier really unlimited?',
    a: "Yes. No hidden limits on tool calls, no trial period that expires. Google Workspace, Notion, Trello, and GitHub are free forever. We only charge when you need business integrations like Stripe or ATS systems.",
  },
  {
    q: "What if I'm not sure which tier I need?",
    a: "Start free. You get 11 integrations including the full Google stack, Notion, Trello, and GitHub. If you later need Stripe or ATS integrations, upgrade then. You won't lose any data.",
  },
  {
    q: 'Why are some integrations free and others paid?',
    a: "Simple rule: if the service has a full-featured free tier, it's free on Skillomatic. Google, Notion, Trello, GitHub all have generous free tiers. ATS systems like Greenhouse are paid-only services, so we charge for those.",
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel Pro anytime and you keep free tier access. All 11 free integrations keep working. No lock-in, no data hostage.",
  },
  {
    q: 'Do you offer team or enterprise pricing?',
    a: "Yes. For teams of 5+ or enterprise needs, book a call and we'll create a custom plan. Volume discounts available.",
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
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 font-bold">
            <Sparkles className="h-3 w-3 mr-1" />
            Generous Free Tier
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            Free for Google.{' '}
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              Pro for Business.
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
            Gmail, Calendar, and Sheets are free forever. Only upgrade when you need
            Stripe, Outlook, or ATS integrations.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`rounded-2xl p-8 flex flex-col relative ${
                    tier.highlight
                      ? 'robot-panel ring-2 ring-primary'
                      : 'card-robot'
                  }`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      tier.highlight ? 'bg-primary/20' : 'bg-[hsl(220_20%_92%)]'
                    }`}>
                      <Icon className={`h-6 w-6 ${tier.highlight ? 'text-primary' : 'text-[hsl(220_15%_45%)]'}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[hsl(220_30%_15%)]">
                        {tier.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-4xl font-black text-[hsl(220_30%_15%)]">
                      {tier.price}
                    </span>
                    <span className="text-[hsl(220_15%_50%)]">{tier.period}</span>
                  </div>

                  <p className="text-sm text-[hsl(220_15%_45%)] mb-6">
                    {tier.description}
                  </p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-[hsl(220_15%_35%)]' : 'text-gray-400'}>
                          {feature.text}
                        </span>
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

      {/* Integration Comparison */}
      <section className="py-16 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-2 text-center">
            What's Included
          </h2>
          <p className="text-center text-[hsl(220_15%_45%)] mb-10">
            Free tier covers the essentials. Pro unlocks business tools.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-black text-emerald-600">Free Forever</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  NO CREDIT CARD
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comparisonData.free.integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100"
                  >
                    <span className="text-xl">{integration.icon}</span>
                    <span className="text-sm font-medium text-[hsl(220_20%_30%)]">
                      {integration.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-2xl p-6 border-2 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-black text-primary">Pro Additions</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                  $29/MONTH
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comparisonData.pro.integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <span className="text-xl">{integration.icon}</span>
                    <span className="text-sm font-medium text-[hsl(220_20%_30%)]">
                      {integration.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
        </div>
      </section>

      {/* The Math Section */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-[hsl(220_30%_15%)] mb-8 text-center">
            The Math
          </h2>
          <div className="card-robot rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[hsl(220_15%_90%)]">
                <span className="text-[hsl(220_15%_40%)]">Skillomatic Free</span>
                <span className="font-black text-emerald-600">$0/mo</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[hsl(220_15%_90%)]">
                <span className="text-[hsl(220_15%_40%)]">CRM software you'd use once a week</span>
                <span className="font-black text-[hsl(220_15%_30%)]">$30-100/mo</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[hsl(220_15%_90%)]">
                <span className="text-[hsl(220_15%_40%)]">Invoicing software you'd forget to check</span>
                <span className="font-black text-[hsl(220_15%_30%)]">$20-50/mo</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[hsl(220_15%_90%)]">
                <span className="text-[hsl(220_15%_40%)]">Task management tool you'd ignore</span>
                <span className="font-black text-[hsl(220_15%_30%)]">$10-30/mo</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-[hsl(220_30%_15%)]">Your current AI subscription</span>
                <span className="font-black text-[hsl(220_30%_15%)]">$20/mo</span>
              </div>
            </div>
            <div className="mt-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-center text-emerald-800 font-bold">
                Skip the SaaS. Just use Claude + Skillomatic Free.
              </p>
            </div>
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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Start Free. Upgrade When You Need To.
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Connect Gmail, Calendar, and Sheets in 5 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              <Calendar className="h-5 w-5" />
              Talk to a Human
            </a>
          </div>
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
