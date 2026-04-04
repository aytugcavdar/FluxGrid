import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../features/game/store/gameStore';
import { useSettingsStore } from '../shared/store/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useDailyRewardStore } from '../shared/store/dailyRewardStore';
import { useTutorialStore } from '../shared/store/tutorialStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { ModeCard } from '../shared/components/ModeCard';
import { SectionHeader } from '../shared/components/SectionHeader';
import { DailyRewardModal } from './components/DailyRewardModal';

// Streak Indicator Component
const StreakIndicator: React.FC = () => {
  const { currentStreak } = useDailyRewardStore();
  
  if (currentStreak === 0) return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500">
      <span className="text-xl">🔥</span>
      <span className="text-sm font-bold text-orange-400">{currentStreak} Gün Serisi</span>
    </div>
  );
};

// Reward Badge Component
interface RewardBadgeProps {
  onClick: () => void;
}

const RewardBadge: React.FC<RewardBadgeProps> = ({ onClick }) => {
  const { canClaimToday } = useDailyRewardStore();
  
  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  if (!canClaimToday) return null;
  
  return (
    <motion.button
      onClick={onClick}
      animate={prefersReducedMotion ? {} : {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0 rgba(168, 85, 247, 0)',
          '0 0 0 8px rgba(168, 85, 247, 0.3)',
          '0 0 0 0 rgba(168, 85, 247, 0)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500"
    >
      <span className="text-xl">🎁</span>
      <span className="text-sm font-bold text-purple-400">Ödül Hazır!</span>
    </motion.button>
  );
};

export const HomeScreen: React.FC = () => {
  const { initGame, highScores, stats } = useGameStore();
  const { soundEnabled } = useSettingsStore();
  const { getThemeColors } = useThemeStore();
  const { initializeRewards } = useDailyRewardStore();
  const colors = getThemeColors();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  
  // Mobile detection for responsive layout
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 390;

  // Initialize rewards on mount
  useEffect(() => {
    initializeRewards();
  }, [initializeRewards]);
  
  // Check if tutorial should be shown on mount (only once)
  useEffect(() => {
    const { shouldShow, start } = useTutorialStore.getState();
    if (shouldShow()) {
      initGame(GameMode.ENDLESS); // Önce oyunu başlat
      setTimeout(() => start(), 500); // Sonra tutorial'ı başlat (canvas yüklensin)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Get best scores - handle undefined highScores
  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores?.[GameMode.TIMED] || 0;

  // Daily streak from localStorage
  const dailyStreak = parseInt(localStorage.getItem('flux_daily_streak') || '0');
  
  // Handle undefined stats
  const gamesPlayed = stats?.gamesPlayed || 0;
  const linesCleared = stats?.linesCleared || 0;

  const handleSoundToggle = () => {
    useSettingsStore.getState().setSoundEnabled(!soundEnabled);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ 
        background: colors.background,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Fixed Content - No Scroll */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'px-3 pt-2 pb-16' : 'px-4 pt-3 pb-20'}`}>
        <div className="w-full max-w-[448px] mx-auto flex flex-col h-full">
          {/* Header - Compact */}
          <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-4'}`}>
            <StreakIndicator />
            
            <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold tracking-wider`}>
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
          
          {/* Reward Badge */}
          <div className="flex justify-center mb-3">
            <RewardBadge onClick={() => setShowRewardModal(true)} />
          </div>

          {/* Game Mode Cards - Compact */}
          <div className="flex-1 flex flex-col justify-center">
            <SectionHeader title="OYUN MODU SEÇ" />
            
            {/* Endless Mode Card */}
            <div className={isMobile ? 'mb-2' : 'mb-3'}>
              <ModeCard
                mode={GameMode.ENDLESS}
                bestScore={sonsuzBestScore}
                icon="∞"
                accentColor={{
                  border: 'rgba(168,85,247,0.3)',
                  background: 'rgba(168,85,247,0.07)',
                  gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                }}
                tags={['Limit yok', 'Yarışmalı', 'Yetenekler']}
                onPlay={() => {
                  if (soundEnabled) playClick();
                  initGame(GameMode.ENDLESS);
                }}
              />
            </div>
            
            {/* Timed Mode Card */}
            <div className={isMobile ? 'mb-2' : 'mb-4'}>
              <ModeCard
                mode={GameMode.TIMED}
                bestScore={timedBestScore}
                icon="⏱"
                accentColor={{
                  border: 'rgba(245,158,11,0.3)',
                  background: 'rgba(245,158,11,0.07)',
                  gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }}
                tags={['60 saniye', 'Sprint', 'Combo rush']}
                onPlay={() => {
                  if (soundEnabled) playClick();
                  initGame(GameMode.TIMED);
                }}
              />
            </div>

            {/* HIZLI BAKIŞ - Compact */}
            <div className={`grid grid-cols-3 ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div
                className="rounded-xl p-3"
                style={{
                  background: colors.cardBackgroundTransparent,
                  border: `1px solid ${colors.cardBorderTransparent}`,
                }}
              >
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-0.5`} style={{ color: colors.textPrimary }}>
                  {gamesPlayed}
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
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-0.5`} style={{ color: colors.textPrimary }}>
                  {linesCleared}
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
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-0.5`} style={{ color: colors.textPrimary }}>
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
      
      {/* Daily Reward Modal */}
      <DailyRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
      />
    </div>
  );
};
