/**
 * DemoRevealGame
 *
 * Interactive carnival-style game where users complete 6 varied interactions
 * to reveal a YouTube demo video. Shows one interaction at a time.
 */
import { useState, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';

const YOUTUBE_VIDEO_ID = 'itjxyHSH0jo';

// Onboarding-style steps
const STEPS = [
  { label: 'Connect ATS', instruction: 'Click to connect your ATS' },
  { label: 'Allow Full Email Access', instruction: 'Flip the switch to allow' },
  { label: 'Insert AI API Key', instruction: 'Drag your API token into the slot' },
  { label: 'Integrate Things', instruction: 'Hold to integrate ALL the things' },
  { label: 'Turn up Intelligence', instruction: 'Turn up the AI' },
  { label: 'Slot Machine', instruction: 'Hit the jackpot to activate!' },
] as const;

const SLOT_SYMBOLS = ['🤖', '🧠', '💡', '⚡', '🔮', '✨'] as const;

interface DemoRevealGameProps {
  className?: string;
}

export function DemoRevealGame({ className = '' }: DemoRevealGameProps) {
  // Core game state
  const [currentRound, setCurrentRound] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<Set<number>>(new Set());
  const [isRevealed, setIsRevealed] = useState(false);

  // Interaction-specific state
  const [rotationAngle, setRotationAngle] = useState(0); // Visual rotation of the element
  const [lastPointerAngle, setLastPointerAngle] = useState<number | null>(null); // Last pointer angle from center
  const [cumulativeRotation, setCumulativeRotation] = useState(0); // Net rotation (can be negative)
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdInterval, setHoldInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [coinPosition, setCoinPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverSlot, setIsOverSlot] = useState(false);

  // Slot machine state
  const [reels, setReels] = useState(['?', '?', '?']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotAttempts, setSlotAttempts] = useState(0);
  const [isJackpot, setIsJackpot] = useState(false);

  // Refs for interaction detection
  const coinSlotRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const spinButtonRef = useRef<HTMLButtonElement>(null);

  // Handle round completion
  const completeRound = useCallback((round: number) => {
    if (completedRounds.has(round)) return;

    setCompletedRounds(prev => new Set(prev).add(round));

    if (round === 5) {
      setTimeout(() => {
        setIsRevealed(true);
      }, 300);
    } else {
      setCurrentRound(round + 1);
    }
  }, [completedRounds]);

  // ============================================
  // ROUND 1: Single Click (ATS)
  // ============================================
  const handleAtsClick = () => {
    if (currentRound !== 0 || completedRounds.has(0)) return;
    completeRound(0);
  };

  // ============================================
  // ROUND 2: Toggle Switch (EMAIL)
  // ============================================
  const [emailToggled, setEmailToggled] = useState(false);

  const handleEmailToggle = () => {
    if (currentRound !== 1 || completedRounds.has(1)) return;
    setEmailToggled(true);
    setTimeout(() => {
      completeRound(1);
    }, 300);
  };

  // ============================================
  // ROUND 3: Drag Coin to Slot
  // ============================================
  const handleCoinPointerDown = (e: React.PointerEvent) => {
    if (currentRound !== 2 || completedRounds.has(2)) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setCoinPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCoinPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    setCoinPosition({ x: e.clientX, y: e.clientY });

    // Check if pointer is in the right half of the game container (larger drop zone)
    if (gameContainerRef.current) {
      const containerRect = gameContainerRef.current.getBoundingClientRect();
      const midPoint = containerRect.left + containerRect.width / 2;
      const isOver =
        e.clientX >= midPoint &&
        e.clientX <= containerRect.right &&
        e.clientY >= containerRect.top &&
        e.clientY <= containerRect.bottom;
      setIsOverSlot(isOver);
    }
  };

  const handleCoinPointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;

    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsDragging(false);

    if (isOverSlot && currentRound === 2) {
      completeRound(2);
    }

    setCoinPosition(null);
    setIsOverSlot(false);
  };

  // ============================================
  // ROUND 4: Press and Hold (Integrate Things)
  // ============================================
  const handleLinkPointerDown = () => {
    if (currentRound !== 3 || completedRounds.has(3)) return;

    setHoldProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setHoldInterval(null);
        setHoldProgress(0);
        completeRound(3);
      }
    }, 50);

    setHoldInterval(interval);
  };

  const handleLinkPointerUp = () => {
    if (holdInterval) {
      clearInterval(holdInterval);
      setHoldInterval(null);
    }
    setHoldProgress(0);
  };

  // ============================================
  // ROUND 5: Spin 360° (Turn up Intelligence)
  // ============================================
  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!spinButtonRef.current) return 0;
    const rect = spinButtonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleSpinPointerDown = (e: React.PointerEvent) => {
    if (currentRound !== 4 || completedRounds.has(4)) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    setLastPointerAngle(angle);
  };

  const handleSpinPointerMove = (e: React.PointerEvent) => {
    if (currentRound !== 4 || lastPointerAngle === null) return;

    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    let delta = currentAngle - lastPointerAngle;

    // Handle wrap-around at ±180° boundary
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Update visual rotation
    setRotationAngle(prev => prev + delta);

    // Track cumulative rotation (positive = clockwise from user perspective)
    const newCumulative = cumulativeRotation + delta;
    setCumulativeRotation(newCumulative);
    setLastPointerAngle(currentAngle);

    // Complete when absolute rotation exceeds 360° in either direction
    if (Math.abs(newCumulative) >= 360) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setLastPointerAngle(null);
      setRotationAngle(0);
      setCumulativeRotation(0);
      completeRound(4);
    }
  };

  const handleSpinPointerUp = (e: React.PointerEvent) => {
    if (lastPointerAngle !== null) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setLastPointerAngle(null);
    // Keep cumulative rotation so user can continue from where they left off
  };

  // ============================================
  // ROUND 6: Slot Machine
  // ============================================
  const spinSlotMachine = () => {
    if (currentRound !== 5 || completedRounds.has(5) || isSpinning) return;

    // If jackpot already hit, clicking again completes the round
    if (isJackpot) {
      completeRound(5);
      return;
    }

    setIsSpinning(true);
    const newAttempts = slotAttempts + 1;
    setSlotAttempts(newAttempts);

    // Deterministic: always win on exactly the 3rd try
    const shouldWin = newAttempts === 3;

    const spinDurations = [400, 600, 800];
    const finalReels: string[] = [];

    if (shouldWin) {
      // Jackpot! All 7s
      finalReels.push('🤖', '🤖', '🤖');
    } else {
      // Generate losing combination (no three-of-a-kind)
      let icons: string[];
      do {
        icons = [
          SLOT_SYMBOLS[Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))], // Exclude sparkle
          SLOT_SYMBOLS[Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))],
          SLOT_SYMBOLS[Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))],
        ];
      } while (icons[0] === icons[1] && icons[1] === icons[2]);
      finalReels.push(...icons);
    }

    spinDurations.forEach((duration, index) => {
      const spinInterval = setInterval(() => {
        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
          return newReels;
        });
      }, 80);

      setTimeout(() => {
        clearInterval(spinInterval);
        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = finalReels[index];
          return newReels;
        });

        if (index === 2) {
          setTimeout(() => {
            setIsSpinning(false);
            if (shouldWin) {
              setIsJackpot(true);
            }
          }, 200);
        }
      }, duration);
    });
  };

  // ============================================
  // RENDER CURRENT INTERACTION
  // ============================================
  const renderCurrentInteraction = () => {
    // Round 1: Connect ATS (Orange) - Big arcade button style
    if (currentRound === 0) {
      return (
        <button
          onClick={handleAtsClick}
          className="relative px-10 py-6 sm:px-8 sm:py-5 rounded-full cursor-pointer transition-all duration-100 transform hover:-translate-y-1 active:translate-y-1"
          style={{
            background: 'linear-gradient(180deg, #fb923c 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 6px 0 #9a3412, 0 8px 16px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
            border: '3px solid #9a3412',
          }}
          aria-label={STEPS[0].instruction}
        >
          <span className="text-xl sm:text-lg font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] tracking-wide" style={{ fontFamily: 'system-ui' }}>
            {STEPS[0].label}
          </span>
        </button>
      );
    }

    // Round 2: Allow Email (Blue) - Toggle switch style
    if (currentRound === 1) {
      return (
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-bold text-blue-400 tracking-wide uppercase">{STEPS[1].label}</span>
          <button
            onClick={handleEmailToggle}
            className={`relative w-24 h-12 sm:w-20 sm:h-10 rounded-full cursor-pointer transition-all duration-300 ${
              emailToggled
                ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'bg-gray-600'
            }`}
            style={{
              boxShadow: emailToggled
                ? '0 0 20px rgba(59,130,246,0.5), inset 0 2px 4px rgba(0,0,0,0.2)'
                : 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
            aria-label={STEPS[1].instruction}
          >
            <div
              className={`absolute top-1 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white shadow-md transition-all duration-300 ${
                emailToggled ? 'left-[52px] sm:left-11' : 'left-1'
              }`}
              style={{
                background: 'linear-gradient(180deg, #fff 0%, #e5e5e5 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      );
    }

    // Round 3: Insert Token
    if (currentRound === 2) {
      // Responsive coin size: 96px on mobile, 80px on sm, 144px on md+
      const coinSize = typeof window !== 'undefined' ? (window.innerWidth < 640 ? 96 : window.innerWidth < 768 ? 80 : 144) : 144;
      const coinOffset = coinSize / 2;
      return (
        <div className="flex items-center w-full">
          {/* Left half: Token */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-20 sm:h-20 md:w-36 md:h-36 relative">
              <div
                onPointerDown={handleCoinPointerDown}
                onPointerMove={handleCoinPointerMove}
                onPointerUp={handleCoinPointerUp}
                className={`draggable-coin w-24 h-24 sm:w-20 sm:h-20 md:w-36 md:h-36 touch-none ${isDragging ? 'dragging' : ''}`}
                style={
                  coinPosition
                    ? {
                        position: 'fixed',
                        left: coinPosition.x - coinOffset,
                        top: coinPosition.y - coinOffset,
                        width: coinSize,
                        height: coinSize,
                        zIndex: 1000,
                      }
                    : {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                      }
                }
              >
                <span className="text-2xl sm:text-xl md:text-3xl font-black text-amber-800">API</span>
              </div>
            </div>
          </div>
          {/* Arrow between token and slot */}
          <ArrowDown className="h-8 w-8 sm:h-6 sm:w-6 md:h-10 md:w-10 text-primary rotate-[-90deg] shrink-0" />
          {/* Right half: Drop zone (the entire area, with slot visual centered) */}
          <div
            ref={coinSlotRef}
            className="flex-1 flex items-center justify-center"
          >
            <div
              className={`w-28 h-8 sm:w-24 sm:h-6 md:w-40 md:h-10 rounded-lg bg-[hsl(220_20%_20%)] border-2 md:border-3 border-[hsl(220_15%_30%)] transition-all ${isOverSlot ? 'drop-target' : ''}`}
            />
          </div>
        </div>
      );
    }

    // Round 4: Integrate Things (Purple) - Hold progress bar style
    if (currentRound === 3) {
      const glowIntensity = Math.pow(holdProgress / 100, 2); // Quadratic for more intense at top end
      const glowSize = 10 + glowIntensity * 60; // 10px to 70px
      const borderWidth = 2 + glowIntensity * 4; // 2px to 6px
      return (
        <div className="flex flex-col items-center gap-2">
          <button
            onPointerDown={handleLinkPointerDown}
            onPointerUp={handleLinkPointerUp}
            onPointerLeave={handleLinkPointerUp}
            onContextMenu={(e) => e.preventDefault()}
            className="relative w-56 h-14 sm:w-52 sm:h-13 md:w-60 md:h-14 rounded-lg cursor-pointer overflow-hidden select-none touch-none"
            style={{
              background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
              boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2), 0 0 ${glowSize}px rgba(168,85,247,${glowIntensity}), 0 0 ${glowSize * 1.5}px rgba(147,51,234,${glowIntensity * 0.5})`,
              border: `${borderWidth}px solid ${holdProgress > 0 ? `rgba(168,85,247,${0.4 + glowIntensity * 0.6})` : '#4b5563'}`,
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              transition: 'box-shadow 0.1s ease-out, border 0.1s ease-out',
            }}
            aria-label={STEPS[3].instruction}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-0 transition-all duration-100"
              style={{
                width: `${holdProgress}%`,
                background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 30%, #7c3aed 70%, #6d28d9 100%)',
                boxShadow: holdProgress > 0 ? `0 0 ${15 + glowIntensity * 35}px rgba(168,85,247,${0.6 + glowIntensity * 0.4})` : 'none',
              }}
            />
            {/* Text */}
            <span
              className="absolute inset-0 flex items-center justify-center text-base sm:text-base md:text-lg font-bold text-white tracking-wide"
              style={{
                fontFamily: 'monospace',
                textShadow: holdProgress > 50 ? `0 0 ${glowIntensity * 10}px rgba(255,255,255,${glowIntensity})` : '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {holdProgress > 0 ? `INTEGRATING ${Math.round(holdProgress)}%` : 'HOLD TO INTEGRATE'}
            </span>
          </button>
        </div>
      );
    }

    // Round 5: Turn up Intelligence (Green) - Skeuomorphic volume knob
    if (currentRound === 4) {
      const progress = Math.min((Math.abs(cumulativeRotation) / 360) * 110, 110);
      const glowIntensity = Math.min(progress / 100, 1); // Cap at 1 for visual effects
      // Border thickness increases at an accelerating rate (quadratic)
      const borderWidth = 2 + Math.pow(glowIntensity, 2) * 10; // 2px to 12px
      // Size increases to match border growth so inner edge stays fixed
      // Need to compensate for the full border increase (borderWidth - initial 2px) on each side
      const sizeIncrease = (borderWidth - 2) * 2; // compensate both sides
      return (
        <div className="flex flex-col items-center gap-3">
          {/* Knob housing/bezel */}
          <div
            className="relative rounded-full"
            style={{
              width: `calc(128px + ${sizeIncrease * 2}px)`,
              height: `calc(128px + ${sizeIncrease * 2}px)`,
              background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5), 0 0 ${20 + glowIntensity * 40}px rgba(34,197,94,${glowIntensity * 0.6})`,
              border: `${borderWidth}px solid ${progress > 0 ? `rgba(34,197,94,${0.3 + glowIntensity * 0.7})` : '#333'}`,
              transition: 'all 0.1s ease-out',
            }}
          >
            {/* Tick marks around the knob */}
            {[...Array(11)].map((_, i) => {
              const angle = -135 + (i * 27); // From -135° to +135°
              const isActive = i <= Math.floor(progress / 10);
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: isActive ? '4px' : '2px',
                    height: isActive ? '12px' : '8px',
                    top: isActive ? '4px' : '8px',
                    left: '50%',
                    transformOrigin: `50% ${isActive ? '52px' : '48px'}`,
                    transform: `translateX(-50%) rotate(${angle}deg)`,
                    backgroundColor: isActive ? '#22c55e' : '#666',
                    boxShadow: isActive ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                    borderRadius: '2px',
                    transition: 'all 0.15s ease-out',
                  }}
                />
              );
            })}
            {/* The actual knob */}
            <button
              ref={spinButtonRef}
              onPointerDown={handleSpinPointerDown}
              onPointerMove={handleSpinPointerMove}
              onPointerUp={handleSpinPointerUp}
              onPointerLeave={handleSpinPointerUp}
              className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full cursor-grab active:cursor-grabbing touch-none select-none"
              style={{
                transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
                background: 'linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                boxShadow: `0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3), 0 0 ${glowIntensity * 20}px rgba(34,197,94,${glowIntensity * 0.4})`,
                border: `2px solid ${progress > 50 ? `rgba(34,197,94,${glowIntensity})` : '#555'}`,
              }}
              aria-label={`${STEPS[4].label} - ${Math.round(progress)}%`}
            >
              {/* Knurled texture (ridges) */}
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: `repeating-conic-gradient(from 0deg, #3a3a3a 0deg 3deg, #2a2a2a 3deg 6deg)`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(255,255,255,0.05)',
                }}
              />
              {/* Indicator notch */}
              <div
                className="absolute top-2 left-1/2 w-2 h-4 rounded-full"
                style={{
                  transform: 'translateX(-50%)',
                  background: `linear-gradient(180deg, ${progress > 0 ? '#4ade80' : '#22c55e'}, #16a34a)`,
                  boxShadow: `0 0 ${8 + glowIntensity * 12}px rgba(34,197,94,${0.6 + glowIntensity * 0.4})`,
                }}
              />
              {/* Center - show percentage */}
              <div
                className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  transform: `translate(-50%, -50%) rotate(${-rotationAngle}deg)`,
                  background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                <span
                  className="text-xs font-bold font-mono"
                  style={{
                    color: progress > 0 ? '#4ade80' : '#666',
                    textShadow: progress > 0 ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // Round 6: Slot Machine SPIN button
    if (currentRound === 5) {
      return (
        <button
          onClick={spinSlotMachine}
          disabled={isSpinning}
          className={`
            spin-button relative px-12 py-5 sm:px-10 sm:py-4 rounded-xl cursor-pointer
            transition-all duration-100 transform
            ${isSpinning
              ? 'translate-y-1 cursor-not-allowed'
              : 'hover:-translate-y-0.5 active:translate-y-1'
            }
          `}
          style={{
            background: isSpinning
              ? 'linear-gradient(180deg, #666 0%, #444 100%)'
              : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 50%, #991b1b 100%)',
            boxShadow: isSpinning
              ? '0 2px 0 #333, 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 6px 0 #7f1d1d, 0 8px 16px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
            border: '3px solid #7f1d1d',
            perspective: '100px',
          }}
          aria-label={isSpinning ? 'Slot machine spinning' : 'Press to spin'}
        >
          <span
            className="text-xl sm:text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
            style={{
              textShadow: '0 2px 0 rgba(0,0,0,0.3), 0 -1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {isSpinning ? 'PROMPTING...' : isJackpot ? 'IT WORKS' : slotAttempts === 0 ? 'PROMPT AI' : slotAttempts === 1 ? 'TRY AGAIN' : 'PROMPT HARDER'}
          </span>
          {/* Button shine */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </button>
      );
    }

    return null;
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div
      ref={gameContainerRef}
      className={`relative w-full mt-20 sm:mt-24 ${className}`}
      role="region"
      aria-label="Interactive demo unlock game"
    >
      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {isRevealed
          ? 'Demo video unlocked! Video is now playing.'
          : `Step ${currentRound + 1} of 6: ${STEPS[currentRound].instruction}`}
      </div>

      {/* Carnival Sign - Always above, arrow points down */}
      <div
        className={`absolute -top-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center transition-all duration-700 ease-in pointer-events-none ${
          isRevealed ? 'sign-exit-up' : ''
        }`}
      >
        <div className="carnival-sign-wrapper relative p-1 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="marquee-lights absolute inset-0" />
          </div>
          <div className="carnival-sign relative px-4 py-3 lg:px-6 lg:py-4 rounded-xl">
            <span className="text-sm lg:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">
              DEMO VIDEO HERE
            </span>
          </div>
        </div>
        <ArrowDown className="carnival-arrow h-10 w-10 lg:h-12 lg:w-12 text-primary -mt-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" strokeWidth={3} />
      </div>

      {/* Vending Machine Body with Lever */}
      <div className="w-full max-w-[600px] mx-auto robot-panel rounded-none min-[480px]:rounded-2xl sm:rounded-3xl p-2 min-[480px]:p-3 sm:p-5 md:p-6 lg:p-8 relative">
          {/* Corner screws */}
          <div className="absolute top-4 left-4 screw" />
          <div className="absolute top-4 right-4 screw" />
          <div className="absolute bottom-4 left-4 screw" />
          <div className="absolute bottom-4 right-4 screw" />

          {/* Fixed aspect-video container to prevent layout shift */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-[hsl(220_20%_10%)]">
            {isRevealed ? (
              // Video replaces entire machine contents
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1`}
                title="Skillomatic Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              />
            ) : (
              // Interactive game content
              <div className="absolute inset-0 flex flex-col p-2 sm:p-3 md:p-4">
                {/* Display screen */}
                <div className="robot-display rounded-xl p-2 sm:p-3 md:p-4 relative overflow-hidden">
                  {currentRound === 5 ? (
                    // Slot Machine Display
                    <div className="slot-machine flex flex-col items-center gap-3">
                      {/* Slot reels */}
                      <div className="flex justify-center gap-1">
                        {reels.map((reel, i) => (
                          <div
                            key={i}
                            className="slot-reel-container w-16 h-18 sm:w-14 sm:h-16 md:w-16 md:h-20 rounded-lg bg-gradient-to-b from-[hsl(220_20%_95%)] to-[hsl(220_15%_85%)] border-4 border-[hsl(30_20%_35%)] shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] overflow-hidden relative"
                          >
                            <div className={`slot-reel-inner absolute inset-0 flex items-center justify-center ${isSpinning ? 'slot-spinning' : ''}`}>
                              <span className={`text-4xl sm:text-3xl md:text-4xl ${reels[0] === reels[1] && reels[1] === reels[2] && !isSpinning && reels[0] !== '?' ? 'jackpot-fruit' : ''}`}>
                                {reel}
                              </span>
                            </div>
                            {/* Reel shine overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Normal Display
                    <div className="flex items-center gap-2">
                      <div className={`led-light ${currentRound > 0 ? 'led-orange' : 'led-cyan'}`} />
                      <div className="text-xs sm:text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider">
                        {currentRound === 4 && Math.abs(cumulativeRotation) > 36
                          ? 'Turn up the AI (This one goes up to 110%)'
                          : STEPS[currentRound].instruction}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Interaction Area */}
                <div className="flex-1 flex items-center justify-center">
                  {renderCurrentInteraction()}
                </div>

                {/* Progress LED Strip */}
                <div
                  className="progress-led-strip mx-auto w-fit"
                  role="progressbar"
                  aria-valuenow={completedRounds.size}
                  aria-valuemin={0}
                  aria-valuemax={6}
                  aria-label={`Demo unlock progress: ${completedRounds.size} of 6 steps complete`}
                >
                  {[
                    { round: 0, color: 'orange' },
                    { round: 1, color: 'blue' },
                    { round: 2, color: 'amber' },
                    { round: 3, color: 'green' },
                    { round: 4, color: 'purple' },
                    { round: 5, color: 'red' },
                  ].map(({ round, color }) => (
                    <div
                      key={round}
                      className={`progress-led progress-led-${color} ${completedRounds.has(round) ? 'active' : ''} ${currentRound === round ? 'current' : ''}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default DemoRevealGame;
