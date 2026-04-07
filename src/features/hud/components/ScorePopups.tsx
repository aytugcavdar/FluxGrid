import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
  offsetX?: number;  // NEW: Random horizontal offset (-20 to +20)
  stackIndex?: number; // NEW: For vertical positioning
}

interface ScorePopupsProps {
  popups: ScorePopup[];
}

interface ScoreSize {
  fontSize: string;
  color: string;
  hasGlow: boolean;
  hasGradient: boolean;
  animation: 'simple' | 'scale' | 'scale-glow' | 'scale-rotate-float';
}

const SCORE_THRESHOLDS = {
  MEGA: 5000,
  LARGE: 2000,
  MEDIUM: 500,
  SMALL: 0
};

const getScoreSize = (score: number): ScoreSize => {
  if (score >= SCORE_THRESHOLDS.MEGA) {
    return {
      fontSize: '56px',
      color: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      hasGlow: true,
      hasGradient: true,
      animation: 'scale-rotate-float'
    };
  } else if (score >= SCORE_THRESHOLDS.LARGE) {
    return {
      fontSize: '44px',
      color: '#f59e0b', // gold
      hasGlow: true,
      hasGradient: false,
      animation: 'scale-glow'
    };
  } else if (score >= SCORE_THRESHOLDS.MEDIUM) {
    return {
      fontSize: '32px',
      color: '#3b82f6', // blue
      hasGlow: false,
      hasGradient: false,
      animation: 'scale'
    };
  } else {
    return {
      fontSize: '24px',
      color: '#ffffff',
      hasGlow: false,
      hasGradient: false,
      animation: 'simple'
    };
  }
};

export const ScorePopups: React.FC<ScorePopupsProps> = ({ popups }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Calculate stack positions with random horizontal offsets
  // Requirements: 2.1, 2.2
  const stackedPopups = popups.map((p, index) => ({
    ...p,
    stackIndex: index,
    offsetX: p.offsetX ?? (Math.random() - 0.5) * 40 // -20 to +20
  }));
  
  return (
    <div className="fixed top-16 left-0 right-0 flex flex-col items-center pointer-events-none z-50">
      <AnimatePresence mode="popLayout">
        {stackedPopups.map((p) => {
          const sizeConfig = getScoreSize(p.value);
          
          // Vertical stacking offset (40px spacing per spec)
          // Requirements: 2.2
          const stackOffset = p.stackIndex! * 40;
          
          // Size scaling for values > 1000
          // Requirements: 2.4
          const isLarge = p.value > 1000;
          const scale = isLarge ? 1.3 : 1.0;
          
          return (
            <motion.div
              key={p.id}
              initial={{ 
                opacity: 0, 
                y: 40 + stackOffset, 
                x: p.offsetX,
                scale: 0.5 
              }}
              animate={
                prefersReducedMotion
                  ? { 
                      opacity: [0, 1, 1, 0], 
                      y: [40 + stackOffset, -20 + stackOffset],
                      x: p.offsetX
                    }
                  : {
                      opacity: [0, 1, 1, 0],
                      y: [40 + stackOffset, -20 + stackOffset, -60 + stackOffset, -100 + stackOffset],
                      x: p.offsetX,
                      scale: [0.5, scale, scale, 0.8]
                    }
              }
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{
                duration: prefersReducedMotion ? 0.4 : 0.8,
                times: [0, 0.2, 0.7, 1],
                ease: 'easeOut'
              }}
              className="flex items-center gap-2 mb-1"
              style={{
                // Combo glow effect
                // Requirements: 2.5
                filter: p.combo > 1 && !prefersReducedMotion
                  ? 'drop-shadow(0 0 2px rgba(245, 158, 11, 0.6))'
                  : 'none'
              }}
            >
              <motion.span
                style={{
                  fontSize: isLarge ? '44px' : '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                }}
              >
                +{p.value.toLocaleString()}
              </motion.span>
              
              {p.combo > 1 && (
                <motion.span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1
                  }}
                >
                  x{p.combo}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
