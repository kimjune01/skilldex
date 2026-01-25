/**
 * Pricing Page
 *
 * Shows pricing tiers from GTM strategy with whimsical robot vending machine theme.
 * Easter eggs throughout for the curious.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Users,
  Building2,
  CheckCircle,
  ArrowRight,
  Calculator,
  Gift,
  Star,
  Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

// Konami code easter egg
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const pricingTiers = [
  {
    id: 'design-partner',
    name: 'Design Partner',
    tagline: 'Shape the future with us',
    price: 'Free → $49',
    period: '/user/month',
    highlight: true,
    features: [
      'Free for first 3 months',
      'Then 40% off standard pricing',
      'Monthly feedback calls with founders',
      'Priority feature requests',
      'Case study collaboration',
      'Founder cell phone access (yes, really)',
    ],
    cta: 'Apply Now',
    ctaHref: 'mailto:email@skillomatic.technology?subject=Design%20Partner%20Application',
    icon: Sparkles,
    color: 'from-amber-400 to-orange-500',
    badge: 'Limited Spots',
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'For growing teams',
    price: '$79',
    period: '/user/month',
    highlight: false,
    features: [
      'All recruiting skills included',
      'Unlimited integrations',
      'Regular product updates',
      'Email support',
      'Minimum 5 seats ($395/mo)',
      'Self-serve onboarding',
    ],
    cta: 'Get Started',
    ctaHref: 'mailto:email@skillomatic.technology?subject=Standard%20Plan%20Interest',
    icon: Zap,
    color: 'from-primary to-cyan-500',
    badge: null,
  },
  {
    id: 'volume',
    name: 'Volume',
    tagline: 'For large teams',
    price: '$59',
    period: '/user/month',
    highlight: false,
    features: [
      'Everything in Standard',
      '20+ seats required',
      'Priority support',
      'Quarterly custom skill development',
      'Dedicated success manager',
      'Volume discounts available',
    ],
    cta: 'Contact Sales',
    ctaHref: 'mailto:email@skillomatic.technology?subject=Volume%20Plan%20Inquiry',
    icon: Building2,
    color: 'from-purple-500 to-pink-500',
    badge: 'Best Value',
  },
];

const roiCalculation = {
  recruiterSalary: 80000,
  hourlyRate: 40,
  hoursSavedPerWeek: 4,
  weeksPerYear: 52,
  annualSavings: 8320,
  skillomaticCost: 948,
  roi: 778,
  paybackWeeks: 6,
};

// Fun facts that appear when hovering over certain elements
const funFacts = [
  "Fun fact: The average recruiter switches tabs 1,100 times per day. We counted.",
  "Did you know? Our first prototype was built during a coffee-fueled 48-hour hackathon.",
  "Secret: Click the robot 7 times for a surprise. Or don't. We're not your boss.",
  "True story: Our pricing was originally $69 but our accountant said we weren't 'professional' enough.",
];

// Strength emojis that burst out (doubled)
const STRENGTH_EMOJIS = [
  '💪', '🦾', '⚡', '🔥', '💥', '🚀', '✨', '🏋️', '👊', '🦸', '⭐', '🎯',
  '💪', '🦾', '⚡', '🔥', '💥', '🚀', '✨', '🏋️', '👊', '🦸', '⭐', '🎯',
];

interface EmojiParticle {
  id: number;
  emoji: string;
  vx: number; // horizontal velocity
  vy: number; // vertical velocity (negative = up)
  spin: number; // rotation speed
  originX: number; // click position X relative to container
  originY: number; // click position Y relative to container
}

export default function Pricing() {
  const [emojiBurst, setEmojiBurst] = useState<EmojiParticle[]>([]);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [discoMode, setDiscoMode] = useState(false);
  const [showFunFact, setShowFunFact] = useState<string | null>(null);
  const [robotWiggle, setRobotWiggle] = useState(false);

  // Handle Konami code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KONAMI_CODE[konamiProgress]) {
        const newProgress = konamiProgress + 1;
        setKonamiProgress(newProgress);
        if (newProgress === KONAMI_CODE.length) {
          setDiscoMode(true);
          setKonamiProgress(0);
          setTimeout(() => setDiscoMode(false), 10000);
        }
      } else {
        setKonamiProgress(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [konamiProgress]);

  // Emoji burst with physics - single click!
  const handleSuperpowersClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    // Get click position relative to viewport
    const clickX = e.clientX;
    const clickY = e.clientY;

    const newEmojis: EmojiParticle[] = STRENGTH_EMOJIS.map((emoji, i) => ({
      id: Date.now() + i,
      emoji,
      vx: (Math.random() - 0.5) * 1000, // 2x horizontal spread
      vy: -700 - Math.random() * 500, // 2x upward velocity
      spin: (Math.random() - 0.5) * 1440, // 2x spin
      originX: clickX,
      originY: clickY,
    }));
    setEmojiBurst(prev => [...prev, ...newEmojis]);

    // Clean up after animation
    setTimeout(() => {
      setEmojiBurst(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)));
    }, 3000);
  };

  // Wiggle animation on hover
  const handleRobotHover = () => {
    setRobotWiggle(true);
    setTimeout(() => setRobotWiggle(false), 500);
  };

  return (
    <div className={`min-h-screen bg-background ${discoMode ? 'disco-mode' : ''}`}>
      <style>{`
        @keyframes disco {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .disco-mode {
          animation: disco 1s linear infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg) scale(1); }
          25% { transform: rotate(3deg) scale(1.1); }
          50% { transform: rotate(-3deg) scale(1); }
          75% { transform: rotate(3deg) scale(1.1); }
        }
        .wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
        @keyframes peek {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .peek-hint {
          animation: peek 2s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
          50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.4); }
        }
        .glow-hint {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>


      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Badge
            className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowFunFact(funFacts[Math.floor(Math.random() * funFacts.length)])}
          >
            <Star className="h-3 w-3 mr-1" />
            Simple, Transparent Pricing
          </Badge>

          {showFunFact && (
            <div className="mb-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block animate-pulse">
              {showFunFact}
              <button
                onClick={() => setShowFunFact(null)}
                className="ml-2 text-amber-400 hover:text-amber-600"
              >
                ×
              </button>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6 relative">
            Invest in Your Recruiters'
            <br />
            <span
              className={`bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent cursor-pointer hover:from-amber-500 hover:to-pink-500 transition-all inline-block ${robotWiggle ? 'wiggle' : ''}`}
              onClick={handleSuperpowersClick}
              onMouseEnter={handleRobotHover}
              title="Click me!"
            >
              Superpowers
              <span className="inline-block ml-1 text-lg peek-hint">✨</span>
            </span>
            {/* Emoji burst with gravity physics - true projectile motion */}
            <AnimatePresence>
              {emojiBurst.map((particle) => {
                // Calculate parabolic path points for smooth gravity
                // y = v0*t + 0.5*g*t^2 (where g is positive for downward)
                const duration = 2.5;
                const gravity = 2000; // 2x gravity for more energetic feel
                const v0y = particle.vy; // initial upward velocity (negative)

                // Generate points along parabolic trajectory from cursor origin
                const points = 25;
                const yPath: number[] = [];
                const xPath: number[] = [];
                for (let i = 0; i <= points; i++) {
                  const t = (i / points) * duration;
                  const y = v0y * t + 0.5 * gravity * t * t; // Relative movement
                  const x = particle.vx * t; // Relative movement
                  yPath.push(particle.originY + y);
                  xPath.push(particle.originX + x);
                }

                return (
                  <motion.span
                    key={particle.id}
                    className="fixed text-4xl md:text-5xl pointer-events-none z-[9999]"
                    style={{ left: 0, top: 0 }}
                    initial={{ x: particle.originX, y: particle.originY, scale: 0.8, rotate: 0 }}
                    animate={{
                      x: xPath,
                      y: yPath,
                      scale: [0.8, 1.4, 1.1, 1],
                      rotate: particle.spin,
                    }}
                    transition={{
                      duration: duration,
                      ease: 'linear',
                      scale: { times: [0, 0.08, 0.3, 1] },
                    }}
                  >
                    {particle.emoji}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </h1>

          <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
            Powerful recruiting automation that pays for itself on day one.
          </p>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-12 px-6 bg-[hsl(220_20%_97%)]">
        <div className="max-w-4xl mx-auto">
          <div className="robot-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Corner screws */}
            <div className="absolute top-4 left-4 screw" />
            <div className="absolute top-4 right-4 screw" />
            <div className="absolute bottom-4 left-4 screw" />
            <div className="absolute bottom-4 right-4 screw" />

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[hsl(220_30%_15%)]">The Math That Sells Itself</h2>
                <p className="text-sm text-[hsl(220_15%_50%)]">Conservative estimates, real savings</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Input side */}
              <div className="space-y-4">
                <div className="bg-[hsl(220_15%_95%)] rounded-xl p-4">
                  <div className="text-sm text-[hsl(220_15%_50%)] mb-1">Average Recruiter Salary</div>
                  <div className="text-2xl font-black text-[hsl(220_30%_20%)]">${roiCalculation.recruiterSalary.toLocaleString()}/year</div>
                  <div className="text-xs text-[hsl(220_15%_60%)]">(~${roiCalculation.hourlyRate}/hour)</div>
                </div>
                <div className="bg-[hsl(220_15%_95%)] rounded-xl p-4">
                  <div className="text-sm text-[hsl(220_15%_50%)] mb-1">Time Saved Per Week</div>
                  <div className="text-2xl font-black text-[hsl(220_30%_20%)]">{roiCalculation.hoursSavedPerWeek} hours</div>
                  <div className="text-xs text-[hsl(220_15%_60%)]">(We typically see 4+ hours)</div>
                </div>
                <div className="bg-[hsl(220_15%_95%)] rounded-xl p-4">
                  <div className="text-sm text-[hsl(220_15%_50%)] mb-1">Skillomatic Cost (Standard)</div>
                  <div className="text-2xl font-black text-[hsl(220_30%_20%)]">${roiCalculation.skillomaticCost}/year</div>
                  <div className="text-xs text-[hsl(220_15%_60%)]">($79 × 12 months)</div>
                </div>
              </div>

              {/* Output side */}
              <div className="flex flex-col justify-center">
                <div className="robot-display rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="led-light led-green" />
                    <span className="text-xs font-mono text-cyan-400/60 tracking-wider uppercase">
                      ROI Calculated
                    </span>
                  </div>
                  <div className="text-5xl font-black text-cyan-400 digital-text mb-2">
                    {roiCalculation.roi}%
                  </div>
                  <div className="text-sm text-cyan-400/70 mb-4">Return on Investment</div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-cyan-400/20">
                    <div>
                      <div className="text-2xl font-black text-emerald-400">${roiCalculation.annualSavings.toLocaleString()}</div>
                      <div className="text-xs text-cyan-400/60">Annual savings/recruiter</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-amber-400">{roiCalculation.paybackWeeks} weeks</div>
                      <div className="text-xs text-cyan-400/60">Payback period</div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-[hsl(220_15%_50%)] mt-4 italic">
                  "Pays for itself if it saves each recruiter just 1 hour per week"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl p-6 stagger-fade-in ${
                    tier.highlight
                      ? 'robot-panel border-amber-400 ring-2 ring-amber-400/50'
                      : 'card-robot'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white ${
                      tier.badge === 'Limited Spots' ? 'bg-amber-500' : 'bg-purple-500'
                    }`}>
                      {tier.badge}
                    </div>
                  )}

                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-xl font-black text-[hsl(220_30%_15%)] mb-1">{tier.name}</h3>
                  <p className="text-sm text-[hsl(220_15%_50%)] mb-4">{tier.tagline}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-[hsl(220_30%_15%)]">{tier.price}</span>
                    <span className="text-[hsl(220_15%_50%)]">{tier.period}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[hsl(220_15%_40%)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={tier.ctaHref}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wide transition-all ${
                      tier.highlight
                        ? 'robot-button text-white border-0 hover:scale-105'
                        : 'bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] hover:bg-[hsl(220_15%_90%)]'
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-[hsl(220_15%_55%)] text-center mt-8">
            Only active users each month count towards billing. Pricing subject to change. <span className="text-primary font-semibold">1-year price lock guarantee</span> for all customers—if prices go up, yours won't.
          </p>
        </div>
      </section>

      {/* What We Handle vs What You Handle */}
      <section className="py-16 px-6 bg-[hsl(220_25%_10%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-10">
            What's Included? Everything You Need.
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="robot-display rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white">We Handle</h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Platform hosting & infrastructure',
                  'All recruiting skills & updates',
                  'Security & compliance',
                  'Customer support',
                  'New feature development',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-cyan-400/80">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="robot-display rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-white">You Handle</h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Your own LLM API keys (use your preferred provider)',
                  'Your recruiting data (stays in your browser)',
                  'Your ATS & email credentials',
                  'Deciding which candidates to hire 😉',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-400/80">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-[hsl(220_15%_50%)] mt-6 text-sm">
            Our ephemeral architecture means your sensitive data never touches our servers.
            <span className="text-cyan-400"> It's not a policy, it's the design.</span>
          </p>
        </div>
      </section>

      {/* FAQ - Common Objections */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] text-center mb-10">
            Questions? We've Got Answers.
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Why per-seat and not per-action?",
                a: "Simple: we hate surprise bills, and we bet you do too. Per-seat pricing means you know exactly what you're paying, and you can use Skillomatic as much as you want without watching a meter tick up. Plus, with BYOAI (bring your own AI), you're already paying for your LLM usage directly—we're not going to double-dip. Go wild.",
              },
              {
                q: "What if my team isn't technical?",
                a: "If they can type a message, they can use Skillomatic. Seriously. It's just chatting. We've seen recruiters who had never used an LLM become power users in their first session. The whole point is that there's no learning curve.",
              },
              {
                q: "Can I try it before committing?",
                a: "Apply to be a design partner and get 3 months free. We'll work closely with you to make sure Skillomatic fits your workflow. Plus you'll get to shape the product's future. Win-win.",
              },
              {
                q: "What's with the ephemeral architecture?",
                a: "Your recruiting data (candidate info, messages, etc.) never touches our servers. LLM calls go directly from your browser to Anthropic/OpenAI. We literally can't see your data, which makes security reviews a breeze.",
              },
              {
                q: "Do you have a free tier?",
                a: "Not exactly, but our design partner program is free for 3 months. After that, the lowest tier is $59/user with our volume plan. Think of it this way: if Skillomatic saves you just 2 hours a month, it's paid for itself.",
              },
            ].map((faq, i) => (
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
          <Crown className="h-10 w-10 text-white mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Stop Switching Tabs?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join our design partner program and help us build the future of recruiting automation.
            Free for 3 months, then lock in founder pricing forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:email@skillomatic.technology?subject=Design%20Partner%20Application"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <Crown className="h-5 w-5" />
              Become a Design Partner
            </a>
            <a
              href="mailto:email@skillomatic.technology?subject=Demo%20Request"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Request Demo Video
            </a>
          </div>

          {/* Disco mode button - visible easter egg */}
          <button
            onClick={() => setDiscoMode(!discoMode)}
            className={`mt-8 px-4 py-2 rounded-full text-xs font-medium transition-all border border-white/20 ${
              discoMode
                ? 'bg-white text-primary'
                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white glow-hint'
            }`}
          >
            <Sparkles className="h-3 w-3 inline mr-1" />
            {discoMode ? 'Party Mode ON' : 'Party Mode'}
          </button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
