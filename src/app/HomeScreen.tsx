import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../features/game/store/gameStore';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';

export const HomeScreen: React.FC = () => {
  const { initGame, highScores, stats } = useGameStore();
  const { soundEnabled } = useSettingsStore();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

  // Get best scores
  const sonsuzBestScore = highScores[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores[GameMode.TIMED] || 0;

  // Daily streak from localStorage
  const dailyStreak = parseInt(localStorage.getItem('flux_daily_streak') || '0');

  const handleSoundToggle = () => {
    useSettingsStore.getState().setSoundEnabled(!soundEnabled);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: colors.background }}
    >
      {/* Fixed Content - No Scroll */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-20">
        <div className="w-full max-w-[448px] mx-auto flex flex-col h-full">
          {/* Header - Compact */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8" /> {/* Spacer */}
            
            <h1 className="text-lg font-bold tracking-wider">
              <span style={{ color: colors.textPrimary }}>FLUX</span>
              <span style={{ color: colors.accentPrimary }}>GRID</span>
            </h1>
            
            <button
              onClick={handleSoundToggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: colors.cardBackgroundTransparent,
                border: `1px solid ${colors.cardBorderTransparent}`,
              }}
              aria-label="Ses ayarları"
            >
              <span className="text-base">{soundEnabled ? '🔊' : '🔇'}</span>
            </button>
          </div>

          {/* Game Mode Cards - Compact */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
              OYUN MODU SEÇ
            </h2>
            
            {/* Sonsuz Mod Card - Compact */}
            <div
              className="rounded-2xl p-4 relative mb-3"
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '2px solid rgba(168,85,247,0.3)',
                boxShadow: '0 0 20px rgba(168,85,247,0.15)',
              }}
            >
              {/* Infinity icon */}
              <div className="absolute top-3 right-3 text-2xl opacity-20">
                ∞
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Sonsuz Mod</p>
                  <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                    {sonsuzBestScore.toLocaleString('tr-TR')}
                  </p>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (soundEnabled) playClick();
                    initGame(GameMode.ENDLESS);
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm tracking-wider uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                  }}
                >
                  OYNA
                </motion.button>
              </div>
              
              {/* Compact tags */}
              <div className="flex gap-1.5 flex-wrap">
                {['Limit yok', 'Yarışçılı', 'Yetenekler'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px]"
                    style={{
                      background: colors.cardBackgroundTransparent,
                      color: colors.textTertiary,
                      border: `1px solid ${colors.cardBorderTransparent}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Timed Mod Card - Compact */}
            <div
              className="rounded-2xl p-4 relative mb-4"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '2px solid rgba(245,158,11,0.3)',
                boxShadow: '0 0 20px rgba(245,158,11,0.15)',
              }}
            >
              {/* Timer icon */}
              <div className="absolute top-3 right-3 text-2xl opacity-20">
                ⏱
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>Timed Mod</p>
                  <p className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
                    {timedBestScore.toLocaleString('tr-TR')}
                  </p>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (soundEnabled) playClick();
                    initGame(GameMode.TIMED);
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white text-sm tracking-wider uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
                  }}
                >
                  OYNA
                </motion.button>
              </div>
              
              {/* Compact tags */}
              <div className="flex gap-1.5 flex-wrap">
                {['60 saniye', 'Sprint', 'Combo rush'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px]"
                    style={{
                      background: colors.cardBackgroundTransparent,
                      color: colors.textTertiary,
                      border: `1px solid ${colors.cardBorderTransparent}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* HIZLI BAKIŞ - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <div
                className="rounded-xl p-3"
                style={{
                  background: colors.cardBackgroundTransparent,
                  border: `1px solid ${colors.cardBorderTransparent}`,
                }}
              >
                <div className="text-2xl font-bold mb-0.5" style={{ color: colors.textPrimary }}>
                  {stats.gamesPlayed || 0}
                </div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: colors.textSecondary }}>
                  <span>🎮</span>
                  <span>OYUN</span>
                </div>
              </div>
              
              <div
                className="rounded-xl p-3"
                style={{
                  background: colors.cardBackgroundTransparent,
                  border: `1px solid ${colors.cardBorderTransparent}`,
                }}
              >
                <div className="text-2xl font-bold mb-0.5" style={{ color: colors.textPrimary }}>
                  {stats.linesCleared || 0}
                </div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: colors.textSecondary }}>
                  <span>⚡</span>
                  <span>SATIR</span>
                </div>
              </div>
              
              <div
                className="rounded-xl p-3"
                style={{
                  background: colors.cardBackgroundTransparent,
                  border: `1px solid ${colors.cardBorderTransparent}`,
                }}
              >
                <div className="text-2xl font-bold mb-0.5" style={{ color: colors.textPrimary }}>
                  {dailyStreak}
                </div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: colors.textSecondary }}>
                  <span>🔥</span>
                  <span>SERİ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
