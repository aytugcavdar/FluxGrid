import React from 'react';
import { motion } from 'framer-motion';

interface ComboFlashProps {
  combo: number;
}

const isComboMilestone = (combo: number): boolean =>
  combo === 2 || combo === 5 || combo === 8 || (combo > 8 && combo % 5 === 0);

const getComboTone = (combo: number) => {
  if (combo >= 8) return { color: '#f472b6', label: 'SERİ KIZIŞTI' };
  if (combo >= 5) return { color: '#f59e0b', label: 'COMBO YÜKSELDİ' };
  return { color: '#34d399', label: 'COMBO BAŞLADI' };
};

export const ComboFlash: React.FC<ComboFlashProps> = React.memo(({ combo }) => {
  if (!isComboMilestone(combo)) return null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { color, label } = getComboTone(combo);

  return (
    <>
      <motion.div
        key={`pulse-${combo}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{
          opacity: [0, 0.28, 0],
          scale: [0.98, 1, 1],
        }}
        transition={{
          duration: 0.38,
          times: [0, 0.28, 1],
          ease: 'easeOut',
        }}
        className="fixed inset-0 pointer-events-none z-30"
        style={{
          background: `radial-gradient(circle at center, ${color}18 0%, transparent 56%)`,
          ...(prefersReducedMotion
            ? {
                border: `2px solid ${color}35`,
                boxShadow: `0 0 14px ${color}25`,
              }
            : {}),
        }}
      />

      <motion.div
        key={`text-${combo}`}
        initial={{ y: prefersReducedMotion ? 0 : -8, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: [0.92, 1.06, 1], opacity: [0, 1, 0] }}
        transition={{
          duration: prefersReducedMotion ? 0.5 : 0.62,
          times: [0, 0.25, 1],
          ease: 'easeOut',
        }}
        className="fixed left-1/2 pointer-events-none z-40"
        style={{
          top: 'calc(var(--safe-area-top, 0px) + 76px)',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 11px',
          borderRadius: 10,
          background: 'rgba(8, 6, 18, 0.82)',
          border: `1px solid ${color}66`,
          boxShadow: `0 0 18px ${color}32`,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1 }}>{combo}x</span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.76)',
          }}
        >
          {label}
        </span>
      </motion.div>
    </>
  );
}, (prevProps, nextProps) => prevProps.combo === nextProps.combo);
