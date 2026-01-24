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
  { label: 'Allow Email', instruction: 'Flip the switch to allow' },
  { label: 'Insert AI API Key', instruction: 'Drag your API token into the slot' },
  { label: 'Hook up Calendar', instruction: 'Spin it to hook it!' },
  { label: 'Install Browser Addon', instruction: 'Hold to install addon' },
  { label: 'Prompt AI Playbook', instruction: 'Hit the jackpot to activate!' },
] as const;

const SLOT_FRUITS = ['🍒', '🍋', '🍊', '🍇', '🍉', '7️⃣'] as const;

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

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setCoinPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCoinPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    setCoinPosition({ x: e.clientX, y: e.clientY });

    if (coinSlotRef.current) {
      const slotRect = coinSlotRef.current.getBoundingClientRect();
      const isOver =
        e.clientX >= slotRect.left &&
        e.clientX <= slotRect.right &&
        e.clientY >= slotRect.top &&
        e.clientY <= slotRect.bottom;
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
  // ROUND 4: Spin 360° (CAL)
  // ============================================
  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!spinButtonRef.current) return 0;
    const rect = spinButtonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleSpinPointerDown = (e: React.PointerEvent) => {
    if (currentRound !== 3 || completedRounds.has(3)) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    setLastPointerAngle(angle);
  };

  const handleSpinPointerMove = (e: React.PointerEvent) => {
    if (currentRound !== 3 || lastPointerAngle === null) return;

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
      completeRound(3);
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
  // ROUND 5: Press and Hold (LINK)
  // ============================================
  const handleLinkPointerDown = () => {
    if (currentRound !== 4 || completedRounds.has(4)) return;

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
        completeRound(4);
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
      finalReels.push('7️⃣', '7️⃣', '7️⃣');
    } else {
      // Generate losing combination (no three-of-a-kind)
      let icons: string[];
      do {
        icons = [
          SLOT_FRUITS[Math.floor(Math.random() * (SLOT_FRUITS.length - 1))], // Exclude 7
          SLOT_FRUITS[Math.floor(Math.random() * (SLOT_FRUITS.length - 1))],
          SLOT_FRUITS[Math.floor(Math.random() * (SLOT_FRUITS.length - 1))],
        ];
      } while (icons[0] === icons[1] && icons[1] === icons[2]);
      finalReels.push(...icons);
    }

    spinDurations.forEach((duration, index) => {
      const spinInterval = setInterval(() => {
        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = SLOT_FRUITS[Math.floor(Math.random() * SLOT_FRUITS.length)];
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
          className="relative px-8 py-5 rounded-full cursor-pointer transition-all duration-100 transform hover:-translate-y-1 active:translate-y-1"
          style={{
            background: 'linear-gradient(180deg, #fb923c 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 6px 0 #9a3412, 0 8px 16px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
            border: '3px solid #9a3412',
          }}
          aria-label={STEPS[0].instruction}
        >
          <span className="text-lg font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] tracking-wide" style={{ fontFamily: 'system-ui' }}>
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
            className={`relative w-20 h-10 rounded-full cursor-pointer transition-all duration-300 ${
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
              className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-md transition-all duration-300 ${
                emailToggled ? 'left-11' : 'left-1'
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
      return (
        <div className="flex items-center gap-6">
          {/* Placeholder to prevent layout shift */}
          <div className="w-20 h-20 relative">
            <div
              onPointerDown={handleCoinPointerDown}
              onPointerMove={handleCoinPointerMove}
              onPointerUp={handleCoinPointerUp}
              className={`draggable-coin w-20 h-20 ${isDragging ? 'dragging' : ''}`}
              style={
                coinPosition
                  ? {
                      position: 'fixed',
                      left: coinPosition.x - 40,
                      top: coinPosition.y - 40,
                      zIndex: 1000,
                    }
                  : {
                      position: 'absolute',
                      left: 0,
                      top: 0,
                    }
              }
            >
              <span className="text-lg font-black text-amber-800">API</span>
            </div>
          </div>
          <ArrowDown className="h-8 w-8 text-primary rotate-[-90deg]" />
          <div
            ref={coinSlotRef}
            className={`w-24 h-5 rounded bg-[hsl(220_20%_20%)] border-2 border-[hsl(220_15%_30%)] ${isOverSlot ? 'drop-target' : ''}`}
          />
        </div>
      );
    }

    // Round 4: Spin 360° (Green) - Dial/knob style
    if (currentRound === 3) {
      const progress = Math.min((Math.abs(cumulativeRotation) / 360) * 100, 100);
      return (
        <div className="flex flex-col items-center gap-2">
          <button
            ref={spinButtonRef}
            onPointerDown={handleSpinPointerDown}
            onPointerMove={handleSpinPointerMove}
            onPointerUp={handleSpinPointerUp}
            onPointerLeave={handleSpinPointerUp}
            className="w-24 h-24 rounded-full cursor-grab active:cursor-grabbing touch-none select-none relative"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #4ade80, #16a34a 60%, #15803d)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), inset 0 4px 8px rgba(255,255,255,0.2)',
              border: '4px solid #166534',
              transform: `rotate(${rotationAngle}deg)`,
            }}
            aria-label={`${STEPS[3].label} - ${Math.round(progress)}%`}
          >
            {/* Knob indicator line */}
            <div
              className="absolute top-3 left-1/2 w-1 h-4 bg-white rounded-full shadow-md"
              style={{ transform: 'translateX(-50%)' }}
            />
            {/* Center cap */}
            <div
              className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full"
              style={{
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 30% 30%, #86efac, #22c55e)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
              }}
            />
          </button>
          <span className="text-xs font-mono font-bold text-green-400 tracking-wider">
            {STEPS[3].label.toUpperCase()}
            {cumulativeRotation !== 0 && ` • ${Math.round(progress)}%`}
          </span>
        </div>
      );
    }

    // Round 5: Install Browser Addon (Purple) - Download/progress bar style
    if (currentRound === 4) {
      return (
        <div className="flex flex-col items-center gap-2">
          <button
            onPointerDown={handleLinkPointerDown}
            onPointerUp={handleLinkPointerUp}
            onPointerLeave={handleLinkPointerUp}
            className="relative w-48 h-12 rounded-lg cursor-pointer overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid #4b5563',
            }}
            aria-label={STEPS[4].instruction}
          >
            {/* Progress fill */}
            <div
              className="absolute inset-0 transition-all duration-100"
              style={{
                width: `${holdProgress}%`,
                background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',
                boxShadow: holdProgress > 0 ? '0 0 10px rgba(168,85,247,0.5)' : 'none',
              }}
            />
            {/* Text */}
            <span
              className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white tracking-wide"
              style={{ fontFamily: 'monospace', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {holdProgress > 0 ? `INSTALLING ${Math.round(holdProgress)}%` : 'HOLD TO INSTALL'}
            </span>
          </button>
          <span className="text-xs font-mono text-purple-400">{STEPS[4].label}</span>
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
            spin-button relative px-10 py-4 rounded-xl cursor-pointer
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
            className="text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
            style={{
              textShadow: '0 2px 0 rgba(0,0,0,0.3), 0 -1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {isSpinning ? '...' : isJackpot ? 'JACKPOT' : slotAttempts === 0 ? 'SPIN' : slotAttempts === 1 ? 'LOSER' : 'WINNER?'}
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
      className={`relative mt-24 lg:mt-0 ${className}`}
      role="region"
      aria-label="Interactive demo unlock game"
    >
      {/* Screen reader instructions */}
      <div className="sr-only" aria-live="polite">
        {isRevealed
          ? 'Demo video unlocked! Video is now playing.'
          : `Step ${currentRound + 1} of 6: ${STEPS[currentRound].instruction}`}
      </div>

      {/* Carnival Sign - Above on mobile, left side on larger screens */}
      {/* Mobile: centered above, arrow points down */}
      <div
        className={`absolute -top-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center lg:hidden transition-all duration-700 ease-in ${
          isRevealed ? 'sign-exit-up' : ''
        }`}
      >
        <div className="carnival-sign-wrapper relative p-1 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="marquee-lights absolute inset-0" />
          </div>
          <div className="carnival-sign relative px-4 py-3 rounded-xl">
            <span className="text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">
              DEMO VIDEO HERE
            </span>
          </div>
        </div>
        <ArrowDown className="carnival-arrow h-10 w-10 text-primary -mt-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" strokeWidth={3} />
      </div>
      {/* Desktop: left side, arrow points right */}
      <div
        className={`absolute top-12 -left-52 z-10 hidden lg:flex items-center transition-all duration-700 ease-in ${
          isRevealed ? 'sign-exit-up' : ''
        }`}
      >
        <div className="carnival-sign-wrapper relative p-1 rounded-2xl transform rotate-3">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="marquee-lights absolute inset-0" />
          </div>
          <div className="carnival-sign relative px-6 py-4 rounded-xl">
            <span className="text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">
              DEMO VIDEO HERE
            </span>
          </div>
        </div>
        <ArrowDown className="carnival-arrow h-12 w-12 text-primary -ml-2 rotate-[-135deg] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" strokeWidth={3} />
      </div>

      {/* Vending Machine Body with Lever */}
      <div className="flex items-start">
        <div className="w-80 md:w-[480px] lg:w-[560px] robot-panel rounded-3xl p-6 md:p-8 relative">
          {/* Corner screws */}
          <div className="absolute top-4 left-4 screw" />
          <div className="absolute top-4 right-4 screw" />
          <div className="absolute bottom-4 left-4 screw" />
          <div className="absolute bottom-4 right-4 screw" />

          {isRevealed ? (
            // Video replaces entire machine contents
            <div className="relative rounded-xl overflow-hidden bg-[hsl(220_20%_10%)] aspect-video video-revealed">
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
            </div>
          ) : (
            // Interactive game content
            <>
              {/* Display screen */}
              <div className="robot-display rounded-xl p-4 mb-4 relative overflow-hidden">
                {currentRound === 5 ? (
                  // Slot Machine Display
                  <div className="slot-machine flex flex-col items-center gap-3">
                    {/* Slot reels */}
                    <div className="flex justify-center gap-1">
                      {reels.map((reel, i) => (
                        <div
                          key={i}
                          className="slot-reel-container w-14 h-16 rounded-lg bg-gradient-to-b from-[hsl(220_20%_95%)] to-[hsl(220_15%_85%)] border-4 border-[hsl(30_20%_35%)] shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] overflow-hidden relative"
                        >
                          <div className={`slot-reel-inner absolute inset-0 flex items-center justify-center ${isSpinning ? 'slot-spinning' : ''}`}>
                            <span className={`text-3xl ${reels[0] === reels[1] && reels[1] === reels[2] && !isSpinning && reels[0] !== '?' ? 'jackpot-fruit' : ''}`}>
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
                    <div className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider">
                      {STEPS[currentRound].instruction}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Interaction Area */}
              <div className="flex items-center justify-center min-h-[120px] mb-4">
                {renderCurrentInteraction()}
              </div>

              {/* Progress LED Strip */}
              <div
                className="progress-led-strip mt-4 mx-auto w-fit"
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
            </>
          )}
        </div>

      </div>

    </div>
  );
}

export default DemoRevealGame;
