import React from 'react';
import { PerformanceCardProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';
import { GameMode } from '../types';

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  mode,
  bestScore,
  maxCombo,
  maxTier,
  maxDuration: _maxDuration,
  chronoBonus,
  color,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const isEndless = mode === GameMode.ENDLESS;
  const modeLabel = isEndless ? 'Sonsuz Mod' : 'Timed Mod';
  const modeIcon = isEndless ? '∞' : '⏱';
  
  return (
    <div
      className="rounded-xl"
      style={{
        background: colors.cardBackgroundTransparent,
        border: `1px solid ${color}30`,
        borderRadius: '12px',
        padding: '10px 12px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="text-xl flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: `${color}20`,
            color: color,
          }}
        >
          {modeIcon}
        </div>
        <h3
          className="text-sm font-bold"
          style={{ color: color }}
        >
          {modeLabel}
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>En İyi Skor</p>
          <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {bestScore.toLocaleString('tr-TR')}
          </p>
        </div>
        
        <div>
          <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Max Kombo</p>
          <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            x{maxCombo}
          </p>
        </div>
        
        <div>
          {isEndless ? (
            <>
              <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Max Tier</p>
              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                T{maxTier || 0}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Chrono Bonus</p>
              <p className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                +{chronoBonus || 0}s
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
