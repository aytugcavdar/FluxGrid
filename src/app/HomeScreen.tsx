import React, { useState, useEffect, useMemo } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../features/game/store/gameStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useDailyRewardStore } from '../shared/store/dailyRewardStore';
import { useStreakStore } from '../shared/store/streakStore';
import { useTutorialStore } from '../features/tutorial/store/tutorialStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { DailyRewardModal } from './components/DailyRewardModal';
import { Gift } from 'lucide-react';
import { detectDeviceCapabilities } from '../utils/platform/deviceCapability';

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { initGame, highScores, hasSavedGame, loadSavedGame } = useGameStore();
  const { soundEnabled } = useSettingsStore();
  const { initializeRewards, canClaimToday } = useDailyRewardStore();
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const hasReward = canClaimToday;
  
  // Detect device tier for performance optimization
  const deviceCapabilities = useMemo(() => detectDeviceCapabilities(), []);
  const isLowEndDevice = deviceCapabilities.tier === 'low';
  
  console.log('[HomeScreen] Device tier:', deviceCapabilities.tier, 'Animations:', !isLowEndDevice);

  // Initialize rewards on mount
  useEffect(() => {
    initializeRewards();
  }, [initializeRewards]);
  
  // Check for saved game
  useEffect(() => {
    setHasSave(hasSavedGame());
  }, [hasSavedGame]);
  
  // Auto-start tutorial for first-time users
  useEffect(() => {
    const tutorialData = localStorage.getItem('flux_tutorial_v2');
    
    // If no tutorial data exists, this is a first-time user
    if (!tutorialData) {
      console.log('[HomeScreen] First-time user detected - starting tutorial immediately');
      
      // Start game immediately (no delay)
      initGame(GameMode.ENDLESS);
    } else {
      console.log('[HomeScreen] Returning user - staying on home screen');
    }
  }, []); // Only run once on mount

  // Get best scores - handle undefined highScores
  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore = highScores?.[GameMode.TIMED] || 0;
  
  // Memoize expensive best score calculation (Requirement 1.5)
  const overallBestScore = useMemo(() => Math.max(sonsuzBestScore, timedBestScore), [sonsuzBestScore, timedBestScore]);

  // Daily streak from streakStore (not localStorage directly)
  const { currentStreak: dailyStreak } = useStreakStore();

  return (
    <MotionConfig reducedMotion={isLowEndDevice ? "always" : "never"}>
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: colors.screenBackground,
        paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Animated Background Orbs - Skip on LOW devices */}
      {!isLowEndDevice && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{
            background: `radial-gradient(circle, ${colors.accentSonsuz} 0%, transparent 70%)`,
          }}
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{
            background: `radial-gradient(circle, ${colors.accentTimed} 0%, transparent 70%)`,
          }}
        />
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{
            background: `radial-gradient(circle, ${colors.accentPrimary} 0%, transparent 70%)`,
          }}
        />
      </div>
      )}

      {/* Floating Particles - Skip on LOW devices */}
      {!isLowEndDevice && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <div className="relative flex-1 flex flex-col px-4 pt-2 pb-4">
        <div className="w-full max-w-[400px] mx-auto flex flex-col" style={{ 
          height: '100%',
          paddingBottom: '76px'
        }}>
          {/* Premium Header with Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-6"
          >
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.accentSonsuz} 0%, ${colors.accentPrimary} 100%)`,
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '2px', 
                  padding: '4px',
                  boxShadow: `0 8px 32px ${colors.accentSonsuz}50`,
                }}
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white/90 rounded-sm"></div>
                <div className="bg-white/90 rounded-sm"></div>
                <div className="bg-white/90 rounded-sm"></div>
                <div className="bg-white/90 rounded-sm"></div>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span style={{ 
                    background: `linear-gradient(to right, ${colors.accentSonsuz}, ${colors.accentPrimary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    FLUX
                  </span>
                  <span style={{ 
                    background: `linear-gradient(to right, ${colors.accentTimed}, ${colors.accentSonsuz})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    GRID
                  </span>
                </h1>
              </div>
            </motion.div>

            {/* Daily Reward Badge */}
            {hasReward && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRewardModal(true)}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
                  }}
                >
                  <Gift className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                />
              </motion.button>
            )}
          </motion.div>

          {/* Glassmorphism Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl p-5 backdrop-blur-xl"
              style={{
                background: colors.cardBackgroundTransparent,
                border: `1px solid ${colors.cardBorderTransparent}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
                {t('home.dailyStreak')}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ 
                  background: `linear-gradient(to bottom right, ${colors.accentSonsuz}, ${colors.accentPrimary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {dailyStreak}
                </span>
                <span className="text-sm" style={{ color: colors.textSecondary }}>{t('home.days')}</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl p-5 backdrop-blur-xl"
              style={{
                background: colors.cardBackgroundTransparent,
                border: `1px solid ${colors.cardBorderTransparent}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
                {t('home.highScore')}
              </div>
              <div className="text-3xl font-bold" style={{ 
                background: `linear-gradient(to bottom right, ${colors.accentTimed}, ${colors.accentSonsuz})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {overallBestScore.toLocaleString('en-US')}
              </div>
            </motion.div>
          </motion.div>

          {/* Continue Button (if saved game exists) */}
          {hasSave && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={() => {
                if (soundEnabled) playClick();
                loadSavedGame();
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-2xl p-4 overflow-hidden group mb-4"
              style={{
                background: `linear-gradient(135deg, ${colors.accentPrimary}dd 0%, ${colors.accentSonsuz} 100%)`,
                boxShadow: `0 10px 30px ${colors.accentPrimary}40, 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
              }}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${colors.accentPrimary} 0%, ${colors.accentSonsuz} 100%)`,
                }}
              />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="text-2xl">▶️</span>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-lg">
                      {t('home.continue', 'Devam Et')}
                    </div>
                    <div className="text-white/70 text-xs">
                      {t('home.continueDesc', 'Kaldığın yerden devam et')}
                    </div>
                  </div>
                </div>
                <div className="text-white/50 text-2xl group-hover:translate-x-1 transition-transform">
                  →
                </div>
              </div>
            </motion.button>
          )}

          {/* Choose Your Mode Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 text-center"
          >
            {t('home.chooseYourMode')}
          </motion.h2>

          {/* Premium Mode Cards */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Infinite Mode */}
            <motion.button
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onClick={() => {
                if (soundEnabled) playClick();
                initGame(GameMode.ENDLESS);
              }}
              whileHover={{ scale: 1.03, y: -8 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl p-5 overflow-hidden group flex-1"
              style={{
                background: `linear-gradient(135deg, ${colors.accentSonsuz}dd 0%, ${colors.accentSonsuz} 50%, ${colors.accentPrimary} 100%)`,
                boxShadow: `0 20px 60px ${colors.accentSonsuz}60, 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
                minHeight: '120px',
                maxHeight: '120px',
              }}
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              
              {/* Noise Texture */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              }} />
              
              <div className="relative flex items-center justify-between h-full">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1.5 tracking-tight">{t('home.infinite')}</h3>
                  <p className="text-xs text-white/75 leading-relaxed max-w-[180px]">
                    {t('home.infiniteDesc')}
                  </p>
                </div>
                
                <motion.div 
                  className="w-14 h-14 rounded-full flex items-center justify-center ml-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-2xl text-white font-bold">∞</span>
                </motion.div>
              </div>
            </motion.button>

            {/* Timed Mode */}
            <motion.button
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => {
                if (soundEnabled) playClick();
                initGame(GameMode.TIMED);
              }}
              whileHover={{ scale: 1.03, y: -8 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl p-5 overflow-hidden group flex-1"
              style={{
                background: `linear-gradient(135deg, ${colors.accentTimed}dd 0%, ${colors.accentTimed} 50%, ${colors.accentSonsuz} 100%)`,
                boxShadow: `0 20px 60px ${colors.accentTimed}60, 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
                minHeight: '120px',
                maxHeight: '120px',
              }}
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                style={{
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              
              {/* Noise Texture */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              }} />
              
              <div className="relative flex items-center justify-between h-full">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1.5 tracking-tight">{t('home.timed')}</h3>
                  <p className="text-xs text-white/75 leading-relaxed max-w-[180px]">
                    {t('home.timedDesc')}
                  </p>
                </div>
                
                <motion.div 
                  className="w-14 h-14 rounded-full flex items-center justify-center ml-3"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-2xl text-white">⏱</span>
                </motion.div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
      
      <DailyRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
      />
    </div>
    </MotionConfig>
  );
};
