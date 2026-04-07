import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../game/store/gameStore';
import { useVisualEffectStore } from '../../visual-effects/store/visualEffectStore';
import { MiniEventType } from '../../game/types';

const MINI_EVENT_LABELS: Record<MiniEventType, string> = {
  [MiniEventType.FLUX_SURGE]: 'Flux Surge',
  [MiniEventType.SCORE_RUSH]: 'Score Rush',
  [MiniEventType.CLEAR_BONUS]: 'Clear Bonus',
  [MiniEventType.COMBO_SHIELD]: 'Combo Shield',
  [MiniEventType.PIECE_BLESSING]: 'Piece Blessing',
};

const EVENT_LABELS: Record<string, string> = {
  ICE_STORM: 'ICE STORM',
  GRAVITY_RUSH: 'GRAVITY RUSH',
  QUAKE: 'QUAKE',
  MIRROR: 'MIRROR',
  CHAOS: 'CHAOS',
  VOID: 'VOID',
};

/**
 * Get color based on multiplier value
 * Requirements: 11.5
 * - Yellow for 2x
 * - Orange for 3x
 * - Red for 4x+
 */
function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 4.0) return '#ef4444'; // Red
  if (multiplier >= 3.0) return '#f97316'; // Orange
  if (multiplier >= 2.0) return '#eab308'; // Yellow
  return '#f59e0b'; // Default amber
}

export const MultiplierBreakdownDisplay: React.FC = () => {
  const lastMultiplierBreakdown = useGameStore(state => state.lastMultiplierBreakdown);
  const difficultyTier = useGameStore(state => state.difficultyTier);
  const activeEvent = useGameStore(state => state.activeEvent);
  const prefersReducedMotion = useVisualEffectStore(state => state.prefersReducedMotion);
  const [visible, setVisible] = useState(false);
  const [currentBreakdown, setCurrentBreakdown] = useState<typeof lastMultiplierBreakdown>(null);
  const [shouldPulse, setShouldPulse] = useState(false);

  useEffect(() => {
    if (lastMultiplierBreakdown && lastMultiplierBreakdown.total > 1.0) {
      setCurrentBreakdown(lastMultiplierBreakdown);
      setVisible(true);
      
      // Task 31.2: Trigger pulse animation on value change
      // Requirements: 11.3
      if (!prefersReducedMotion) {
        setShouldPulse(true);
        setTimeout(() => setShouldPulse(false), 300);
      }
      
      // Task 31.4: Fade-out after 3 seconds
      // Requirements: 11.4
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastMultiplierBreakdown, prefersReducedMotion]);

  if (!currentBreakdown || !visible) return null;

  const { tier, event, miniEvents, total } = currentBreakdown;

  // Only show multipliers that are not 1.0
  const showTier = tier > 1.0;
  const showEvent = event > 1.0;
  const showMiniEvents = miniEvents.length > 0;

  // If no multipliers are active, don't show anything
  if (!showTier && !showEvent && !showMiniEvents) return null;
  
  // Task 31.3: Color coding based on total multiplier
  // Requirements: 11.5
  const totalColor = getMultiplierColor(total);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          x: 0, 
          scale: shouldPulse && !prefersReducedMotion ? [1, 1.2, 1] : 1 
        }}
        exit={{ opacity: 0, x: 20, scale: 0.9 }}
        transition={{ 
          duration: prefersReducedMotion ? 0.15 : 0.3,
          scale: { duration: 0.3, times: [0, 0.5, 1] }
        }}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--tray-height, 90px) + env(safe-area-inset-bottom, 0px) + 8px)',
          right: 16, // Task 31.1: 16px margin
          zIndex: 40,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8, // Task 31.1: 8px spacing between badges
          padding: '8px 10px',
          background: 'rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
          minWidth: 140,
          maxWidth: 180,
        }}
      >
        {/* Individual Multipliers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {showTier && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6', whiteSpace: 'nowrap' }}>
                Tier {difficultyTier}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>
                {tier.toFixed(2)}x
              </span>
            </div>
          )}

          {showEvent && activeEvent && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {EVENT_LABELS[activeEvent]}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>
                {event.toFixed(2)}x
              </span>
            </div>
          )}

          {showMiniEvents && miniEvents.map((miniEvent) => (
            <div
              key={miniEvent.type}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 9, fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {MINI_EVENT_LABELS[miniEvent.type]}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                {miniEvent.multiplier.toFixed(1)}x
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Total Multiplier */}
        {/* Task 31.3: Color coding based on total multiplier */}
        {/* Requirements: 11.5 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: totalColor }}>
            TOPLAM
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, color: totalColor }}>
            {total.toFixed(2)}x
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
