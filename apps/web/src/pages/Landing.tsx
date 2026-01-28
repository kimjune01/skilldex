/**
 * Landing Page
 *
 * Solopreneur/Trades/Founder focused landing page.
 * "Your spreadsheet becomes smart"
 */
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Zap, CheckCircle, Calendar, FileSpreadsheet, Database, Bot, PenLine, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MarketingNav, MarketingFooter, DemoRevealGame } from '@/components/marketing';

const workflowExamples = [
  {
    category: 'Money',
    icon: FileSpreadsheet,
    color: 'green',
    tasks: [
      '"Who owes me money?" → lists overdue invoices',
      '"Mark Johnson as paid" → updates your sheet',
      '"How did I do last week?" → revenue summary',
      '"Log $85 for parts" → adds to expenses',
    ],
  },
  {
    category: 'Clients & Leads',
    icon: Database,
    color: 'cyan',
    tasks: [
      '"Follow up with cold leads" → drafts emails',
      '"What\'s the status with Acme?" → full context',
      '"Add note: discussed Phase 2" → saves to sheet',
      '"Send reminder to Smith" → emails + logs it',
    ],
  },
  {
    category: 'Daily Ops',
    icon: Calendar,
    color: 'amber',
    tasks: [
      '"What\'s on my plate today?" → full briefing',
      '"Done with the proposal" → marks complete',
      '"Remind me to call insurance" → adds task',
      '"Prep me for my 2pm" → meeting context',
    ],
  },
];

// Interactive flip cards data
const benefitCards = [
  {
    id: 'write',
    label: 'ACTUALLY UPDATES YOUR DATA',
    description: 'Not just answers. Marks invoices paid. Logs expenses. Checks off tasks.',
    icon: PenLine,
    color: 'cyan',
    led: 'led-cyan',
    rotation: -0.75,
  },
  {
    id: 'fast',
    label: 'NO NEW TOOLS',
    description: 'Works with Gmail, Calendar, Sheets, Stripe. Tools you already have.',
    icon: FileSpreadsheet,
    color: 'green',
    led: 'led-green',
    rotation: 0.5,
  },
  {
    id: 'ai',
    label: 'WORKS WITH YOUR AI',
    description: 'Claude, ChatGPT, or any MCP-compatible app you already use.',
    icon: Bot,
    color: 'amber',
    led: 'led-amber',
    rotation: 0.5,
  },
  {
    id: 'control',
    label: 'YOU STAY IN CONTROL',
    description: 'Review and approve actions. Your data, your rules.',
    icon: Shield,
    color: 'purple',
    led: 'led-purple',
    rotation: -0.5,
  },
];

const flipAxes = ['X', '-X', 'Y', '-Y'] as const;

// Interactive How It Works steps with growing buttons
const setupSteps = [
  { id: 'start-here', number: '0', title: '', description: '', color: 'gray', size: 72 },
  { id: 'connect', number: '1', title: 'Connect Your Tools', description: 'Gmail, Calendar, your spreadsheet. 5 minutes.', color: 'cyan', size: 100 },
  { id: 'ask', number: '2', title: 'Just Ask', description: '"Who owes me money?" "What\'s on my plate?"', color: 'green', size: 140 },
  { id: 'done', number: '3', title: 'Watch It Update', description: 'Your spreadsheet changes. Loop closed.', color: 'amber', size: 200 },
  { id: 'go', number: "LET'S GO", title: "Ready to try it?", description: 'Book a free call or try self-serve', color: 'primary', size: 280, isLink: true },
];

