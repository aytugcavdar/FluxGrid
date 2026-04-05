import React from 'react';
import { MiniEventType } from '../../game/types';

interface MiniEventIndicatorsProps {
  activeEvents: Set<MiniEventType>;
  moveCounters: Record<MiniEventType, number>;
}

/**
 * MiniEventIndicators Component
 * 
 * Displays all currently active mini-events with their icons, labels, and colors.
 * Shows remaining move count for PIECE_BLESSING.
 * 
 * @param activeEvents - Set of currently active mini-event types
 * @param moveCounters - Remaining duration for each mini-event
 * 
 * @remarks
 * **Event Configuration:**
 * - FLUX_SURGE: ⚡ FLUX SURGE (Amber)
 * - SCORE_RUSH: 🎯 SCORE RUSH (Green)
 * - CLEAR_BONUS: 💎 CLEAR BONUS (Purple)
 * - COMBO_SHIELD: 🛡️ COMBO SHIELD (Blue)
 * - PIECE_BLESSING: ✨ PIECE BLESSING (X) (Gold)
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**
 */
export const MiniEventIndicators: React.FC<MiniEventIndicatorsProps> = ({
  activeEvents,
  moveCounters,
}) => {
  const eventConfig = {
    [MiniEventType.FLUX_SURGE]: { icon: '⚡', label: 'FLUX SURGE', color: '#f59e0b' },
    [MiniEventType.SCORE_RUSH]: { icon: '🎯', label: 'SCORE RUSH', color: '#10b981' },
    [MiniEventType.CLEAR_BONUS]: { icon: '💎', label: 'CLEAR BONUS', color: '#a78bfa' },
    [MiniEventType.COMBO_SHIELD]: { icon: '🛡️', label: 'COMBO SHIELD', color: '#3b82f6' },
    [MiniEventType.PIECE_BLESSING]: { icon: '✨', label: 'PIECE BLESSING', color: '#f59e0b' },
  };
  
  if (activeEvents.size === 0) {
    return null;
  }
  
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
      {Array.from(activeEvents).map((eventType) => {
        const config = eventConfig[eventType];
        const counter = moveCounters[eventType];
        
        return (
          <div
            key={eventType}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              background: `${config.color}20`,
              border: `1px solid ${config.color}40`,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>{config.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: config.color }}>
              {config.label}
              {eventType === MiniEventType.PIECE_BLESSING && ` (${counter})`}
            </span>
          </div>
        );
      })}
    </div>
  );
};
