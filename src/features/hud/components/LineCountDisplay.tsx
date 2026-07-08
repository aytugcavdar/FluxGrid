import React from 'react';
import { motion } from 'framer-motion';

interface LineCountDisplayProps {
  lineCount: number;
  show: boolean;
}

const getLineCountColor = (count: number): string => {
  if (count >= 4) return '#f59e0b';
  if (count === 3) return '#a855f7';
  if (count === 2) return '#38bdf8';
  return '#94a3b8';
};

const getLineCountLabel = (count: number): string => {
  if (count >= 4) return 'BÜYÜK TEMİZLİK';
  if (count === 3) return 'SÜPER';
  return 'ÇİFT TEMİZLİK';
};

export const LineCountDisplay: React.FC<LineCountDisplayProps> = React.memo(({ lineCount, show }) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!show || lineCount < 2) return null;
  
  const color = getLineCountColor(lineCount);
  const label = getLineCountLabel(lineCount);
  
  return (
    <motion.div
      key={`linecount-${lineCount}`}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -8, scale: 0.96 }}
      animate={{ opacity: [0, 1, 1, 0], y: prefersReducedMotion ? 0 : [-8, 0, 0, -10], scale: [0.96, 1, 1, 0.98] }}
      transition={{ duration: 0.68, times: [0, 0.2, 0.72, 1], ease: 'easeOut' }}
      className="fixed left-1/2 pointer-events-none z-40"
      style={{
        top: 'calc(var(--safe-area-top, 0px) + var(--hud-height, 85px) + 8px)',
        transform: 'translateX(-50%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 10px',
          borderRadius: 999,
          background: 'rgba(8, 12, 20, 0.78)',
          border: `1px solid ${color}55`,
          boxShadow: `0 6px 18px rgba(0,0,0,0.22), 0 0 10px ${color}22`,
          color,
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 950, lineHeight: 1 }}>
          {lineCount}
        </span>
        <span
          style={{
            width: 1,
            height: 14,
            background: `${color}55`,
            display: 'block',
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontWeight: 850,
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.78)',
          }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if lineCount or show changes
  return prevProps.lineCount === nextProps.lineCount && prevProps.show === nextProps.show;
});