function BenefitsSection() {
  const [flipped, setFlipped] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [flipAxisMap, setFlipAxisMap] = useState<Record<string, string>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleFlip = (id: string, element: HTMLDivElement | null) => {
    if (flipped === id) {
      setFlipped(null);
    } else {
      // Assign a random flip axis each time a card is flipped
      const randomAxis = flipAxes[Math.floor(Math.random() * flipAxes.length)];
      setFlipAxisMap(prev => ({ ...prev, [id]: randomAxis }));
      setFlipped(id);

      // Check if this is the last card
      const isLastCard = id === 'control' && discovered.size === 3;

      if (isLastCard) {
        // Delay the reveal of the final message by 800ms
        setTimeout(() => {
          setDiscovered(prev => new Set(prev).add(id));
        }, 800);
      } else {
        setDiscovered(prev => new Set(prev).add(id));
      }

      // Scroll card into center view on mobile (single column layout)
      if (element && window.innerWidth < 640) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  const allDiscovered = discovered.size === 4;

  // Find the first undiscovered card to entice the user
  const nextToDiscover = benefitCards.find(item => !discovered.has(item.id))?.id;

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-[hsl(220_25%_12%)]">
      <div className="max-w-5xl mx-auto">
        {/* Vending Machine */}
        <div className="robot-panel rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-12 max-w-3xl mx-auto relative">
          {/* Corner screws */}
          <div className="absolute top-3 left-3 md:top-5 md:left-5 screw" />
          <div className="absolute top-3 right-3 md:top-5 md:right-5 screw" />
          <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 screw" />
          <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5 screw" />

          {/* Top display with title */}
          <div className="robot-display rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 md:mb-8 relative overflow-hidden">
            {/* Scan line effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse pointer-events-none" />

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-center digital-text tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Why</span>
              <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"> Skillomatic?</span>
            </h2>
          </div>

          {/* Product slots - 1 column on mobile, 2x2 grid on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 md:gap-5">
            {benefitCards.map((item) => {
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
                  ref={(el) => { cardRefs.current[item.id] = el; }}
                  onClick={(e) => handleFlip(item.id, e.currentTarget)}
                  className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  style={{
                    perspective: '1000px',
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                >
                  <div
                    className="relative h-40 sm:h-48 md:h-56 transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped && flipAxisMap[item.id]
                        ? `rotate${flipAxisMap[item.id].replace('-', '')}(${flipAxisMap[item.id].startsWith('-') ? '-' : ''}180deg)`
                        : 'rotate(0deg)',
                    }}
                  >
                    {/* Front - Card back pattern */}
                    <div
                      className="absolute inset-0 rounded-lg md:rounded-xl border-2 md:border-[3px] border-white/20 bg-gradient-to-br from-[hsl(220_30%_25%)] via-[hsl(220_25%_18%)] to-[hsl(220_30%_12%)] p-3 md:p-4 flex flex-col items-center justify-center hover:border-white/40 transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Card back pattern */}
                      <div className="absolute inset-2 md:inset-3 rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)`
                      }} />

                      {/* Center icon */}
                      <div className={`relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-xl md:rounded-2xl ${colorStyles.iconBg} flex items-center justify-center shadow-lg border border-white/10`}>
                        <Icon className={`h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 ${colorStyles.accent}`} />
                      </div>

                      {/* Corner LED - blinks to entice user to click next undiscovered card */}
                      <div
                        className={`absolute top-2 left-2 md:top-3 md:left-3 led-light ${item.led}`}
                        style={{ width: 8, height: 8, animation: item.id === nextToDiscover ? undefined : 'none' }}
                      />
                    </div>

                    {/* Back - Card face with content */}
                    <div
                      className={`absolute inset-0 rounded-lg md:rounded-xl border-2 md:border-[3px] ${colorStyles.border} bg-gradient-to-br from-[hsl(220_25%_22%)] via-[hsl(220_20%_16%)] to-[hsl(220_25%_12%)] ${colorStyles.glow} p-3 sm:p-4 md:p-5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.4)]`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: flipAxisMap[item.id]
                          ? `rotate${flipAxisMap[item.id].replace('-', '')}(180deg)`
                          : 'rotateY(180deg)',
                      }}
                    >
                      {/* Corner LED - blinks to entice user to click next undiscovered card */}
                      <div
                        className={`absolute top-2 left-2 md:top-3 md:left-3 led-light ${item.led}`}
                        style={{ width: 8, height: 8, animation: item.id === nextToDiscover ? undefined : 'none' }}
                      />

                      {/* Content centered */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className={`font-black text-sm sm:text-base md:text-xl ${colorStyles.accent} mb-1 sm:mb-2 md:mb-3 text-center leading-tight`}>
                          {item.label}
                        </div>
                        <div className="text-xs sm:text-sm text-white/70 leading-snug sm:leading-relaxed text-center">
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
          <div className="dispense-slot rounded-lg md:rounded-xl p-3 md:p-4 mt-4 md:mt-6 text-center min-h-[44px] md:min-h-[52px]">
            {allDiscovered ? (
              <p className="text-white/50 text-xs sm:text-sm font-mono animate-reveal-ltr">
                AI that{' '}
                <span className="text-cyan-400">actually works</span>. Ask questions,{' '}
                <span className="text-primary">get things done</span>.
              </p>
            ) : (
              <p className="text-white/30 text-[10px] sm:text-xs font-mono">
                {4 - discovered.size} more to discover
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

// Use case carousel data - solopreneurs, trades, founders
const useCases = [
  {
    id: 'solopreneur',
    category: 'Solopreneur',
    color: 'cyan',
    before: "I'd open Stripe, then my invoice spreadsheet, then Gmail to chase down who owes me money. Usually forgot someone.",
    after: "Who owes me money? ... Mark Johnson as paid.",
    persona: "Freelance Designer",
    animal: '🦊',
    glasses: '👓',
  },
  {
    id: 'trades',
    category: 'Trades',
    color: 'green',
    before: "End of day, I'm tired. Logging jobs in the spreadsheet? Tracking expenses? It never happened consistently.",
    after: "Finished the Johnson bathroom, $450. Spent $85 on parts.",
    persona: "Plumber",
    animal: '🦁',
    glasses: '🧢',
  },
  {
    id: 'consultant',
    category: 'Consultant',
    color: 'amber',
    before: "Before every client call, I'd dig through email threads, check if they paid their last invoice, look for my notes. 15 minutes gone.",
    after: "Prep me for my 2pm with Acme. Add note: discussed Phase 2.",
    persona: "Business Consultant",
    animal: '🐻',
    glasses: '👓',
  },
  {
    id: 'founder',
    category: 'Founder',
    color: 'purple',
    before: "Monday morning I'd check Stripe, then my pipeline spreadsheet, then calendar, then email. Just to know what needed attention.",
    after: "What's on my plate today? ... Done with the proposal.",
    persona: "Solo Founder",
    animal: '🐰',
    glasses: '🕶️',
  },
];

function UseCaseCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentCase = useCases[currentIndex];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % useCases.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % useCases.length);
    setIsAutoPlaying(false);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + useCases.length) % useCases.length);
    setIsAutoPlaying(false);
  };

  const colorStyles = {
    cyan: {
      badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      accent: 'text-cyan-500',
      dot: 'bg-cyan-500',
    },
    green: {
      badge: 'bg-green-100 text-green-700 border-green-200',
      accent: 'text-green-500',
      dot: 'bg-green-500',
    },
    amber: {
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      accent: 'text-amber-500',
      dot: 'bg-amber-500',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-700 border-purple-200',
      accent: 'text-purple-500',
      dot: 'bg-purple-500',
    },
  }[currentCase.color];

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-[hsl(220_25%_97%)] to-[hsl(220_20%_94%)]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-10 text-center">
          Stop copy-pasting. Start asking.
        </h2>

        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={goPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 h-10 w-10 rounded-full bg-white border border-[hsl(220_20%_88%)] shadow-md flex items-center justify-center text-[hsl(220_15%_40%)] hover:bg-[hsl(220_20%_96%)] transition-colors z-10"
            aria-label="Previous use case"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 h-10 w-10 rounded-full bg-white border border-[hsl(220_20%_88%)] shadow-md flex items-center justify-center text-[hsl(220_15%_40%)] hover:bg-[hsl(220_20%_96%)] transition-colors z-10"
            aria-label="Next use case"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-[hsl(220_20%_88%)] shadow-lg overflow-hidden">
            {/* Category badge */}
            <div className="flex justify-center mb-6">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${colorStyles?.badge}`}>
                {currentCase.category}
              </span>
            </div>

            {/* Before/After */}
            <div className="space-y-8">
              {/* Before */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded">BEFORE</span>
                  <div className="h-px flex-1 bg-red-100"></div>
                </div>
                <p className="text-[hsl(220_15%_35%)] leading-relaxed pl-1">
                  {currentCase.before}
                </p>
              </div>

              {/* After */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-green-100 text-green-600 text-xs font-bold px-2.5 py-1 rounded">NOW</span>
                  <div className="h-px flex-1 bg-green-100"></div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-[hsl(220_25%_20%)] leading-snug pl-1">
                  "{currentCase.after}"
                </p>
              </div>
            </div>

            {/* Persona */}
            <div className="flex items-center justify-center gap-4 mt-10 pt-6 border-t border-[hsl(220_20%_92%)]">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm relative">
                <span className="text-4xl">{currentCase.animal}</span>
                <span className={`absolute ${currentCase.glasses === '🧢' ? 'text-3xl top-1' : 'text-2xl top-3'}`}>{currentCase.glasses}</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-[hsl(220_20%_30%)]">Could be you</div>
                <div className="text-sm text-[hsl(220_15%_50%)]">{currentCase.persona}</div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {useCases.map((uc, index) => (
              <button
                key={uc.id}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? `w-8 ${colorStyles?.dot}`
                    : 'w-2.5 bg-[hsl(220_15%_80%)] hover:bg-[hsl(220_15%_70%)]'
                }`}
                aria-label={`Go to ${uc.category} use case`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-[hsl(220_15%_45%)] mb-3">
            Real workflows. Your existing spreadsheet. No new tools to learn.
          </p>
          <a
            href="https://cal.com/june-kim-mokzq0/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
          >
            See how it works for you
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [extraOs, setExtraOs] = useState(0);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const handlePress = () => {
    if (currentStep < setupSteps.length) {
      setCurrentStep(prev => prev + 1);
      // Scroll button into center view after state update
      setTimeout(() => {
        buttonContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
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
        window.open('https://cal.com/june-kim-mokzq0/30min', '_blank');
        // Reset after redirect
        setTimeout(() => {
          setCurrentStep(0);
          setExtraOs(0);
        }, 500);
      }
    }, 60);
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
    <section id="how-it-works" className="py-20 px-6 bg-[hsl(220_20%_97%)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4 transition-opacity duration-500"
            style={{ opacity: Math.max(0.2, Math.pow(0.6, currentStep)) }}
          >
            How It Works
          </h2>
          <p
            className="text-[hsl(220_15%_45%)] max-w-2xl mx-auto transition-opacity duration-500"
            style={{ opacity: Math.max(0.2, Math.pow(0.6, currentStep)) }}
          >
            Connect your tools. Ask questions. Watch your data update.
          </p>
        </div>

        {/* Single button area */}
        <div ref={buttonContainerRef} className="flex flex-col items-center mb-10">
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

              {/* Current step info - fixed height container to prevent layout shift */}
              <div className="mt-6 h-[72px] flex items-start justify-center">
                {activeStep.title && (
                  <div
                    className="text-center transition-transform duration-500 origin-top"
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
              </div>
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
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 font-bold">
            <Zap className="h-3 w-3 mr-1" />
            If AI Can Do It, AI Should
          </Badge>
          <p className="text-lg md:text-xl text-[hsl(220_15%_45%)] mb-4">
            You didn't start your business to do busywork.
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[hsl(220_30%_15%)] tracking-tight mb-6">
            Just Tell AI To Do
            <br />
            <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
              The Paperwork
            </span>
          </h1>
          <p className="text-lg text-[hsl(220_15%_45%)] mb-8 max-w-2xl mx-auto">
            Connected to your email, calendar, spreadsheets, and the tools you already use.
            Ask "who owes me money?" and mark them paid. Ask "what's on my plate?" and check things off.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center justify-center px-8 py-4 rounded-xl robot-button text-white font-black tracking-wide text-lg border-0"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                See It In Action
              </span>
              <span className="text-xs font-medium text-white/70 mt-1">Free 30-min call</span>
            </a>
            <Link
              to="/self-serve"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[hsl(220_15%_92%)] border-2 border-[hsl(220_15%_82%)] text-[hsl(220_20%_35%)] font-bold tracking-wide text-lg hover:bg-[hsl(220_15%_88%)] transition-colors"
            >
              Or Try It Yourself
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="py-20 px-6 bg-gradient-to-b from-[hsl(220_30%_97%)] to-[hsl(220_25%_93%)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-[hsl(220_30%_15%)] mb-4 text-center">
            Sound familiar?
          </h2>
          <p className="text-[hsl(220_15%_50%)] text-center mb-10 max-w-xl mx-auto">
            Your tools don't talk to each other. You're the middleware.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 text-left max-w-3xl mx-auto">
            {[
              { text: "You're copy-pasting between apps because nothing connects to anything.", emoji: "📋" },
              { text: "You have a 'system' that took forever to set up. It's slow and annoying, but switching isn't worth it.", emoji: "🔒" },
              { text: "Alt-tabbing between doing work and tracking work. The overhead competes with productivity.", emoji: "🔄" },
              { text: "You use ChatGPT daily, but it can't see your email, calendar, or spreadsheets.", emoji: "🤖" },
            ].map((pain, i) => (
              <div
                key={i}
                className="group p-5 rounded-2xl bg-white border-2 border-[hsl(220_20%_90%)] hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-200">{pain.emoji}</span>
                  <p className="text-[hsl(220_15%_30%)] font-medium leading-relaxed">{pain.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg text-[hsl(220_15%_40%)] mb-2">
              What if ChatGPT could see your data — and actually update it?
            </p>
            <p className="text-xl font-black text-[hsl(220_30%_20%)]">
              No new system to learn. No migration. Just ask.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demo Game - Easter Egg */}
      <section className="py-12 px-6 bg-[hsl(220_25%_12%)]">
        <div className="max-w-4xl mx-auto">
          <DemoRevealGame />
        </div>
      </section>

      {/* What You Can Ask */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(220_30%_15%)] mb-4">
              Ask It. Watch It Happen.
            </h2>
            <p className="text-[hsl(220_15%_45%)] max-w-2xl mx-auto">
              If AI can do it, why are you still doing it? Emails sent. Tasks checked off. Data updated.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {workflowExamples.map((workflow) => {
              const Icon = workflow.icon;
              const colorStyles = {
                cyan: { border: 'border-cyan-400/40', icon: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                green: { border: 'border-green-400/40', icon: 'text-green-400', bg: 'bg-green-400/10' },
                amber: { border: 'border-amber-400/40', icon: 'text-amber-400', bg: 'bg-amber-400/10' },
              }[workflow.color];

              return (
                <div
                  key={workflow.category}
                  className={`card-robot rounded-2xl p-6 border ${colorStyles?.border}`}
                >
                  <div className={`h-12 w-12 rounded-xl ${colorStyles?.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${colorStyles?.icon}`} />
                  </div>
                  <h3 className="text-xl font-black text-[hsl(220_30%_15%)] mb-4">{workflow.category}</h3>
                  <ul className="space-y-2">
                    {workflow.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[hsl(220_15%_45%)]">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="text-center text-[hsl(220_15%_50%)] mt-8">
            Works with what you already have:{' '}
            <span className="font-medium">Gmail, Google Calendar, Google Sheets, Stripe</span>
          </p>
        </div>
      </section>

      {/* Interactive Benefits Cards */}
      <BenefitsSection />

      {/* Use Case Carousel */}
      <UseCaseCarousel />

      {/* Interactive How It Works with growing buttons */}
      <HowItWorksSection />

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Let AI Take Care of It?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            30-minute call. I'll show you exactly how it works with your tools.
            If we work together — you don't pay until it's working.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://cal.com/june-kim-mokzq0/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center justify-center px-8 py-4 rounded-xl bg-white text-primary font-black tracking-wide text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book a Free Call
              </span>
              <span className="text-xs font-medium text-primary/70 mt-1">See it work with your data</span>
            </a>
            <Link
              to="/self-serve"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold tracking-wide text-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Try Self-Serve
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
