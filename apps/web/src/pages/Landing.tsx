/**
 * Landing Page
 *
 * Public landing page for Skillomatic with robot vending machine theme.
 * Shows features, pricing, and call-to-action for login/signup.
 */
import { useState } from 'react';
import { MessageSquare, Shield, Rocket, ArrowRight, CheckCircle, Sparkles, Database, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter } from '@/components/marketing';

const vendingItems = [
  {
    id: 'data',
    label: 'YOUR OWN LIVE DATA',
    description: 'Connected to your ATS, LinkedIn, and email in real-time. No stale training data.',
    icon: Database,
    color: 'cyan',
    led: 'led-cyan',
    rotation: -0.75,
  },
  {
    id: 'precision',
    label: 'UNPARALLELED PRECISION',
    description: 'Every action executed exactly as requested. No retries. No corrections needed.',
    icon: Target,
    color: 'green',
    led: 'led-green',
    rotation: 0.5,
  },
  {
    id: 'truth',
    label: 'TOTALLY GROUNDED',
    description: 'Every fact verified against your real systems. Zero hallucinations.',
    icon: CheckCircle,
    color: 'amber',
    led: 'led-amber',
    rotation: 0.5,
  },
  {
    id: 'control',
    label: 'ABSOLUTE CONTROL',
    description: 'AI suggests, you decide. Review and approve every action before it happens.',
    icon: Shield,
    color: 'purple',
    led: 'led-purple',
    rotation: -0.5,
  },
];

const flipAxes = ['X', '-X', 'Y', '-Y'] as const;

