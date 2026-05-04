import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { detectReducedMotion } from '../../visual-effects/utils/reducedMotionDetector';
import { GameMode } from '@shared/types';

interface FloatingTime {
  id: string;
  value: number; // in seconds
  x: number;
  y: number;
}

export const FloatingTimeText: React.FC = React.memo(() => {
  const { gameMode, timerExpectedEnd, isGameOver, lastAction } = useGameStore();
  const [floatingTexts, setFloatingTexts] = useState<FloatingTime[]>([]);
  const [prevExpectedEnd, setPrevExpectedEnd] = useState<number | null>(null);
  const [prefersReducedMotion] = useState(detectReducedMotion());

  useEffect(() => {
    if (isGameOver || gameMode !== GameMode.TIMED) {
      setPrevExpectedEnd(null);
      setFloatingTexts([]);
      return;
    }

    if (timerExpectedEnd !== null && prevExpectedEnd !== null) {
      const addedMs = timerExpectedEnd - prevExpectedEnd;
      // Only show if at least 0.5s was added
      if (addedMs >= 500) {
        // Calculate added seconds
        const addedSeconds = Math.round((addedMs / 1000) * 10) / 10;
        
        // Use a fixed position slightly offset from the score to prevent overlap
        // or position based on last action if possible
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2 + 60; // Below center
        
        const newText: FloatingTime = {
          id: `${Date.now()}-${Math.random()}`,
          value: addedSeconds,
          x,
          y,
        };

        setFloatingTexts(prev => {
          const updated = [...prev, newText];
          return updated.slice(-3); // Keep only last 3
        });

        // Remove after animation completes
        setTimeout(() => {
          setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
        }, 2000);
      }
    }
    
    setPrevExpectedEnd(timerExpectedEnd);
  }, [timerExpectedEnd, gameMode, isGameOver]);

  if (gameMode !== GameMode.TIMED) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 145 }}>
      <AnimatePresence>
        {floatingTexts.map((text) => {
          return (
            <motion.div
              key={text.id}
              initial={{ 
                opacity: 0, 
                scale: 0.5,
                x: '-50%',
                y: '-50%',
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                scale: [0.5, 1.2, 1, 0.9],
                y: ['-50%', 'calc(-50% - 30px)', 'calc(-50% - 40px)', 'calc(-50% - 50px)'],
                x: '-50%',
              }}
              exit={{ opacity: 0, scale: 0.8, y: 'calc(-50% - 60px)' }}
              transition={{ 
                duration: 2.0,
                ease: 'easeOut',
                opacity: { times: [0, 0.1, 0.7, 1] },
                scale: { times: [0, 0.2, 0.4, 1] },
              }}
              style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 80, // Offset below the score text
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(16, 185, 129, 0.15)', // Tailwind emerald-500 with opacity
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '16px',
                padding: '4px 12px',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              }}>
                <span style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#34d399', // Tailwind emerald-400
                  textShadow: '0 0 10px rgba(52, 211, 153, 0.5)',
                  letterSpacing: '1px',
                }}>
                  +{text.value}s
                </span>
                
                {/* Timer Icon */}
                <svg 
                  width="20" height="20" viewBox="0 0 24 24" 
                  fill="none" stroke="#34d399" strokeWidth="2.5" 
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginLeft: 6, filter: 'drop-shadow(0 0 5px rgba(52,211,153,0.5))' }}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
