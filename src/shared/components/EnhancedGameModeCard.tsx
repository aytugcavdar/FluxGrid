import React from 'react';
import { GameMode } from '../types';
import { useThemeStore } from '../store/themeStore';
import { GradientCardBase } from './GradientCardBase';

export interface EnhancedGameModeCardProps {
  mode: GameMode.ENDLESS | GameMode.TIMED;
  bestScore: number;
  icon: string;
  gradient: string;
  borderColor: string;
  tags: string[];
  stats?: {
    gamesPlayed: number;
    avgScore: number;
    lastPlayed?: number;
  };
  onPlay: () => void;
}

export const EnhancedGameModeCard: React.FC<EnhancedGameModeCardProps> = ({
  mode,
  bestScore,
  icon,
  gradient,
  borderColor,
  tags,
  stats,
  onPlay,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  const modeName = mode === GameMode.ENDLESS ? 'Sonsuz Mod' : 'Zamanlı Mod';
  const accentColor = mode === GameMode.ENDLESS ? '#a855f7' : '#f59e0b';
  
  return (
    <GradientCardBase
      gradient={gradient}
      borderColor={borderColor}
      glowColor={borderColor}
      className="p-5 cursor-pointer"
      hoverScale={1.02}
      animateOnMount={false}
    >
      {/* Icon overlay in top-right corner */}
      <div
        className="absolute top-5 right-5 text-6xl pointer-events-none"
        style={{
          opacity: 0.2,
          color: colors.textPrimary,
        }}
      >
        {icon}
      </div>
      
      {/* Top: Mode name */}
      <div className="mb-2 relative z-10">
        <p
          className="text-sm font-semibold tracking-wide"
          style={{ color: accentColor }}
        >
          {modeName.toUpperCase()}
        </p>
      </div>
      
      {/* Middle: Best score */}
      <div className="mb-4 relative z-10">
        <p
          className="text-3xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          {bestScore.toLocaleString('tr-TR')}
        </p>
        {stats && stats.avgScore > 0 && (
          <p
            className="text-xs mt-1"
            style={{ color: colors.textSecondary }}
          >
            Ortalama: {Math.round(stats.avgScore).toLocaleString('tr-TR')}
          </p>
        )}
      </div>
      
      {/* Bottom: Tags (left) + OYNA button (right) */}
      <div className="flex items-end justify-between relative z-10 gap-3">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2.5 py-1 rounded-md font-medium"
              style={{
                background: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="px-6 py-2.5 rounded-xl font-bold text-white transition-all active:scale-95 hover:shadow-lg whitespace-nowrap"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
            boxShadow: `0 4px 12px ${accentColor}40`,
          }}
          aria-label={`${modeName} modunda oyna`}
        >
          OYNA
        </button>
      </div>
      
      {/* Optional: Additional stats on hover */}
      {stats && stats.gamesPlayed > 0 && (
        <div className="mt-3 pt-3 border-t relative z-10" style={{ borderColor: `${accentColor}20` }}>
          <div className="flex justify-between text-xs" style={{ color: colors.textSecondary }}>
            <span>{stats.gamesPlayed} oyun</span>
            {stats.lastPlayed && (
              <span>
                Son: {new Date(stats.lastPlayed).toLocaleDateString('tr-TR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </GradientCardBase>
  );
};
