import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMBO_TIMER } from '@features/game/constants';
import { useGameStore } from '@features/game/store/gameStore';

interface ComboBarProps {
  gridSize?: number;
  side?: 'left' | 'right';
}

export const ComboBar: React.FC<ComboBarProps> = React.memo(({ gridSize = 0, side = 'left' }) => {
  const combo = useGameStore(state => state.combo);
  const comboTimeLeft = useGameStore(state => state.comboTimeLeft);
  const comboTimerDuration = useGameStore(state => state.comboTimerDuration);
  const isGameOver = useGameStore(state => state.isGameOver);

  if (combo <= 0 || isGameOver) return null;

  const durationSeconds = comboTimerDuration > 0
    ? comboTimerDuration / 1000
    : COMBO_TIMER.DURATION / 1000;
  const timeLeft = comboTimeLeft > 0 ? comboTimeLeft : durationSeconds;
  const fillPercent = Math.max(0, Math.min(100, (timeLeft / durationSeconds) * 100));
  const isCritical = timeLeft <= COMBO_TIMER.CRITICAL_THRESHOLD;
  const isWarning = timeLeft <= COMBO_TIMER.WARNING_THRESHOLD;
  const barColor = isCritical ? '#ef4444'
    : isWarning ? '#f59e0b'
    : combo >= 8 ? '#f472b6'
    : combo >= 5 ? '#f59e0b'
    : combo >= 3 ? '#34d399'
    : '#22c55e';
  const sideOffset = gridSize > 0
    ? `max(6px, calc(50% - ${Math.round(gridSize / 2)}px - 34px))`
    : 8;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: side === 'left' ? -8 : 8, y: '-50%' }}
        animate={{ opacity: 1, x: 0, y: '-50%' }}
        exit={{ opacity: 0, x: side === 'left' ? -8 : 8, y: '-50%' }}
        style={{
          position: 'absolute',
          [side]: sideOffset,
          top: '50%',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          key={combo}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.16 }}
          style={{
            minWidth: 28,
            minHeight: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: 'rgba(8,10,24,0.72)',
            border: `1px solid ${barColor}66`,
            boxShadow: `0 0 14px ${barColor}24`,
            fontSize: 17,
            fontWeight: 900,
            color: barColor,
            lineHeight: 1,
            letterSpacing: 0,
          }}
        >
          x{combo}
        </motion.div>

        <div style={{
          width: 6,
          height: 88,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}>
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillPercent}%`,
              background: barColor,
              borderRadius: 999,
              boxShadow: `0 0 12px ${barColor}80`,
            }}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: 0.18, ease: 'linear' }}
          />
        </div>

        <div style={{
          fontSize: 7,
          color: `${barColor}80`,
          fontWeight: 700,
          letterSpacing: 0,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
        }}>
          COMBO
        </div>

        <div style={{
          minWidth: 24,
          textAlign: 'center',
          fontSize: 9,
          color: isCritical ? '#fecaca' : 'rgba(255,255,255,0.56)',
          fontWeight: 800,
          lineHeight: 1,
        }}>
          {Math.ceil(timeLeft)}s
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
