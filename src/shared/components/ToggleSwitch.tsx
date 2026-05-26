import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';
import { ToggleSwitchProps } from '../types/ui';

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  value,
  onChange,
  disabled = false,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

  return (
    <motion.button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      whileTap={{ scale: 0.985 }}
      className="w-full flex items-center justify-between rounded-2xl transition-colors duration-300"
      style={{
        padding: '14px 16px',
        background: value
          ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)'
          : colors.cardBackgroundTransparent,
        border: `1px solid ${value ? 'rgba(99,102,241,0.35)' : colors.cardBorderTransparent}`,
        opacity: disabled ? 0.5 : 1,
        boxShadow: value ? '0 0 20px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
        backdropFilter: 'blur(10px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex-1 text-left pr-3">
        <div
          className="text-sm font-semibold leading-tight mb-0.5"
          style={{ color: value ? '#e0e7ff' : colors.textPrimary }}
        >
          {label}
        </div>
        {description && (
          <div
            className="text-xs leading-tight"
            style={{ color: value ? 'rgba(165,180,252,0.65)' : colors.textSecondary, opacity: value ? 1 : 0.7 }}
          >
            {description}
          </div>
        )}
      </div>

      {/* Track */}
      <div
        className="relative flex-shrink-0 w-12 h-6 rounded-full"
        style={{
          background: value
            ? 'linear-gradient(135deg, #6366f1, #a855f7)'
            : 'rgba(255,255,255,0.1)',
          boxShadow: value ? '0 0 14px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          border: value ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Thumb */}
        <motion.div
          animate={{ x: value ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          style={{
            position: 'absolute',
            top: 2,
            left: 0,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: value
              ? 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)'
              : 'rgba(255,255,255,0.9)',
            boxShadow: value
              ? '0 2px 8px rgba(99,102,241,0.5), 0 1px 3px rgba(0,0,0,0.2)'
              : '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </motion.button>
  );
};
