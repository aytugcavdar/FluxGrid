import React from 'react';
import { motion } from 'framer-motion';
import { ANIMATION_DURATIONS } from '../../../utils/animation/animationUtils';

interface ChronoPopupProps {
  id: number;
  seconds: number;
  onComplete: (id: number) => void;
}

/**
 * ChronoPopup Component
 * Displays "+Xs" popup when CHRONO block is cleared
 * Fixed positioning at right edge with slide-in and float-up animation
 */
export const ChronoPopup: React.FC<ChronoPopupProps> = ({
  id,
  seconds,
  onComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0, y: -60 }}
      exit={{ opacity: 0, y: -80 }}
      transition={{
        duration: ANIMATION_DURATIONS.CHRONO_POPUP / 1000,
        ease: 'easeOut',
      }}
      onAnimationComplete={() => {
        // Call onComplete after animation finishes
        setTimeout(() => onComplete(id), 100);
      }}
      style={{
        position: 'fixed',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 16px',
        borderRadius: '12px',
        background: 'rgba(251,191,36,0.15)',
        border: '1px solid rgba(251,191,36,0.4)',
      }}
    >
      {/* Large time text */}
      <span
        style={{
          fontSize: '26px',
          fontWeight: 900,
          color: '#fbbf24',
          textShadow: '0 0 8px rgba(251, 191, 36, 0.8)',
          fontFamily: 'var(--font-display), sans-serif',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        ⏱ +{seconds}s
      </span>
      
      {/* Small label text */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(251,191,36,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        Bonus süre
      </span>
    </motion.div>
  );
};
