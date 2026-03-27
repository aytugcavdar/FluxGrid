import React from 'react';
import { TIER_SCORE_MULTIPLIERS } from '../../game/constants';
import { motion } from 'framer-motion';

interface TierDisplayProps {
  tier: number;
  isMobile?: boolean;
}

const TIER_NAMES: Record<number, string> = {
  0: 'Başlangıç',
  1: 'Gelişmiş',
  2: 'Uzman',
  3: 'Usta',
  4: 'Efsane',
  5: 'Kaos',
  6: 'Void',
};

const TIER_COLORS: Record<number, { primary: string; bg: string; border: string }> = {
  0: { primary: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.2)' },
  1: { primary: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  2: { primary: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  3: { primary: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  4: { primary: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  5: { primary: '#9333ea', bg: 'rgba(147,51,234,0.1)', border: 'rgba(147,51,234,0.2)' },
  6: { primary: '#dc2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.2)' },
};

export const TierDisplay: React.FC<TierDisplayProps> = ({ tier, isMobile = false }) => {
  const tierName = TIER_NAMES[tier] ?? `Tier ${tier}`;
  const multiplier = TIER_SCORE_MULTIPLIERS[tier] ?? 1.0;
  const colors = TIER_COLORS[tier] ?? TIER_COLORS[0];

  if (isMobile) {
    return (
      <motion.div
        key={tier}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 8,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: colors.primary,
            lineHeight: 1,
          }}
        >
          T{tier}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: colors.primary,
            opacity: 0.7,
            lineHeight: 1,
          }}
        >
          {multiplier.toFixed(2)}×
        </span>
      </motion.div>
    );
  }

  // Desktop layout
  return (
    <motion.div
      key={tier}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px',
        borderRadius: 10,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        minWidth: 80,
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: colors.primary,
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        Tier {tier}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.primary,
          lineHeight: 1,
        }}
      >
        {multiplier.toFixed(2)}×
      </span>
      <span
        style={{
          fontSize: 8,
          fontWeight: 600,
          color: colors.primary,
          opacity: 0.6,
          lineHeight: 1,
        }}
      >
        {tierName}
      </span>
    </motion.div>
  );
};
