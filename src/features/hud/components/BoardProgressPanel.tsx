import React from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@shared/types';
import { useGameStore } from '../../game/store/gameStore';
import { TIER_THRESHOLDS } from '../../game/constants';
import { getTierProgress } from '../../game/store/helpers/progressionSystem';

const TIER_COLORS: Record<number, { color: string; bg: string; border: string }> = {
  0: { color: '#94a3b8', bg: 'rgba(15,23,42,0.72)', border: 'rgba(148,163,184,0.2)' },
  1: { color: '#60a5fa', bg: 'rgba(15,23,42,0.76)', border: 'rgba(96,165,250,0.3)' },
  2: { color: '#34d399', bg: 'rgba(6,20,18,0.76)', border: 'rgba(52,211,153,0.3)' },
  3: { color: '#fbbf24', bg: 'rgba(24,18,6,0.76)', border: 'rgba(251,191,36,0.32)' },
  4: { color: '#f87171', bg: 'rgba(26,10,10,0.76)', border: 'rgba(248,113,113,0.34)' },
  5: { color: '#c084fc', bg: 'rgba(22,12,34,0.78)', border: 'rgba(192,132,252,0.34)' },
  6: { color: '#f59e0b', bg: 'rgba(28,16,6,0.8)', border: 'rgba(245,158,11,0.38)' },
};

export const BoardProgressPanel: React.FC = React.memo(() => {
  const score = useGameStore(state => state.score);
  const gameMode = useGameStore(state => state.gameMode);
  const progressionState = useGameStore(state => state.progressionState);
  const difficultyTier = useGameStore(state => state.difficultyTier);

  if (gameMode !== GameMode.ENDLESS || !progressionState) return null;

  const isMaxTier = difficultyTier >= TIER_THRESHOLDS.length - 1;
  const progress = isMaxTier ? 100 : getTierProgress(score, difficultyTier);
  const theme = TIER_COLORS[difficultyTier] ?? TIER_COLORS[0];
  const nextThreshold = TIER_THRESHOLDS[difficultyTier + 1] ?? score;
  const scoreNeeded = Math.max(0, nextThreshold - score);
  const scoreNeededLabel = scoreNeeded.toLocaleString('tr-TR');

  return (
    <div
      role="progressbar"
      aria-label={`Tier ${difficultyTier} progress ${Math.round(progress)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      style={{
        position: 'absolute',
        top: -30,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 22px)',
        maxWidth: 360,
        zIndex: 34,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '4px 8px 5px',
          borderRadius: 9,
          background: `linear-gradient(180deg, ${theme.bg}, rgba(8,12,20,0.42))`,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 5px 13px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
            color: 'rgba(255,255,255,0.72)',
            fontSize: 8.5,
            fontWeight: 850,
            lineHeight: 1,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: theme.color }}>Tier {difficultyTier}</span>
          <span style={{ color: 'rgba(255,255,255,0.78)' }}>{Math.round(progress)}%</span>
          <span style={{ color: isMaxTier ? theme.color : 'rgba(255,255,255,0.55)' }}>
            {isMaxTier ? 'MAX' : `+${scoreNeededLabel} PUAN`}
          </span>
        </div>

        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.09)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.18, ease: 'linear' }}
            style={{
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.color}AA, ${theme.color})`,
              boxShadow: `0 0 10px ${theme.color}88`,
            }}
          />
        </div>
      </div>
    </div>
  );
});
