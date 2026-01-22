import { useState, useEffect, useRef, ReactNode } from 'react';
import { Send } from 'lucide-react';

// Sample prompts that rotate in the fake chat input
const SAMPLE_PROMPTS = [
  "Find backend engineers in NYC with fintech experience...",
  "Schedule interviews for all candidates who passed screening...",
  "Draft follow-up emails for candidates waiting on feedback...",
  "Show me pipeline metrics for this quarter...",
  "Enrich these 20 LinkedIn profiles and add to Greenhouse...",
  "What candidates haven't been touched in 5+ days?",
];

// ============================================================================
// PLANETARY LOGOS COMPONENT
// A rotating carousel of logo groups orbiting around a central point
// ============================================================================

// Configuration
const logoClass = "w-10 h-10 rounded-lg object-cover shadow-md";

// ============================================================================
// LOGO GROUPS - Using local assets
// ============================================================================

// AI Providers
const aiProviders = [
  <img src="/claude-ai.svg" alt="Claude" className={logoClass} />,
  <img src="/logos/gemini.svg" alt="Gemini" className={logoClass} />,
  <img src="/logos/openai.png" alt="OpenAI" className={logoClass} />,
];

// ATS Systems
const atsSystems = [
  <img src="/logos/greenhouse.png" alt="Greenhouse" className={logoClass} />,
  <img src="/logos/lever.png" alt="Lever" className={logoClass} />,
  <img src="/logos/workday.png" alt="Workday" className={logoClass} />,
  <img src="/logos/icims.png" alt="iCIMS" className={logoClass} />,
];

// Calendar & Email
const calendarEmail = [
  <span className="text-4xl">📅</span>,
  <img src="/logos/gmail.svg" alt="Gmail" className={logoClass} />,
];

// Browser & Sourcing
const browserSourcing = [
  <img src="/logos/chrome.svg" alt="Chrome" className={logoClass} />,
  <img src="/logos/firefox.svg" alt="Firefox" className={logoClass} />,
  <img src="/logos/linkedin.png" alt="LinkedIn" className={logoClass} />,
];

const defaultLogoGroups = [aiProviders, atsSystems, calendarEmail, browserSourcing];

// ============================================================================
// HOOK
// ============================================================================

interface UsePlanetaryLogosProps {
  logoGroups?: ReactNode[][];
  autoPlay?: boolean;
  outerRadiusInit?: number;
  outerDurationInit?: number;
  innerRadiusInit?: number;
  innerDurationInit?: number;
}

