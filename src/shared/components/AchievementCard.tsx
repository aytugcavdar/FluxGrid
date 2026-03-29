import React from 'react';
import { AchievementCardProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';
import { ProgressBar } from './ProgressBar';

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  status,
  progress = 0,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const { title, description, icon } = achievement;
  
  return (
    <div
      className="rounded-xl p-4 relative"
      style={{
        background: status === 'unlocked' ? 'rgba(251,191,36,0.1)' : colors.cardBackgroundTransparent,
        border: status === 'unlocked' ? '1px solid rgba(251,191,36,0.3)' : `1px solid ${colors.cardBorderTransparent}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="text-2xl flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
          style={{
            background: status === 'unlocked' ? 'rgba(251,191,36,0.2)' : colors.cardBorderTransparent,
            color: status === 'unlocked' ? '#fbbf24' : colors.textTertiary,
          }}
        >
          {status === 'locked' ? '🔒' : icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold mb-1" style={{ color: colors.textPrimary }}>{title}</h4>
          <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>{description}</p>
          
          {status === 'unlocked' && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{
                background: 'rgba(251,191,36,0.2)',
                color: '#fbbf24',
              }}
            >
              ✓ Açıldı
            </div>
          )}
          
          {status === 'in-progress' && progress !== undefined && (
            <div className="mt-2">
              <ProgressBar
                label=""
                value={progress}
                maxValue={100}
                color="#3b82f6"
                showPercentage
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
