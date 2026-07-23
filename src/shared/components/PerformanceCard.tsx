import React from 'react';
import { PerformanceCardProps } from '../types/ui';
import { useThemeStore } from '../store/themeStore';
import { GameMode } from '../types';
import { useTranslation } from 'react-i18next';

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  mode,
  bestScore,
  maxCombo,
  maxTier,
  totalLines,
  color,
}) => {
  const { t, i18n } = useTranslation();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const isEndless = mode === GameMode.ENDLESS;
  const modeLabel = isEndless ? t('stats.endlessMode') : t('stats.timedMode');
  const modeIcon = isEndless ? '∞' : '⏱';
  const numberLocale = i18n.resolvedLanguage === 'tr' ? 'tr-TR' : 'en-US';
  
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${color}20`,
        padding: '14px 16px',
        boxShadow: `0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Subtle color orb */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: color, opacity: 0.06, filter: 'blur(20px)' }}
      />
      
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="text-lg flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            color: color,
            border: `1px solid ${color}25`,
            fontWeight: 700,
          }}
        >
          {modeIcon}
        </div>
        <div>
          <h3
            className="text-xs font-black tracking-wide"
            style={{ color: color }}
          >
            {modeLabel}
          </h3>
          {bestScore > 0 && (
            <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {t('stats.recordWithScore', { score: bestScore.toLocaleString(numberLocale) })}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('stats.bestScore')}</p>
          <p className="text-base font-black tabular-nums" style={{
            background: `linear-gradient(135deg, ${color}, white)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {bestScore.toLocaleString(numberLocale)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('stats.maxCombo')}</p>
          <p className="text-base font-black tabular-nums" style={{ color: colors.textPrimary }}>
            x{maxCombo}
          </p>
        </div>
        
        <div className="text-center">
          {isEndless ? (
            <>
              <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('stats.maxTier')}</p>
              <p className="text-base font-black tabular-nums" style={{ color: colors.textPrimary }}>
                T{maxTier || 0}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] mb-1 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('stats.totalClears')}</p>
              <p className="text-base font-black tabular-nums" style={{ color: colors.textPrimary }}>
                {totalLines || 0}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
