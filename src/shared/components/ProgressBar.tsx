import { ProgressBarProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';
import React from 'react';

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  label,
  value,
  maxValue,
  color,
  showPercentage = false,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  return (
    <div 
      className="w-full"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={maxValue}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: colors.textSecondary }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
          {value.toLocaleString('tr-TR')}
          {showPercentage && ` (${percentage.toFixed(0)}%)`}
        </span>
      </div>
      
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{
          background: colors.cardBorderTransparent,
        }}
      >
        <div
          data-testid="progress-fill"
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
});