function DifferentiatorSection() {
  const [flipped, setFlipped] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [flipAxisMap, setFlipAxisMap] = useState<Record<string, string>>({});

  const handleFlip = (id: string) => {
    if (flipped === id) {
      setFlipped(null);
    } else {
      // Assign a random flip axis each time a card is flipped
      const randomAxis = flipAxes[Math.floor(Math.random() * flipAxes.length)];
      setFlipAxisMap(prev => ({ ...prev, [id]: randomAxis }));
      setFlipped(id);
      setDiscovered(prev => new Set(prev).add(id));
    }
  };

  const allDiscovered = discovered.size === 4;

  // Find the first undiscovered card to entice the user
  const nextToDiscover = vendingItems.find(item => !discovered.has(item.id))?.id;

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

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-center digital-text tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Vibe</span>
              <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"> Recruiting</span>
            </h2>
          </div>

          {/* Product slots - 2x2 grid with flip cards */}
          <div className="grid grid-cols-2 gap-5">
            {vendingItems.map((item) => {
              const Icon = item.icon;
              const isFlipped = flipped === item.id;
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
              }[item.color] ?? {
                glow: '',
                border: 'border-white/40',
                accent: 'text-white',
                iconBg: 'bg-white/20',
              };

              return (
                <div
                  key={item.id}
                  onClick={() => handleFlip(item.id)}
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
                      transform: isFlipped && flipAxisMap[item.id]
                        ? `rotate${flipAxisMap[item.id].replace('-', '')}(${flipAxisMap[item.id].startsWith('-') ? '-' : ''}180deg)`
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

                      {/* Corner LED - blinks to entice user to click next undiscovered card */}
                      <div
                        className={`absolute top-3 left-3 led-light ${item.led}`}
                        style={{ width: 10, height: 10, animation: item.id === nextToDiscover ? undefined : 'none' }}
                      />
                    </div>

                    {/* Back - Card face with content */}
                    <div
                      className={`absolute inset-0 rounded-xl border-[3px] ${colorStyles.border} bg-gradient-to-br from-[hsl(220_25%_22%)] via-[hsl(220_20%_16%)] to-[hsl(220_25%_12%)] ${colorStyles.glow} p-5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.4)]`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: flipAxisMap[item.id]
                          ? `rotate${flipAxisMap[item.id].replace('-', '')}(180deg)`
                          : 'rotateY(180deg)',
                      }}
                    >
                      {/* Corner LED - blinks to entice user to click next undiscovered card */}
                      <div
                        className={`absolute top-3 left-3 led-light ${item.led}`}
                        style={{ width: 10, height: 10, animation: item.id === nextToDiscover ? undefined : 'none' }}
                      />

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

const setupSteps = [
  { id: 'start-here', number: '0', title: '', description: '', color: 'gray', size: 72 },
  { id: 'connect', number: '1', title: 'Connect Your Tools', description: 'Link your ATS, email, calendar, and browser extension', color: 'cyan', size: 100 },
  { id: 'choose', number: '2', title: 'Choose Your AI', description: 'Use our web chat or your favorite desktop app', color: 'green', size: 140 },
  { id: 'start', number: '3', title: 'Start Recruiting', description: 'Chat naturally to automate your workflow', color: 'amber', size: 200 },
  { id: 'go', number: "LET'S GO", title: "You're Ready!", description: 'Start recruiting smarter today', color: 'primary', size: 280, isLink: true },
];

function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [extraOs, setExtraOs] = useState(0);

  const handlePress = () => {
    if (currentStep < setupSteps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleLetsGo = () => {
    // Add O's rapidly over 2 seconds, then navigate
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setExtraOs(count);
      if (count >= 40) {
        clearInterval(interval);
        window.location.href = '/login';
      }
    }, 50);
  };

  const allDone = currentStep >= setupSteps.length;
  const activeStep = allDone ? null : setupSteps[currentStep];

  const colorStyles = {
    gray: { bg: 'bg-gray-400', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.4)]', text: 'text-gray-600' },
    cyan: { bg: 'bg-cyan-500', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.5)]', text: 'text-cyan-600' },
    green: { bg: 'bg-green-500', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.5)]', text: 'text-green-600' },
    amber: { bg: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]', text: 'text-amber-600' },
    primary: { bg: 'bg-primary', glow: 'shadow-[0_0_40px_rgba(249,115,22,0.6)]', text: 'text-primary' },
  };

  return (
    <section id="how-it-works" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4 transition-opacity duration-500"
            style={{ opacity: Math.pow(0.5, currentStep) }}
          >
            Up and Running in just a few minutes
          </h2>
        </div>

        {/* Single button area */}
        <div className="flex flex-col items-center mb-10">
          {activeStep && (
            <>
              {/* Fixed-height container for button - prevents layout shift */}
              <div className="h-[280px] flex items-center justify-center">
                {/* Growing button - either final CTA or step button */}
                {(activeStep as typeof setupSteps[number] & { isLink?: boolean }).isLink ? (
                  <button
                    onClick={handleLetsGo}
                    className={`
                      rounded-full font-black text-white flex items-center justify-center
                      whitespace-nowrap overflow-hidden
                      ${colorStyles[activeStep.color as keyof typeof colorStyles].bg}
                      ${colorStyles[activeStep.color as keyof typeof colorStyles].glow}
                      hover:scale-110 active:scale-95 cursor-pointer
                      border-4 border-b-8 border-white/30
                      active:border-b-4
                    `}
                    style={{
                      width: activeStep.size,
                      height: activeStep.size,
                      fontSize: activeStep.size * 0.14,
                      transform: `scale(${1 + Math.pow(extraOs / 40, 2) * 5})`,
                      zIndex: extraOs > 0 ? 9999 : undefined,
                    }}
                  >
                    LET'S G{'O'.repeat(1 + extraOs)}
                  </button>
                ) : (
                  <button
                    onClick={handlePress}
                    className={`
                      rounded-full font-black text-white
                      transition-all duration-500 transform
                      ${colorStyles[activeStep.color as keyof typeof colorStyles].bg}
                      ${colorStyles[activeStep.color as keyof typeof colorStyles].glow}
                      hover:scale-110 active:scale-95 cursor-pointer
                      border-4 border-b-8 border-white/30
                      active:border-b-4
                    `}
                    style={{
                      width: activeStep.size,
                      height: activeStep.size,
                      fontSize: activeStep.size * 0.4,
                    }}
                  >
                    {activeStep.number}
                  </button>
                )}
              </div>

              {/* Current step info - scales with button size */}
              {activeStep.title && (
                <div
                  className="mt-6 text-center transition-transform duration-500 origin-top"
                  style={{ transform: `scale(${0.8 + (activeStep.size / 280) * 0.6})` }}
                >
                  <h3 className={`text-xl font-black ${colorStyles[activeStep.color as keyof typeof colorStyles].text}`}>
                    {activeStep.title}
                  </h3>
                  <p className="text-[hsl(220_15%_45%)] mt-1 max-w-md">
                    {activeStep.description}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress: completed steps as small indicators (steps 1-3, skip 0) */}
        <div className="flex justify-center gap-3 mb-8">
          {setupSteps.slice(1, 4).map((step, index) => {
            const isDone = index + 1 < currentStep;
            const styles = colorStyles[step.color as keyof typeof colorStyles];

            return (
              <div
                key={step.id}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300
                  ${isDone
                    ? `${styles.bg} text-white`
                    : 'bg-gray-200 text-gray-400'
                  }
                `}
              >
                {isDone ? '✓' : step.number}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

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

      {/* How It Works - Interactive Boot Sequence */}
      <HowItWorksSection />

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
