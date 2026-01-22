import { useState, useEffect, useRef, ReactNode } from 'react';

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
  <img src="/logos/anthropic.png" alt="Anthropic" className={logoClass} />,
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

  return (
    <div className={className}>
      <div className="flex justify-center items-center py-12 rounded-xl overflow-hidden">
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
