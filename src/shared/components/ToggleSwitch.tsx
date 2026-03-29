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
    <div
      className="flex items-center justify-between p-5 rounded-2xl"
      style={{
        background: colors.cardBackgroundTransparent,
        border: `1px solid ${colors.cardBorderTransparent}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>{label}</h4>
        {description && (
          <p className="text-xs" style={{ color: colors.textSecondary }}>{description}</p>
        )}
      </div>
      
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className="relative flex-shrink-0 w-14 h-8 rounded-full transition-all cursor-pointer"
        style={{
          background: value 
            ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
            : 'rgba(255,255,255,0.15)',
          boxShadow: value ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
        }}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 rounded-full shadow-lg"
          style={{
            background: 'white',
          }}
          animate={{
            left: value ? '30px' : '4px',
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>
    </div>
  );
};
