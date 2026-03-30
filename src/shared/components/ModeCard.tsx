import React from 'react';
import { GameMode } from '../types';
import { useThemeStore } from '../store/themeStore';

export interface ModeCardProps {
  mode: GameMode.ENDLESS | GameMode.TIMED;
  bestScore: number;
  icon: string;
  accentColor: {
    border: string;
    background: string;
    gradient: string;
  };
  tags: string[];
  onPlay: () => void;
}

export const ModeCard: React.FC<ModeCardProps> = React.memo(({
  mode,
  bestScore,
  icon,
  accentColor,
  tags,
  onPlay,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  const modeName = mode === GameMode.ENDLESS ? 'Sonsuz Mod' : 'Timed Mod';
  
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: accentColor.background,
        border: `1.5px solid ${accentColor.border}`,
      }}
    >
      {/* Icon overlay in top-right corner */}
      <div
        className="absolute top-5 right-5 text-6xl pointer-events-none"
        style={{
          opacity: 0.18,
          color: colors.textPrimary,
        }}
      >
        {icon}
      </div>
      
      {/* Top: Mode name */}
      <div className="mb-2 relative z-10">
        <p
          className="text-sm font-semibold"
          style={{ 
            color: mode === GameMode.ENDLESS ? '#a855f7' : '#f59e0b'
          }}
        >
          {modeName}
        </p>
      </div>
      
      {/* Middle: Best score */}
      <div className="mb-6 relative z-10">
        <p
          className="text-3xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          {bestScore.toLocaleString('tr-TR')}
        </p>
      </div>
      
      {/* Bottom: Tags (left) + OYNA button (right) */}
      <div className="flex items-end justify-between relative z-10">
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2.5 py-1 rounded"
              style={{
                background: colors.cardBorderTransparent,
                color: colors.textSecondary,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        
        <button
          onClick={onPlay}
          className="px-6 py-2 rounded-lg font-bold text-white transition-transform active:scale-95"
          style={{
            background: accentColor.gradient,
          }}
          aria-label={`${modeName} modunda oyna`}
        >
          OYNA
        </button>
      </div>
    </div>
  );
});
