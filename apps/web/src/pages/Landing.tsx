/**
 * Landing Page
 *
 * Public landing page for Skillomatic with robot vending machine theme.
 * Shows features, pricing, and call-to-action for login/signup.
 */
import { useState } from 'react';
import { Zap, Plug, MessageSquare, Shield, Rocket, ArrowRight, CheckCircle, Sparkles, Monitor, Database, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const vendingItems = [
  {
    id: 'data',
    code: 'A1',
    label: 'LIVE DATA',
    description: 'Connected to your ATS, LinkedIn, and email in real-time. No stale training data.',
    icon: Database,
    color: 'cyan',
    rotation: -0.75,
    flipAxis: 'Y', // left-right
  },
  {
    id: 'precision',
    code: 'A2',
    label: 'PRECISION',
    description: 'Every action executed exactly as requested. No retries. No corrections needed.',
    icon: Target,
    color: 'green',
    rotation: 0.5,
    flipAxis: 'X', // up-down
  },
  {
    id: 'truth',
    code: 'B1',
    label: 'GROUNDED',
    description: 'Every fact verified against your real systems. Zero hallucinations.',
    icon: CheckCircle,
    color: 'amber',
    rotation: 0.5,
    flipAxis: '-Y', // right-left
  },
  {
    id: 'control',
    code: 'B2',
    label: 'CONTROL',
    description: 'AI suggests, you decide. Review and approve every action before it happens.',
    icon: Shield,
    color: 'purple',
    rotation: -0.5,
    flipAxis: '-X', // down-up
  },
];

function DifferentiatorSection() {
  const [flipped, setFlipped] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());

  const handleFlip = (code: string) => {
    if (flipped === code) {
      setFlipped(null);
    } else {
      setFlipped(code);
      setDiscovered(prev => new Set(prev).add(code));
    }
  };

  const allDiscovered = discovered.size === 4;

  return (
    <section className="py-24 px-6 bg-[hsl(220_25%_12%)]">
      <div className="max-w-5xl mx-auto">
        {/* Vending Machine */}
        <div className="robot-panel rounded-3xl p-8 md:p-12 max-w-3xl mx-auto relative">
          {/* Corner screws */}
          <div className="absolute top-5 left-5 screw" />
          <div className="absolute top-5 right-5 screw" />
          <div className="absolute bottom-5 left-5 screw" />
          <div className="absolute bottom-5 right-5 screw" />

          {/* Top display with title */}
          <div className="robot-display rounded-2xl p-8 mb-8 relative overflow-hidden">
            {/* Scan line effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse pointer-events-none" />

            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="led-light led-green" />
              <div className="led-light led-orange" />
              <div className="led-light led-cyan" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-center digital-text tracking-tight">
              <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Overdelivered,</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                Underpriced
              </span>
            </h2>
          </div>

          {/* Product slots - 2x2 grid with flip cards */}
          <div className="grid grid-cols-2 gap-5">
            {vendingItems.map((item) => {
              const Icon = item.icon;
              const isFlipped = flipped === item.code;
              const colorStyles = {
                cyan: {
                  glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3),inset_0_1px_0_rgba(34,211,238,0.2)]',
                  border: 'border-cyan-400/60',
                  accent: 'text-cyan-400',
                  iconBg: 'bg-cyan-400/20',
                },
                green: {
                  glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3),inset_0_1px_0_rgba(34,197,94,0.2)]',
                  border: 'border-green-400/60',
                  accent: 'text-green-400',
                  iconBg: 'bg-green-400/20',
                },
                amber: {
                  glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3),inset_0_1px_0_rgba(251,191,36,0.2)]',
                  border: 'border-amber-400/60',
                  accent: 'text-amber-400',
                  iconBg: 'bg-amber-400/20',
                },
                purple: {
                  glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(168,85,247,0.2)]',
                  border: 'border-purple-400/60',
                  accent: 'text-purple-400',
                  iconBg: 'bg-purple-400/20',
                },
              }[item.color];

              return (
                <div
                  key={item.id}
                  onClick={() => handleFlip(item.code)}
                  className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    perspective: '1000px',
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                >
                  <div
                    className="relative h-56 transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped
                        ? `rotate${item.flipAxis.replace('-', '')}(${item.flipAxis.startsWith('-') ? '-' : ''}180deg)`
                        : 'rotate(0deg)',
                    }}
                  >
                    {/* Front - Card back pattern */}
                    <div
                      className="absolute inset-0 rounded-xl border-[3px] border-white/20 bg-gradient-to-br from-[hsl(220_30%_25%)] via-[hsl(220_25%_18%)] to-[hsl(220_30%_12%)] p-4 flex flex-col items-center justify-center hover:border-white/40 transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Card back pattern */}
                      <div className="absolute inset-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)`
                      }} />

                      {/* Center icon */}
                      <div className={`relative h-20 w-20 rounded-2xl ${colorStyles.iconBg} flex items-center justify-center shadow-lg border border-white/10`}>
                        <Icon className={`h-10 w-10 ${colorStyles.accent}`} />
                      </div>

                      {/* Corner codes */}
                      <div className={`absolute top-3 left-3 text-xs font-bold ${colorStyles.accent}`}>
                        {item.code}
                      </div>
                      <div className={`absolute bottom-3 right-3 text-xs font-bold ${colorStyles.accent} rotate-180`}>
                        {item.code}
                      </div>
                    </div>

                    {/* Back - Card face with content */}
                    <div
                      className={`absolute inset-0 rounded-xl border-[3px] ${colorStyles.border} bg-gradient-to-br from-[hsl(220_25%_22%)] via-[hsl(220_20%_16%)] to-[hsl(220_25%_12%)] ${colorStyles.glow} p-5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.4)]`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: `rotate${item.flipAxis.replace('-', '')}(180deg)`,
                      }}
                    >
                      {/* Corner codes */}
                      <div className={`absolute top-3 left-3 text-xs font-bold ${colorStyles.accent}`}>
                        {item.code}
                      </div>
                      <div className={`absolute bottom-3 right-3 text-xs font-bold ${colorStyles.accent} rotate-180`}>
                        {item.code}
                      </div>

                      {/* Content centered */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className={`font-black text-xl ${colorStyles.accent} mb-3 text-center`}>
                          {item.label}
                        </div>
                        <div className="text-sm text-white/70 leading-relaxed text-center">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dispenser slot with tagline */}
          <div className="dispense-slot rounded-xl p-4 mt-6 text-center min-h-[52px]">
            {allDiscovered ? (
              <p className="text-white/50 text-sm font-mono animate-fade-in">
                Other AI locks you in. We connect to{' '}
                <span className="text-cyan-400">everything</span> and work with{' '}
                <span className="text-primary">any AI</span>.
              </p>
            ) : (
              <p className="text-white/30 text-xs font-mono">
                {4 - discovered.size} more to discover
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: 'Instant Skills',
    description: 'Pre-built recruiting automations ready to use. Search candidates, sync with your ATS, send personalized outreach.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500',
  },
  {
    icon: Plug,
    title: 'One-Click Integrations',
    description: 'Connect Greenhouse, Lever, Gmail, Outlook, and more. Simple OAuth setup in seconds.',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  {
    icon: Monitor,
    title: 'Use Your Favorite AI',
    description: 'Works with Claude Desktop, ChatGPT, and other AI chat apps. Or use our built-in web chatbot.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your credentials stay secure. Full control over your data and integrations.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
  },
];

const steps = [
  { number: '01', title: 'Connect Your Tools', description: 'Link your ATS, email, calendar, and browser extension' },
  { number: '02', title: 'Choose Your AI', description: 'Use our web chat or your favorite desktop app' },
  { number: '03', title: 'Start Recruiting', description: 'Chat naturally to automate your workflow' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
                <Sparkles className="h-3 w-3 mr-1" />
                Works with Any AI Chat App
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
                Recruiting Skills,{' '}
                <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
                  Dispensed on Demand
                </span>
              </h1>
              <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-xl mx-auto lg:mx-0">
                Powerful recruiting automations that work with your favorite AI. Use our web chatbot,
                Claude Desktop, ChatGPT, or any BYOAI app to search candidates, sync with your ATS, and send personalized outreach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl robot-button text-white font-bold tracking-wide text-lg border-0"
                >
                  Request Demo Video
                  <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* Right - Vending Machine Illustration */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                {/* Vending machine body */}
                <div className="w-72 md:w-80 robot-panel rounded-3xl p-6 relative">
                  {/* Corner screws */}
                  <div className="absolute top-4 left-4 screw" />
                  <div className="absolute top-4 right-4 screw" />
                  <div className="absolute bottom-4 left-4 screw" />
                  <div className="absolute bottom-4 right-4 screw" />

                  {/* Display screen */}
                  <div className="robot-display rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="led-light led-green" />
                      <div className="led-light led-orange" />
                      <div className="led-light led-cyan" />
                      <span className="text-[10px] font-mono text-cyan-400/60 tracking-wider ml-auto">
                        READY
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-cyan-400 digital-text mb-1">
                        12
                      </div>
                      <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
                        Skills Available
                      </div>
                    </div>
                  </div>

                  {/* Skill slots */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['ATS', 'EMAIL', 'CAL', 'LINK', 'SRCH', 'SYNC'].map((skill, i) => (
                      <div
                        key={skill}
                        className="aspect-square rounded-lg bg-[hsl(220_15%_97%)] border-2 border-[hsl(220_15%_88%)] flex items-center justify-center stagger-fade-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className="text-[10px] font-black text-[hsl(220_20%_50%)]">{skill}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dispenser slot */}
                  <div className="dispense-slot h-16 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-cyan-400/50" />
                  </div>

                  {/* Coin slot */}
                  <div className="flex justify-center mt-4">
                    <div className="coin-slot" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bold Differentiator Section */}
      <DifferentiatorSection />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Up and Running in just a few minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl robot-display flex items-center justify-center mx-auto">
                    <span className="text-3xl font-black text-cyan-400 digital-text">
                      {step.number}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-[hsl(220_15%_85%)]" />
                  )}
                </div>
                <h3 className="text-xl font-black text-[hsl(220_30%_20%)] mb-2">
                  {step.title}
                </h3>
                <p className="text-[hsl(220_15%_45%)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Chat example */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="robot-panel rounded-2xl overflow-hidden">
              <div className="bg-[hsl(220_15%_88%)] px-4 py-2 flex items-center gap-2 border-b-2 border-[hsl(220_15%_80%)]">
                <div className="led-light led-green" />
                <span className="text-xs font-medium text-[hsl(220_15%_50%)]">AI Chat</span>
              </div>
              <div className="bg-white p-4 space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                    Find senior engineers in San Francisco
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-green-500" />
                    Found 24 candidates in Greenhouse matching your criteria.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary/10 text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                    Send them a personalized intro email
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[hsl(220_15%_95%)] text-[hsl(220_20%_30%)] px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%] text-sm">
                    <CheckCircle className="h-4 w-4 inline mr-2 text-green-500" />
                    Drafted personalized emails for 24 candidates. Ready to review!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Supercharge Your Recruiting?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            We're looking for design partners to shape the future of recruiting automation.
            Get early access and help us build the product you need.
          </p>
          <a
            href="mailto:email@skillomatic.technology?subject=Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20see%20a%20demo%20of%20Skillomatic."
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            Request Demo Video
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