function usePlanetaryLogos({
  logoGroups = defaultLogoGroups,
  autoPlay = true,
  outerRadiusInit = 150,
  outerDurationInit = 40,
  innerRadiusInit = 28,
  innerDurationInit = 20,
}: UsePlanetaryLogosProps = {}) {
  const groupCount = logoGroups.length;

  const [outerRotation, setOuterRotation] = useState(0);
  const [outerRadius, setOuterRadius] = useState(outerRadiusInit);
  const [outerDuration, setOuterDuration] = useState(outerDurationInit);

  const [innerRotation, setInnerRotation] = useState(0);
  const [innerRadius, setInnerRadius] = useState(innerRadiusInit);
  const [innerDuration, setInnerDuration] = useState(innerDurationInit);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = currentTime;
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const outerDegreesPerMs = 360 / (outerDuration * 1000);
      setOuterRotation((prev) => (prev + outerDegreesPerMs * deltaTime) % 360);

      const innerDegreesPerMs = 360 / (innerDuration * 1000);
      setInnerRotation((prev) => (prev + innerDegreesPerMs * deltaTime) % 360);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, outerDuration, innerDuration]);

  const getInnerScale = (z: number) => {
    if (innerRadius === 0) return 1;
    const normalized = (z + innerRadius) / (2 * innerRadius);
    return 0.84 + normalized * 0.22;
  };

  const getInnerOpacity = (z: number) => {
    if (innerRadius === 0) return 1;
    const normalized = (z + innerRadius) / (2 * innerRadius);
    return 0.725 + normalized * 0.275;
  };

  const getGroupPosition = (groupIndex: number) => {
    const angle = (((outerRotation + (360 / groupCount) * groupIndex) * Math.PI) / 180);
    return { x: Math.cos(angle) * outerRadius, y: Math.sin(angle) * outerRadius };
  };

  const getLogoPosition = (logoIndex: number, logoCount: number) => {
    const angle = (((innerRotation + (360 / logoCount) * logoIndex) * Math.PI) / 180);
    const x = Math.sin(angle) * innerRadius;
    const z = Math.cos(angle) * innerRadius;
    return { x, y: -z * 0.05, z };
  };

  const renderLines = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {Array.from({ length: groupCount }).map((_, i) => {
        const { x: x1, y: y1 } = getGroupPosition(i);
        const { x: x2, y: y2 } = getGroupPosition((i + 1) % groupCount);
        return (
          <line
            key={i}
            x1={x1 + 192} y1={y1 + 192}
            x2={x2 + 192} y2={y2 + 192}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity={0.3}
            className="text-gray-400"
          />
        );
      })}
    </svg>
  );

  const renderPlanets = () =>
    logoGroups.map((logos, groupIndex) => {
      const { x: groupX, y: groupY } = getGroupPosition(groupIndex);
      return (
        <div
          key={groupIndex}
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(-50%, -50%) translateX(${groupX}px) translateY(${groupY}px)` }}
        >
          <div
            className="relative rounded-full bg-white/20 backdrop-blur-sm shadow-lg"
            style={{ perspective: '400px', width: `${60 + logos.length * 12}px`, height: `${60 + logos.length * 12}px` }}
          >
            {logos.map((logo, logoIndex) => {
              const { x, y, z } = getLogoPosition(logoIndex, logos.length);
              return (
                <div
                  key={logoIndex}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${z}px) scale(${getInnerScale(z)})`,
                    opacity: getInnerOpacity(z),
                    zIndex: Math.round(z + innerRadius),
                  }}
                >
                  {logo}
                </div>
              );
            })}
          </div>
        </div>
      );
    });

  return {
    outerRotation, innerRotation, outerRadius, innerRadius, outerDuration, innerDuration,
    isPlaying, groupCount, setIsPlaying, setOuterRadius, setInnerRadius, setOuterDuration, setInnerDuration,
    handleReset: () => { setOuterRotation(0); setInnerRotation(0); lastTimeRef.current = null; },
    renderLines, renderPlanets,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface PlanetaryLogosProps {
  logoGroups?: ReactNode[][];
  className?: string;
  showControls?: boolean;
}

export default function PlanetaryLogos({ logoGroups, className = "", showControls = false }: PlanetaryLogosProps) {
  const planetary = usePlanetaryLogos({ logoGroups });
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'sending' | 'sent'>('typing');

  // Typewriter effect for rotating prompts
  useEffect(() => {
    const currentPrompt = SAMPLE_PROMPTS[promptIndex];

    if (phase === 'typing') {
      if (displayedText.length < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
        }, 40 + Math.random() * 30); // Variable typing speed for realism
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait before sending
        const timeout = setTimeout(() => setPhase('sending'), 1500);
        return () => clearTimeout(timeout);
      }
    } else if (phase === 'sending') {
      // Brief moment for send animation
      const timeout = setTimeout(() => setPhase('sent'), 300);
      return () => clearTimeout(timeout);
    } else if (phase === 'sent') {
      // Message sent, wait then transition to next prompt
      const timeout = setTimeout(() => {
        setDisplayedText("");
        setPromptIndex((prev) => (prev + 1) % SAMPLE_PROMPTS.length);
        setPhase('typing');
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, phase, promptIndex]);

  return (
    <div className={className}>
      <div className="relative flex justify-center items-center py-12 rounded-xl overflow-hidden">
        {/* Fake chat input bar behind the logos - centered with planetary */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-0 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-[hsl(220_15%_88%)]">
            <div
              className={`flex-1 text-sm text-[hsl(220_15%_40%)] truncate transition-all duration-300 ${
                phase === 'sent' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {displayedText}
              {phase === 'typing' && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
              )}
            </div>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                phase === 'sending' || phase === 'sent'
                  ? 'bg-green-500 scale-110'
                  : 'bg-primary scale-100'
              }`}
            >
              {phase === 'sent' ? (
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Send
                  className={`h-4 w-4 text-white transition-transform duration-200 ${
                    phase === 'sending' ? 'translate-x-1 -translate-y-1 opacity-50' : ''
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Planetary logos */}
        <div className="relative w-96 h-96" style={{ perspective: '800px' }}>
          {planetary.renderLines()}
          {planetary.renderPlanets()}
        </div>
      </div>

      {showControls && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => planetary.setIsPlaying(!planetary.isPlaying)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {planetary.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={planetary.handleReset} className="px-4 py-2 bg-gray-300 rounded">
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label>Outer Radius: {planetary.outerRadius}px</label>
              <input type="range" min="50" max="200" value={planetary.outerRadius} onChange={(e) => planetary.setOuterRadius(+e.target.value)} className="w-full" />
            </div>
            <div>
              <label>Inner Radius: {planetary.innerRadius}px</label>
              <input type="range" min="0" max="60" value={planetary.innerRadius} onChange={(e) => planetary.setInnerRadius(+e.target.value)} className="w-full" />
            </div>
            <div>
              <label>Outer Duration: {planetary.outerDuration}s</label>
              <input type="range" min="5" max="60" value={planetary.outerDuration} onChange={(e) => planetary.setOuterDuration(+e.target.value)} className="w-full" />
            </div>
            <div>
              <label>Inner Duration: {planetary.innerDuration}s</label>
              <input type="range" min="2" max="20" value={planetary.innerDuration} onChange={(e) => planetary.setInnerDuration(+e.target.value)} className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Also export the hook for custom usage
export { usePlanetaryLogos };
