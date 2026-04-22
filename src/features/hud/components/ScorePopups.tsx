import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
  offsetX?: number;
  stackIndex?: number;
}

interface ScorePopupsProps {
  popups: ScorePopup[];
}

export const ScorePopups: React.FC<ScorePopupsProps> = React.memo(({ popups }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const stackedPopups = popups.map((p, index) => ({
    ...p,
    stackIndex: index,
    offsetX: p.offsetX ?? (Math.random() - 0.5) * 40
  }));
  
  return (
    <div className="fixed top-16 left-0 right-0 flex flex-col items-center pointer-events-none z-50">
      <AnimatePresence mode="popLayout">
        {stackedPopups.map((p) => {
          const stackOffset = p.stackIndex! * 40;
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
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if popups array reference changes
  return prevProps.popups === nextProps.popups;
});
