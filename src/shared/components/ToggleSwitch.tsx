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
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98]"
      style={{
        background: colors.cardBackgroundTransparent,
        border: `1px solid ${colors.cardBorderTransparent}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex-1 text-left pr-3">
        <div className="text-sm font-medium leading-tight mb-1" style={{ color: colors.textPrimary }}>
          {label}
        </div>
        {description && (
          <div className="text-xs leading-tight opacity-70" style={{ color: colors.textSecondary }}>
            {description}
          </div>
        )}
      </div>
      
      <div
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300"
        style={{
          backgroundColor: value ? '#3b82f6' : 'rgba(156, 163, 175, 0.3)',
        }}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{
            x: value ? 20 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </div>
    </button>
  );
};
