import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTierProgress } from '../../game/store/helpers/progressionSystem';
import { TIER_THRESHOLDS } from '../../game/constants';
import { usePerformanceStore } from '../../performance/store/performanceStore';

interface TierProgressBarProps {
  tier: number;
  score: number;
}

const TIER_GRADIENTS: Record<number, { bar: string; glow: string; border: string; bg: string }> = {
  0: { bar: 'linear-gradient(90deg, #6b7280, #9ca3af)',     glow: '#9ca3af', border: 'rgba(156,163,175,0.25)', bg: 'rgba(156,163,175,0.06)' },
  1: { bar: 'linear-gradient(90deg, #2563eb, #60a5fa)',     glow: '#3b82f6', border: 'rgba(59,130,246,0.3)',   bg: 'rgba(59,130,246,0.07)'  },
  2: { bar: 'linear-gradient(90deg, #059669, #34d399)',     glow: '#10b981', border: 'rgba(16,185,129,0.3)',   bg: 'rgba(16,185,129,0.07)'  },
  3: { bar: 'linear-gradient(90deg, #d97706, #fbbf24)',     glow: '#f59e0b', border: 'rgba(245,158,11,0.3)',   bg: 'rgba(245,158,11,0.07)'  },
  4: { bar: 'linear-gradient(90deg, #dc2626, #f87171)',     glow: '#ef4444', border: 'rgba(239,68,68,0.3)',    bg: 'rgba(239,68,68,0.07)'   },
  5: { bar: 'linear-gradient(90deg, #7c3aed, #c084fc)',     glow: '#a855f7', border: 'rgba(168,85,247,0.35)',  bg: 'rgba(168,85,247,0.08)'  },
  6: { bar: 'linear-gradient(90deg, #991b1b, #f87171, #fbbf24)', glow: '#f59e0b', border: 'rgba(220,38,38,0.4)', bg: 'rgba(220,38,38,0.08)' },
};

const TIER_NAMES: Record<number, string> = {
  0: 'Başlangıç', 1: 'Gelişmiş', 2: 'Uzman',
  3: 'Usta', 4: 'Efsane', 5: 'Kaos', 6: 'Sabit Alan',
};

const TIER_ICONS: Record<number, string> = {
  0: '○', 1: '◆', 2: '★', 3: '⚡', 4: '🔥', 5: '💀', 6: '∞',
};

export const TierProgressBar: React.FC<TierProgressBarProps> = React.memo(({ tier, score }) => {
  const progress    = getTierProgress(score, tier);
  const isMaxTier   = tier >= 6;
  const scoreNeeded = !isMaxTier ? TIER_THRESHOLDS[tier + 1] - score : 0;
  const theme       = TIER_GRADIENTS[tier] ?? TIER_GRADIENTS[0];
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const isConstrainedDevice = deviceTier === 'low' || deviceTier === 'low-mid';

  // Track tier changes for flash animation
  const prevTierRef      = useRef(tier);
  const [tierFlash, setTierFlash] = useState(false);

  useEffect(() => {
    if (tier > prevTierRef.current) {
      setTierFlash(!isConstrainedDevice);
      const t = setTimeout(() => setTierFlash(false), isConstrainedDevice ? 120 : 900);
      prevTierRef.current = tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = tier;
  }, [isConstrainedDevice, tier]);

  // Milestone dots at 25%, 50%, 75%
  const milestones = [25, 50, 75];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '7px 11px',
        background: tierFlash ? `${theme.glow}18` : theme.bg,
        borderRadius: 12,
        border: `1px solid ${tierFlash ? theme.glow + '60' : theme.border}`,
        boxShadow: tierFlash && !isConstrainedDevice
          ? `0 0 20px ${theme.glow}40`
          : `0 2px 8px rgba(0,0,0,0.12)`,
        transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Tier-up flash overlay */}
      <AnimatePresence>
        {tierFlash && !isConstrainedDevice && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${theme.glow}50 0%, transparent 70%)`,
              pointerEvents: 'none',
              borderRadius: 12,
            }}
          />
        )}
      </AnimatePresence>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Tier name + icon */}
        <motion.div
          key={tier}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <span style={{ fontSize: 12, lineHeight: 1 }}>{TIER_ICONS[tier] ?? '○'}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.glow,
              letterSpacing: '0.3px',
              lineHeight: 1,
            }}
          >
            {TIER_NAMES[tier] ?? `Tier ${tier}`}
          </span>
        </motion.div>

        {/* Score needed OR max label */}
        <motion.span
          key={`${tier}-${Math.floor(progress / 10)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: isMaxTier ? theme.glow : 'rgba(255,255,255,0.4)',
            lineHeight: 1,
          }}
        >
          {isMaxTier
            ? 'MAX TIER'
            : `+${scoreNeeded.toLocaleString()} puan`}
        </motion.span>
      </div>

      {/* Progress bar track */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 7,
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 4,
          overflow: 'visible',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        {/* Clip container for bar overflow */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden' }}>
          {/* Filled bar */}
          <motion.div
            animate={{ width: `${isMaxTier ? 100 : progress}%` }}
            transition={isConstrainedDevice ? { duration: 0.12, ease: 'linear' } : { type: 'spring', stiffness: 45, damping: 14 }}
            style={{
              position: 'absolute',
              left: 0, top: 0,
              height: '100%',
              background: theme.bar,
              borderRadius: 4,
              boxShadow: `0 0 8px ${theme.glow}80`,
            }}
          />

          {/* Shimmer sweep */}
          {!isMaxTier && !isConstrainedDevice && (
            <motion.div
              animate={{ x: ['-120%', '220%'] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '35%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                borderRadius: 4,
              }}
            />
          )}

          {/* MAX TIER rainbow shimmer */}
          {isMaxTier && !isConstrainedDevice && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                borderRadius: 4,
              }}
            />
          )}
        </div>

        {/* Milestone dots */}
        {!isMaxTier && milestones.map(ms => (
          <div
            key={ms}
            style={{
              position: 'absolute',
              left: `${ms}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 4, height: 4,
              borderRadius: '50%',
              background: progress >= ms ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
              boxShadow: progress >= ms ? `0 0 4px ${theme.glow}` : 'none',
              transition: 'background 0.3s ease, box-shadow 0.3s ease',
              zIndex: 2,
            }}
          />
        ))}

        {/* Leading dot (progress head) */}
        {!isMaxTier && progress > 2 && progress < 99 && (
          <motion.div
            animate={{ left: `${progress}%` }}
            transition={isConstrainedDevice ? { duration: 0.12, ease: 'linear' } : { type: 'spring', stiffness: 45, damping: 14 }}
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'white',
              boxShadow: `0 0 8px ${theme.glow}, 0 0 3px white`,
              zIndex: 3,
            }}
          />
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.tier === next.tier && prev.score === next.score);
