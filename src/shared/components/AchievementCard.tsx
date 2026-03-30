import React from 'react';
import { AchievementCardProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  status,
  progress = 0,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const { title, description, icon, hidden, currentValue, targetValue } = achievement;
  
  // Determine if this is a hidden locked achievement
  const isHiddenLocked = status === 'locked' && hidden;
  
  return (
    <div
      className="rounded-xl p-4 relative"
      style={{
        background: status === 'unlocked' 
          ? 'rgba(251,191,36,0.1)' 
          : status === 'in-progress'
          ? 'rgba(59,130,246,0.05)'
          : colors.cardBackgroundTransparent,
        border: status === 'unlocked' 
          ? '1px solid rgba(251,191,36,0.3)' 
          : status === 'in-progress'
          ? '1px solid rgba(59,130,246,0.2)'
          : `1px solid ${colors.cardBorderTransparent}`,
        opacity: status === 'locked' ? 0.45 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="text-2xl flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{
            background: status === 'unlocked' 
              ? 'rgba(251,191,36,0.2)' 
              : status === 'in-progress'
              ? 'rgba(59,130,246,0.15)'
              : colors.cardBorderTransparent,
            color: status === 'unlocked' 
              ? '#fbbf24' 
              : status === 'in-progress'
              ? '#3b82f6'
              : colors.textTertiary,
          }}
        >
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold mb-1" style={{ color: colors.textPrimary }}>
            {isHiddenLocked ? 'Gizli' : title}
          </h3>
          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
            {isHiddenLocked ? 'Bu başarım gizli' : description}
          </p>
          
          {status === 'unlocked' && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                background: 'rgba(251,191,36,0.2)',
                color: '#fbbf24',
              }}
            >
              ✓ Açık
            </div>
          )}
          
          {status === 'locked' && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                background: colors.cardBorderTransparent,
                color: colors.textTertiary,
              }}
            >
              🔒 Kilitli
            </div>
          )}
          
          {status === 'in-progress' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: colors.textSecondary }}>
                  {currentValue || 0} / {targetValue || 0}
                </span>
                <span style={{ color: '#3b82f6' }}>
                  %{progress}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: colors.cardBorderTransparent }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
