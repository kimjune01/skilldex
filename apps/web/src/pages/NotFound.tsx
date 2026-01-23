import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Bot } from 'lucide-react';

// Same explosive emojis as pricing page
const EMOJIS = [
  '🤖', '⚙️', '🔧', '🎰', '💥', '✨', '🚀', '💀', '🔥', '😱', '🫠', '💫', '🎉', '💣', '⭐',
  '🤖', '⚙️', '🔧', '🎰', '💥', '✨', '🚀', '💀', '🔥', '😱', '🫠', '💫', '🎉', '💣', '⭐',
];

interface EmojiParticle {
  id: number;
  emoji: string;
  vx: number; // horizontal velocity
  vy: number; // vertical velocity (negative = up)
  spin: number; // rotation speed
  originX: number; // click position X (viewport coords)
  originY: number; // click position Y (viewport coords)
}

export default function NotFound() {
  const [emojis, setEmojis] = useState<EmojiParticle[]>([]);
  const [pressCount, setPressCount] = useState(0);

  const spawnEmojis = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get click position relative to viewport (same as Pricing page)
    const clickX = e.clientX;
    const clickY = e.clientY;

    // Create explosive burst with physics velocities
    // Base multiplier for this click: 0.5 to 2.0, skewed towards 0.5 using squared random
    const baseMultiplier = 0.5 + Math.pow(Math.random(), 2) * 1.5;

    // Each emoji also varies: 0.5 to 2.0 of base, skewed towards 0.5
    const newEmojis: EmojiParticle[] = EMOJIS.map((emoji, i) => {
      const emojiMultiplier = 0.5 + Math.pow(Math.random(), 2) * 1.5;
      const totalMultiplier = baseMultiplier * emojiMultiplier;
      return {
        id: Date.now() + i,
        emoji,
        vx: (Math.random() - 0.5) * 1200 * totalMultiplier, // Wide horizontal spread
        vy: (-800 - Math.random() * 600) * totalMultiplier, // Strong upward velocity
        spin: (Math.random() - 0.5) * 1440, // Lots of spin
        originX: clickX,
        originY: clickY,
      };
    });

    setEmojis(prev => [...prev, ...newEmojis]);
    setPressCount(prev => prev + 1);

    // Clean up after animation
    setTimeout(() => {
      setEmojis(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220_15%_95%)] to-[hsl(220_15%_90%)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Explosive emoji burst with true physics - same approach as Pricing page */}
      <AnimatePresence>
        {emojis.map((particle) => {
          // Calculate parabolic path points for smooth gravity
          // y = v0*t + 0.5*g*t^2 (where g is positive for downward)
          const duration = 2.5;
          const gravity = 2000; // Strong gravity for energetic feel
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
                scale: [0.8, 1.6, 1.3, 1],
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

      {/* Main content */}
      <div className="relative z-10 text-center px-4">
        {/* Robot icon */}
        <motion.div
          className="relative inline-block mb-6"
          animate={pressCount > 0 ? { rotate: [0, -5, 5, -5, 0] } : {}}
          transition={{ duration: 0.4 }}
          key={pressCount}
        >
          <div className="h-24 w-24 rounded-2xl robot-button flex items-center justify-center mx-auto">
            <Bot className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 led-light led-red" style={{ width: 12, height: 12 }} />
        </motion.div>

        {/* Error message */}
        <div className="robot-display rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h1 className="text-6xl font-black text-cyan-400 mb-2 digital-text">404</h1>
          <p className="text-cyan-400/80 font-mono text-sm">
            &gt; ERROR: Page not found_
          </p>
          <p className="text-cyan-400/60 font-mono text-xs mt-2">
            The requested skill has not been dispensed
          </p>
        </div>

        {/* Don't Press button */}
        <motion.button
          onClick={spawnEmojis}
          whileTap={{ scale: 0.95, y: 4 }}
          whileHover={{ scale: 1.02 }}
          className="px-8 py-4 text-lg font-black uppercase tracking-wider rounded-xl
            bg-gradient-to-b from-red-500 to-red-700
            border-4 border-red-800
            text-white
            shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_6px_0_hsl(0_70%_30%),0_8px_20px_rgba(0,0,0,0.3)]
            hover:from-red-400 hover:to-red-600
          "
        >
          🚨 Don't Press 🚨
        </motion.button>

        {/* Fixed height message area */}
        <div className="h-8 flex items-center justify-center my-6">
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: pressCount > 0 ? 1 : 0, y: 0 }}
            key={pressCount}
          >
            {pressCount === 1 && "I said don't press it!"}
            {pressCount === 2 && "Seriously, stop!"}
            {pressCount === 3 && "Why do you keep pressing?!"}
            {pressCount === 4 && "This is getting out of hand..."}
            {pressCount >= 5 && `You've pressed it ${pressCount} times. Are you ok?`}
          </motion.p>
        </div>

        {/* Go home button */}
        <Link to="/home">
          <Button
            size="lg"
            className="robot-button border-0 gap-2"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
