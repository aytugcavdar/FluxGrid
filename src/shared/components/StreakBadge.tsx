import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@shared/store/themeStore';

interface StreakBadgeProps {
  streak: number;
  todayPlayed: boolean;
  shields: number;
  onShieldPress: () => void;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak,
  todayPlayed,
  shields,
  onShieldPress
}) => {
  const colors = useThemeStore(state => state.getThemeColors());

  return (
    <motion.button
      onClick={onShieldPress}
      animate={!todayPlayed ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
        borderRadius: 10,
        border: `1px solid ${colors.hudBorder}`,
        background: colors.hudBackground,
        cursor: 'pointer',
        opacity: todayPlayed ? 1 : 0.5,
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* Fire emoji + streak number */}
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: todayPlayed ? colors.accentTimed : colors.textTertiary,
          display: 'flex',
          alignItems: 'center',
          gap: 3
        }}
      >
        🔥 {streak}
      </span>

      {/* Shield badge */}
      {shields > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: colors.accentPrimary,
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            border: `2px solid ${colors.hudBackground}`
          }}
        >
          🛡️
        </div>
      )}
    </motion.button>
  );
};
