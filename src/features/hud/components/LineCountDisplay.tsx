import React from 'react';
import { motion } from 'framer-motion';

interface LineCountDisplayProps {
  lineCount: number;
  show: boolean;
}

const getLineCountColor = (count: number): string => {
  if (count >= 4) return '#f59e0b'; // gold
  if (count === 3) return '#a855f7'; // purple
  if (count === 2) return '#3b82f6'; // blue
  return '#ffffff';
};

export const LineCountDisplay: React.FC<LineCountDisplayProps> = ({ lineCount, show }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!show || lineCount < 2) return null;
  
  const color = getLineCountColor(lineCount);
  
  return (
    <motion.div
      key={`linecount-${lineCount}-${Date.now()}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
      transition={{ duration: 1.0, times: [0, 0.2, 0.7, 1], ease: 'easeOut' }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-55"
    >
      <motion.span
        className="text-5xl md:text-7xl font-black tracking-tight"
        style={{
          color,
          textShadow: `0 0 20px ${color}80, 0 0 40px ${color}40`,
          WebkitTextStroke: '2px rgba(0, 0, 0, 0.3)'
        }}
        animate={
          !prefersReducedMotion
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }
            : {}
        }
        transition={{ duration: 0.4, repeat: 2 }}
      >
        {lineCount} SATIR!
      </motion.span>
    </motion.div>
  );
};
