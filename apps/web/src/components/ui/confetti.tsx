/**
 * Confetti celebration component
 *
 * Triggers a burst of colorful confetti pieces that animate across the screen.
 * Use for celebrating milestones, completions, or achievements.
 */
import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // green
  '#f59e0b', // amber
  '#06b6d4', // cyan
];

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  pieceCount?: number;
}

export function Confetti({ trigger, duration = 2000, pieceCount = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 500,
        rotation: Math.random() * 360,
        size: Math.random() * 8 + 4,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        setIsActive(false);
      }, duration + 500);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration, pieceCount, isActive]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0"
          style={{
            left: `${piece.x}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${duration}ms ease-out forwards`,
            animationDelay: `${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Simple success burst animation
 * Shows expanding rings when triggered
 */
interface SuccessBurstProps {
  trigger: boolean;
}

export function SuccessBurst({ trigger }: SuccessBurstProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg">
      <div
        className="absolute w-4 h-4 rounded-full bg-green-500/30"
        style={{
          animation: 'scale-in 0.6s ease-out forwards',
          transformOrigin: 'center',
        }}
      />
      <div
        className="absolute w-8 h-8 rounded-full border-2 border-green-500/20"
        style={{
          animation: 'scale-in 0.4s ease-out forwards',
          animationDelay: '100ms',
        }}
      />
    </div>
  );
}
