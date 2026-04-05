import React from 'react';
import { motion } from 'framer-motion';
import { getTierProgress } from '../../game/store/helpers/progressionSystem';

interface TierProgressBarProps {
  tier: number;
  score: number;
}

/**
 * TierProgressBar Component
 * 
 * Displays current tier number and progress bar showing advancement to next tier.
 * Shows "MAX TIER" when tier 6 is reached.
 * 
 * @param tier - Current difficulty tier (0-6)
 * @param score - Current score
 * 
 * @remarks
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */
export const TierProgressBar: React.FC<TierProgressBarProps> = ({ tier, score }) => {
  const progress = getTierProgress(score, tier);
  const isMaxTier = tier >= 6;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>
          Tier {tier}
        </span>
        {!isMaxTier && (
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
            {Math.floor(progress)}%
          </span>
        )}
      </div>
      
      <div style={{ 
        width: '100%', 
        height: 6, 
        background: 'rgba(255,255,255,0.07)', 
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        {isMaxTier ? (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #a78bfa, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>
              MAX TIER
            </span>
          </div>
        ) : (
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #a78bfa)',
              borderRadius: 3,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        )}
      </div>
    </div>
  );
};
