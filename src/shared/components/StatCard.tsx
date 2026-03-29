import { StatCardProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';
import React from 'react';

export const StatCard: React.FC<StatCardProps> = React.memo(({
  icon,
  label,
  value,
  unit,
  subtitle,
  color,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const displayValue = typeof value === 'number' ? value.toLocaleString('tr-TR') : value;
  
  return (
    <div
      role="article"
      aria-label={`${label}: ${displayValue}${unit ? ' ' + unit : ''}`}
      className="rounded-xl p-4 flex flex-col items-center justify-center text-center"
      style={{
        background: colors.cardBackgroundTransparent,
        border: `1px solid ${colors.cardBorderTransparent}`,
      }}
    >
      <div
        className="text-2xl mb-2"
        style={{ color: color }}
      >
        {icon}
      </div>
      
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
        </span>
        {unit && (
          <span className="text-sm" style={{ color: colors.textTertiary }}>{unit}</span>
        )}
      </div>
      
      <p className="text-sm" style={{ color: colors.textSecondary }}>{subtitle || label}</p>
    </div>
  );
});
