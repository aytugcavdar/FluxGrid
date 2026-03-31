import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComboRushFlashProps {
  active: boolean;
  movesLeft: number;
  onStart?: boolean; // true = başlangıç animasyonu, false = bitiş animasyonu
}

export const ComboRushFlash: React.FC<ComboRushFlashProps> = ({ active, movesLeft, onStart = false }) => {
  if (!active) return null;

  return (
    <AnimatePresence>
      {onStart ? (
        // RUSH start - toast style
        <motion.div
          key="rush-start"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--tray-height) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 50,
            padding: '8px 20px',
            borderRadius: '20px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#10b981',
              letterSpacing: '-0.02em',
            }}>
              ⚡ COMBO RUSH
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(16,185,129,0.7)',
              textTransform: 'uppercase',
            }}>
              ×3 hamle
            </span>
          </div>
        </motion.div>
      ) : (
        // RUSH end - toast style
        <motion.div
          key="rush-end"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--tray-height) + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 50,
            padding: '8px 20px',
            borderRadius: '20px',
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#f59e0b',
            letterSpacing: '-0.01em',
          }}>
            Rush bitti
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
