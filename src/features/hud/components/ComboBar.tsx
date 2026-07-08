import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { COMBO_TIMER } from '@features/game/constants';
import { useGameStore } from '@features/game/store/gameStore';
import { usePerformanceStore } from '@features/performance/store/performanceStore';

interface ComboBarProps {
  gridSize?: number;
  side?: 'left' | 'right';
  variant?: 'side' | 'top';
}

export const ComboBar: React.FC<ComboBarProps> = React.memo(({ gridSize = 0, side = 'left', variant = 'side' }) => {
  const combo = useGameStore(state => state.combo);
  const comboTimeLeft = useGameStore(state => state.comboTimeLeft);
  const comboTimerDuration = useGameStore(state => state.comboTimerDuration);
  const comboTimerStartTime = useGameStore(state => state.comboTimerStartTime);
  const isGameOver = useGameStore(state => state.isGameOver);
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const [now, setNow] = React.useState(() => Date.now());
  const useReducedGameplayMotion = Capacitor.isNativePlatform() ||
    deviceTier === 'low' ||
    deviceTier === 'low-mid' ||
    deviceTier === 'mid-low' ||
    deviceTier === 'mid';

  React.useEffect(() => {
    if (combo <= 0 || isGameOver || comboTimerStartTime === null) return;

    const tick = () => {
      setNow(Date.now());
    };

    tick();
    const intervalId = window.setInterval(tick, useReducedGameplayMotion ? 1000 : 500);
    return () => window.clearInterval(intervalId);
  }, [combo, comboTimerStartTime, isGameOver, useReducedGameplayMotion]);

  if (combo <= 0 || isGameOver) return null;

  const durationMs = comboTimerDuration > 0 ? comboTimerDuration : COMBO_TIMER.DURATION;
  const durationSeconds = durationMs / 1000;
  const timeLeft = comboTimerStartTime !== null
    ? Math.max(0, (comboTimerStartTime + durationMs - now) / 1000)
    : Math.max(0, comboTimeLeft);
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

  if (variant === 'top') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 9px',
            borderRadius: 999,
            background: 'rgba(8,12,20,0.78)',
            border: `1px solid ${barColor}66`,
            boxShadow: useReducedGameplayMotion
              ? '0 2px 6px rgba(0,0,0,0.18)'
              : `0 6px 18px rgba(0,0,0,0.22), 0 0 12px ${barColor}24`,
            color: barColor,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <motion.span
            key={combo}
            initial={{ scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.16 }}
            style={{
              fontSize: 15,
              fontWeight: 950,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            x{combo}
          </motion.span>
          <div style={{
            width: 42,
            height: 3,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${fillPercent}%`,
              height: '100%',
              borderRadius: 999,
              background: barColor,
              boxShadow: useReducedGameplayMotion ? 'none' : `0 0 8px ${barColor}80`,
            }} />
          </div>
          <span style={{
            fontSize: 8,
            fontWeight: 850,
            lineHeight: 1,
            color: isCritical ? '#fecaca' : 'rgba(255,255,255,0.66)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.ceil(timeLeft)}s
          </span>
        </motion.div>
      </AnimatePresence>
    );
  }

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
            boxShadow: useReducedGameplayMotion ? '0 1px 4px rgba(0,0,0,0.18)' : `0 0 14px ${barColor}24`,
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
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillPercent}%`,
              background: barColor,
              borderRadius: 999,
              boxShadow: useReducedGameplayMotion ? 'none' : `0 0 12px ${barColor}80`,
            }}
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
