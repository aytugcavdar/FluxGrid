import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MiniEventType } from '../../game/types';

interface MiniEventIndicatorsProps {
  activeEvents: Set<MiniEventType>;
  isMobile?: boolean;
}

const MINI_EVENT_CONFIG: Record<MiniEventType, { icon: string; label: string; color: string; bg: string }> = {
  [MiniEventType.FLUX_SURGE]: {
    icon: '⚡',
    label: 'Flux Surge',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
  },
  [MiniEventType.SCORE_RUSH]: {
    icon: '🚀',
    label: 'Score Rush',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
  },
  [MiniEventType.CLEAR_BONUS]: {
    icon: '🎯',
    label: 'Clear Bonus',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
  },
};

export const MiniEventIndicators: React.FC<MiniEventIndicatorsProps> = ({ activeEvents, isMobile = false }) => {
  const activeEventArray = Array.from(activeEvents);

  if (activeEventArray.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: isMobile ? 4 : 6,
        alignItems: 'center',
      }}
    >
      <AnimatePresence>
        {activeEventArray.map((eventType) => {
          const config = MINI_EVENT_CONFIG[eventType];
          return (
            <motion.div
              key={eventType}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 3 : 4,
                padding: isMobile ? '3px 6px' : '4px 8px',
                borderRadius: isMobile ? 6 : 8,
                background: config.bg,
                border: `1px solid ${config.color}40`,
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  fontSize: isMobile ? 12 : 14,
                  lineHeight: 1,
                }}
              >
                {config.icon}
              </motion.span>
              {!isMobile && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: config.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {config.label}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
