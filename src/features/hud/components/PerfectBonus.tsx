import React from 'react';
import { motion } from 'framer-motion';

interface PerfectBonusProps {
  show: boolean;
}

export const PerfectBonus: React.FC<PerfectBonusProps> = ({ show }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  
  if (!show) return null;
  
  return (
    <motion.div
      key={`perfect-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1.1, y: -10 }}
      exit={{ opacity: 0, scale: 0.8, y: -40 }}
      transition={{ duration: 0.4, ease: 'backOut' }}
      className="flex flex-col items-center relative"
    >
      {/* Sparkle particles */}
      {!prefersReducedMotion && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, Math.cos((i * Math.PI * 2) / 8) * 60],
                y: [0, Math.sin((i * Math.PI * 2) / 8) * 60]
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: 'easeOut'
              }}
              className="absolute w-2 h-2 bg-amber-400 rounded-full"
              style={{
                boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)'
              }}
            />
          ))}
        </>
      )}
      
      {/* Main text */}
      <span
        className="font-black tracking-tight relative z-10"
        style={{
          fontSize: isMobile ? '48px' : '64px',
          color: '#fbbf24',
          textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
          WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)'
        }}
      >
        ✦ PERFECT!
      </span>
      
      <span className="text-[10px] tracking-widest text-amber-400/60 uppercase">
        +%50 Renk Bonusu
      </span>
    </motion.div>
  );
};
