import React from 'react';
import { motion } from 'framer-motion';

interface TierCelebrationOverlayProps {
  tier: number;
  tierName: string;
  multiplier: number;
}

const TIER_COLORS: Record<number, string> = {
  1: '#3b82f6',  // blue
  2: '#10b981',  // green
  3: '#f59e0b',  // amber
  4: '#ef4444',  // red
  5: '#9333ea',  // purple
  6: '#dc2626',  // dark red
};

export const TierCelebrationOverlay: React.FC<TierCelebrationOverlayProps> = React.memo(({
  tier,
  tierName,
  multiplier,
}) => {
  const tierColor = TIER_COLORS[tier] ?? '#3b82f6';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return (
    <>
      {/* Minimal flash effect - like ComboFlash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: [0, 0.35, 0.12, 0],
          scale: [0.95, 1.03, 1, 1]
        }}
        transition={{ 
          duration: 1.8,
          times: [0, 0.15, 0.5, 1],
          ease: "easeOut"
        }}
        className="fixed inset-0 pointer-events-none z-[60]"
        style={{
          background: `radial-gradient(circle at center, ${tierColor}30 0%, ${tierColor}15 40%, transparent 70%)`,
        }}
      />
      
      {/* Compact badge at top center */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0, y: -20 } : { opacity: 0, y: -30, scale: 0.7 }}
        animate={prefersReducedMotion 
          ? { opacity: [0, 1, 1, 0], y: [-20, 0, 0, -10] }
          : { 
              opacity: [0, 1, 1, 0], 
              y: [-30, 0, 0, -10],
              scale: [0.7, 1.1, 1, 0.95]
            }
        }
        transition={{ 
          duration: 2.5,
          times: [0, 0.2, 0.75, 1],
          ease: "easeOut"
        }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[65] pointer-events-none"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '12px 20px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${tierColor}25 0%, ${tierColor}15 100%)`,
          border: `2px solid ${tierColor}`,
          boxShadow: `0 8px 32px ${tierColor}40, 0 0 0 1px ${tierColor}20`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: tierColor, opacity: 0.8, letterSpacing: '0.1em' }}>
          TİER {tier}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: tierColor, letterSpacing: '0.02em', lineHeight: 1 }}>
          {tierName}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: tierColor, opacity: 0.9 }}>
          {multiplier.toFixed(2)}× Çarpan
        </div>
      </motion.div>
    </>
  );
});
