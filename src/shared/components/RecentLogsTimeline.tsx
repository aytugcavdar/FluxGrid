import React from 'react';
import { GameMode } from '../types';
import { useThemeStore } from '../store/themeStore';
import { formatRelativeTime } from '../utils/trendDataAggregation';

interface GameLog {
  id: string;
  mode: GameMode;
  score: number;
  timestamp: number;
  duration?: number;
  linesCleared?: number;
  maxCombo?: number;
  badge?: 'new-record' | 'perfect' | 'comeback' | 'speedrun';
  metadata?: {
    statsVersion?: number;
  };
}

export interface RecentLogsTimelineProps {
  logs: GameLog[];
  maxItems?: number;
}

const formatLogDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes > 0 ? `${minutes}:${remainder.toString().padStart(2, '0')}` : `${remainder} sn`;
};

export const RecentLogsTimeline: React.FC<RecentLogsTimelineProps> = ({
  logs,
  maxItems = 5,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  // Get mode-specific colors and icons
  const getModeConfig = (mode: GameMode) => {
    switch (mode) {
      case GameMode.ENDLESS:
        return { color: '#a855f7', icon: '∞', label: 'Sonsuz' };
      case GameMode.TIMED:
        return { color: '#f59e0b', icon: '⏱', label: 'Zamanlı' };
      case GameMode.DAILY_CHALLENGE:
        return { color: '#10b981', icon: '📅', label: 'Günlük' };
      default:
        return { color: '#3b82f6', icon: '🎮', label: 'Oyun' };
    }
  };
  
  // Get badge config
  const getBadgeConfig = (badge?: string) => {
    switch (badge) {
      case 'new-record':
        return { emoji: '🏆', label: 'YENİ REKOR', color: '#fbbf24' };
      case 'perfect':
        return { emoji: '✨', label: 'MÜKEMMEL', color: '#a855f7' };
      case 'comeback':
        return { emoji: '🔥', label: 'DÖNÜŞ', color: '#ef4444' };
      case 'speedrun':
        return { emoji: '⚡', label: 'HIZLI', color: '#06b6d4' };
      default:
        return null;
    }
  };
  
  // Limit logs
  const displayLogs = logs.slice(0, maxItems);
  
  // Empty state
  if (displayLogs.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: colors.cardBackgroundTransparent,
          border: `1px solid ${colors.cardBorderTransparent}`,
        }}
      >
        <p className="text-4xl mb-2">🎮</p>
        <p
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
        >
          Henüz oyun oynamadın
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: colors.textSecondary }}
        >
          İlk oyununu oyna ve burada gör!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {displayLogs.map((log, index) => {
        const modeConfig = getModeConfig(log.mode);
        const badgeConfig = getBadgeConfig(log.badge);
        
        return (
          <div
            key={log.id}
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: colors.cardBackgroundTransparent,
              border: `1px solid ${colors.cardBorderTransparent}`,
            }}
          >
            {/* Timeline connector (except last item) */}
            {index < displayLogs.length - 1 && (
              <div
                className="absolute left-8 bottom-0 w-0.5 h-3 -mb-3"
                style={{
                  background: colors.cardBorderTransparent,
                }}
              />
            )}
            
            <div className="flex items-start gap-3">
              {/* Mode icon */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{
                  background: `${modeConfig.color}20`,
                  color: modeConfig.color,
                  border: `1px solid ${modeConfig.color}40`,
                }}
              >
                {modeConfig.icon}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header: Mode + Time */}
                <div className="flex items-center justify-between mb-1">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: modeConfig.color }}
                  >
                    {modeConfig.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {formatRelativeTime(log.timestamp)}
                  </p>
                </div>
                
                {/* Score */}
                <p
                  className="text-lg font-bold mb-1"
                  style={{ color: colors.textPrimary }}
                >
                  {log.score.toLocaleString('tr-TR')}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-3 text-xs" style={{ color: colors.textSecondary }}>
                  {log.maxCombo !== undefined && log.maxCombo > 0 && (
                    <span>⚡ {log.maxCombo}x kombo</span>
                  )}
                  {log.metadata?.statsVersion === 2 && log.linesCleared !== undefined && log.linesCleared > 0 && (
                    <span>📊 {log.linesCleared} satır</span>
                  )}
                  {log.duration !== undefined && log.duration > 0 && (
                    <span>⏱ {formatLogDuration(log.duration)}</span>
                  )}
                </div>
                
                {/* Badge */}
                {badgeConfig && (
                  <div
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold mt-2"
                    style={{
                      background: `${badgeConfig.color}20`,
                      color: badgeConfig.color,
                      border: `1px solid ${badgeConfig.color}40`,
                    }}
                  >
                    <span>{badgeConfig.emoji}</span>
                    <span>{badgeConfig.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
