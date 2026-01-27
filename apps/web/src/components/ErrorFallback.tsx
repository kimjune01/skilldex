import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Bot, Bug } from 'lucide-react';

const EMOJIS = [
  '🤖', '⚙️', '🔧', '🎰', '💥', '✨', '🚀', '💀', '🔥', '😱', '🫠', '💫', '🎉', '💣', '⭐',
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

interface ErrorFallbackProps {
  code: string;
  title: string;
  subtitle: string;
  error?: Error | null;
}

export function ErrorFallback({ code, title, subtitle, error }: ErrorFallbackProps) {
  const [emojis, setEmojis] = useState<EmojiParticle[]>([]);
  const [pressCount, setPressCount] = useState(0);
  const [buttonStyle, setButtonStyle] = useState({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
  });
  const [isBroken, setIsBroken] = useState(false);

  const spawnEmojis = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isBroken) return;

    if (Math.random() < 0.02) {
      setIsBroken(true);
      return;
    }

    const clickX = e.clientX;
    const clickY = e.clientY;
    const baseMultiplier = 0.5 + Math.pow(Math.random(), 2) * 1.5;

    const newEmojis: EmojiParticle[] = EMOJIS.map((emoji, i) => {
      const emojiMultiplier = 0.5 + Math.pow(Math.random(), 2) * 1.5;
      const totalMultiplier = baseMultiplier * emojiMultiplier;
      return {
        id: Date.now() + i,
        emoji,
        vx: (Math.random() - 0.5) * 1200 * totalMultiplier,
        vy: (-800 - Math.random() * 600) * totalMultiplier,
        spin: (Math.random() - 0.5) * 1440,
        originX: clickX,
        originY: clickY,
      };
    });

    setEmojis(prev => [...prev, ...newEmojis]);
    setPressCount(prev => prev + 1);

    setButtonStyle(prev => ({
      x: prev.x + (Math.random() - 0.5) * 60,
      y: prev.y + (Math.random() - 0.5) * 40,
      rotate: prev.rotate + (Math.random() - 0.5) * 30,
      scale: Math.max(0.7, Math.min(1.3, prev.scale + (Math.random() - 0.5) * 0.2)),
    }));

    setTimeout(() => {
      setEmojis(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220_15%_95%)] to-[hsl(220_15%_90%)] flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatePresence>
        {emojis.map((particle) => {
          const duration = 2.5;
          const gravity = 2000;
          const v0y = particle.vy;

          const points = 25;
          const yPath: number[] = [];
          const xPath: number[] = [];
          for (let i = 0; i <= points; i++) {
            const t = (i / points) * duration;
            const y = v0y * t + 0.5 * gravity * t * t;
            const x = particle.vx * t;
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

      <div className="relative z-10 text-center px-4">
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

        <div className="robot-display rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h1 className="text-6xl font-black text-cyan-400 mb-2 digital-text">{code}</h1>
          <p className="text-cyan-400/80 font-mono text-sm">
            &gt; ERROR: {title}_
          </p>
          <p className="text-cyan-400/60 font-mono text-xs mt-2">
            {subtitle}
          </p>
        </div>

        <motion.button
          onClick={spawnEmojis}
          animate={{
            x: buttonStyle.x,
            y: buttonStyle.y,
            rotate: buttonStyle.rotate,
            scale: buttonStyle.scale,
          }}
          whileTap={{ scale: buttonStyle.scale * 0.95 }}
          whileHover={{ scale: buttonStyle.scale * 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`px-8 py-4 text-lg font-black uppercase tracking-wider rounded-xl
            border-4 text-white select-none
            ${isBroken
              ? 'bg-gradient-to-b from-gray-400 to-gray-600 border-gray-700 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_6px_0_hsl(0_0%_30%),0_8px_20px_rgba(0,0,0,0.3)] cursor-not-allowed opacity-60'
              : 'bg-gradient-to-b from-red-500 to-red-700 border-red-800 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_6px_0_hsl(0_70%_30%),0_8px_20px_rgba(0,0,0,0.3)] hover:from-red-400 hover:to-red-600'
            }
          `}
        >
          🚨 Don't Press 🚨
        </motion.button>

        <div className="h-8 flex items-center justify-center my-6">
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: (pressCount > 0 || isBroken) ? 1 : 0, y: 0 }}
            key={pressCount}
          >
            {isBroken && "You broke it :("}
            {!isBroken && pressCount === 1 && "I said don't press it!"}
            {!isBroken && pressCount === 2 && "Seriously, stop!"}
            {!isBroken && pressCount === 3 && "Why do you keep pressing?!"}
            {!isBroken && pressCount === 4 && "This is getting out of hand..."}
            {!isBroken && pressCount >= 5 && `You've pressed it ${pressCount} times. Are you ok?`}
          </motion.p>
        </div>

        {error && (
          <details className="text-left bg-gray-800/50 rounded-lg p-3 text-sm mb-6 max-w-md mx-auto">
            <summary className="cursor-pointer font-medium text-cyan-400/80 font-mono">
              &gt; Error details
            </summary>
            <pre className="mt-2 text-xs text-red-400 overflow-auto whitespace-pre-wrap font-mono">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.dispatchEvent(new CustomEvent('open-complain-dialog', {
              detail: error ? `Error: ${error.message}\n\nStack trace:\n${error.stack}` : undefined
            }))}
            className="gap-2"
          >
            <Bug className="h-4 w-4" />
            Complain
          </Button>
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
    </div>
  );
}
