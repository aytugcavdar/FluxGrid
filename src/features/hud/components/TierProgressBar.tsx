import React from 'react';
import { motion } from 'framer-motion';
import { getTierProgress } from '../../game/store/helpers/progressionSystem';
import { TIER_THRESHOLDS } from '../../game/constants';

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
  
  // Bir sonraki tier için gereken puan
  const scoreNeeded = !isMaxTier ? TIER_THRESHOLDS[tier + 1] - score : 0;
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 6, 
      minWidth: 120,
      padding: '8px 12px',
      background: 'rgba(167,139,250,0.08)',
      borderRadius: 12,
      border: '1px solid rgba(167,139,250,0.2)',
      boxShadow: '0 2px 8px rgba(167,139,250,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.5px' }}>
          Tier {tier}
        </span>
        {!isMaxTier && (
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
            +{scoreNeeded.toLocaleString()} puan
          </span>
        )}
      </div>
      
      <div style={{ 
        width: '100%', 
        height: 8, 
        background: 'rgba(0,0,0,0.3)', 
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
      }}>
        {isMaxTier ? (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #a78bfa, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(167,139,250,0.5)'
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'white', letterSpacing: '0.5px' }}>
              MAX TIER
            </span>
          </div>
        ) : (
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #a78bfa)',
              borderRadius: 4,
              boxShadow: '0 0 6px rgba(59,130,246,0.4)'
            }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        )}
      </div>
    </div>
  );
};
