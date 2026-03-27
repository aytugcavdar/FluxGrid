import React from 'react';
import { motion } from 'framer-motion';
import { ANIMATION_DURATIONS } from '../../../utils/animationUtils';

interface ChronoPopupProps {
  id: number;
  seconds: number;
  x: number; // Grid X coordinate (0-9)
  y: number; // Grid Y coordinate (0-9)
  onComplete: (id: number) => void;
}

/**
 * ChronoPopup Component
 * Displays "+Xs" popup when CHRONO block is cleared
 * Animates upward by 60px over 1.2s with fade-out
 */
export const ChronoPopup: React.FC<ChronoPopupProps> = ({
  id,
  seconds,
  x,
  y,
  onComplete,
}) => {
  // Convert grid coordinates to screen position
  // Grid is centered on screen, each cell is approximately 40px
  // This is an approximation - actual positioning depends on grid size
  const CELL_SIZE = 40;
  const GRID_SIZE = 10;
  const gridWidth = GRID_SIZE * CELL_SIZE;
  
  // Calculate position relative to grid center
  const left = `calc(50% - ${gridWidth / 2}px + ${x * CELL_SIZE + CELL_SIZE / 2}px)`;
  const top = `calc(50% - ${gridWidth / 2}px + ${y * CELL_SIZE}px)`;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(id);
    }, ANIMATION_DURATIONS.CHRONO_POPUP);

    return () => clearTimeout(timer);
  }, [id, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: -40 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: ANIMATION_DURATIONS.CHRONO_POPUP / 1000,
        ease: 'easeOut',
      }}
      style={{
        position: 'fixed',
        left,
        top,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: '24px',
          lineHeight: 1,
        }}
      >
        ⏱️
      </span>
      
      {/* Text */}
      <span
        style={{
          fontSize: '28px',
          fontWeight: 900,
          color: '#fbbf24',
          textShadow: '0 0 8px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)',
          fontFamily: 'var(--font-display), sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        +{seconds}s
      </span>
    </motion.div>
  );
};
