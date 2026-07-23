import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../features/game/store/gameStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import {
  detectDeviceCapabilities,
  meetsMinimumDeviceRequirements,
} from '../utils/platform/deviceCapability';
import { Clock3, Infinity as InfinityIcon, Timer } from 'lucide-react';
import type { TFunction } from 'i18next';



/* ─────────────────────────────────────────────── */
/* Mini grid logo animation                        */
/* ─────────────────────────────────────────────── */
const GRID_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981'];
const GridLogo: React.FC<{ isStatic: boolean }> = ({ isStatic }) => {
  const [lit, setLit] = useState([true, false, false, true]);
  useEffect(() => {
    // Keep the menu logo static unless the device is explicitly cleared for decorative motion.
    if (isStatic) return;
    
    const t = setInterval(() => {
      setLit([
        Math.random() > 0.3,
        Math.random() > 0.3,
        Math.random() > 0.3,
        Math.random() > 0.3,
      ]);
    }, 1500); // Slower interval: 900ms → 1500ms
    return () => clearInterval(t);
  }, [isStatic]);
  
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 12,
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 3, padding: 7,
      boxShadow: '0 0 20px rgba(139,92,246,0.46), 0 4px 12px rgba(0,0,0,0.26)',
    }}>
      {[0,1,2,3].map(i => (
        <motion.div
          key={i}
          animate={isStatic ? {} : { opacity: lit[i] ? 1 : 0.25, scale: lit[i] ? 1 : 0.8 }}
          transition={{ duration: 0.45 }}
          style={{ 
            borderRadius: 3, 
            background: GRID_COLORS[i],
            opacity: isStatic ? 1 : undefined
          }}
        />
      ))}
    </div>
  );
};


/* ─────────────────────────────────────────────── */
function getSavedGameAgeLabel(savedAt: number | undefined, t: TFunction): string {
  const safeSavedAt = savedAt || Date.now();
  const diffMs = Math.max(0, Date.now() - safeSavedAt);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return t('home.savedDaysAgo', { count: diffDays });
  if (diffHours > 0) return t('home.savedHoursAgo', { count: diffHours });
  if (diffMins > 0) return t('home.savedMinutesAgo', { count: diffMins });
  return t('home.savedJustNow');
}

export const HomeScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { initGame, hasSavedGame, loadSavedGame, highScores, stats } = useGameStore();
  const { soundEnabled } = useSettingsStore();

  const [hasSave, setHasSave] = useState(false);
  const [savedGameData, setSavedGameData] = useState<any>(null);

  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const isLowEndDevice = deviceCapabilities?.tier === 'low';
  const isNativeDevice = deviceCapabilities?.isNative === true;
  const shouldUseDecorativeMotion = Boolean(deviceCapabilities) && !isNativeDevice && !isLowEndDevice && deviceCapabilities?.tier !== 'low-mid';
  const homeMotionInitial = shouldUseDecorativeMotion;

  useEffect(() => {
    const loadDeviceCapabilities = async () => {
      const caps = await detectDeviceCapabilities();
      setDeviceCapabilities(caps);
    };
    loadDeviceCapabilities();
  }, []);

  const meetsMinimumRequirements = useMemo(() => {
    if (!deviceCapabilities) return true; // Default to true while loading
    return meetsMinimumDeviceRequirements(deviceCapabilities.memory);
  }, [deviceCapabilities]);

  const refreshSavedGame = useCallback(() => {
    const savedExists = hasSavedGame();
    setHasSave(savedExists);

    if (savedExists) {
      try {
        const saved = localStorage.getItem('flux_game_save');
        if (saved) {
          setSavedGameData(JSON.parse(saved));
        } else {
          setSavedGameData(null);
        }
      } catch (e) {
        console.error('Failed to load saved game data:', e);
        setSavedGameData(null);
      }
    } else {
      setSavedGameData(null);
    }
  }, [hasSavedGame]);

  useEffect(() => {
    refreshSavedGame();

    const handleSaveStateChanged = (event?: StorageEvent) => {
      if (event && event.key !== 'flux_game_save') return;
      refreshSavedGame();
    };

    window.addEventListener('storage', handleSaveStateChanged);
    window.addEventListener('flux-game-save-changed', refreshSavedGame);
    window.addEventListener('focus', refreshSavedGame);
    document.addEventListener('visibilitychange', refreshSavedGame);

    return () => {
      window.removeEventListener('storage', handleSaveStateChanged);
      window.removeEventListener('flux-game-save-changed', refreshSavedGame);
      window.removeEventListener('focus', refreshSavedGame);
      document.removeEventListener('visibilitychange', refreshSavedGame);
    };
  }, [refreshSavedGame]);

  const numberLocale = i18n.resolvedLanguage === 'tr' ? 'tr-TR' : 'en-US';
  const savedModeLabel = savedGameData?.gameMode === GameMode.TIMED ? t('home.timed') : t('home.infinite');
  const savedStatusLabel = savedGameData?.gameMode === GameMode.TIMED
    ? t('home.secondsShort', { count: Math.floor(savedGameData?.timeLeft || 0) })
    : `Tier ${savedGameData?.difficultyTier || 0}`;
  const savedAgeLabel = getSavedGameAgeLabel(savedGameData?.savedAt, t);
  const handleContinueGame = useCallback(() => {
    if (soundEnabled) playClick();

    try {
      const loaded = loadSavedGame();
      setHasSave(false);
      setSavedGameData(null);

      if (!loaded) {
        refreshSavedGame();
      }
    } catch (error) {
      console.error('Failed to continue saved game:', error);
      setHasSave(false);
      setSavedGameData(null);
    }
  }, [loadSavedGame, refreshSavedGame, soundEnabled]);

  const handleStartMode = useCallback((mode: GameMode) => {
    if (soundEnabled) playClick();
    initGame(mode);
  }, [initGame, soundEnabled]);

  const stagger = (i: number) => shouldUseDecorativeMotion
    ? ({ duration: 0.5, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] })
    : ({ duration: 0, delay: 0 });

  return (
    <MotionConfig reducedMotion={shouldUseDecorativeMotion ? 'user' : 'always'}>
      <div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d1117 0%, #110d22 45%, #0c0918 100%)',
          paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* ── Minimum requirements warning ── */}
        {!meetsMinimumRequirements && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="max-w-sm w-full rounded-3xl p-6 text-center"
              style={{ background: 'rgba(30,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
            >
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#f8f8f8' }}>{t('home.minimumRequirementsTitle')}</h2>
              <p className="text-sm mb-4 opacity-70" style={{ color: '#ccc' }}>{t('home.minimumRequirementsDesc')}</p>
              <button onClick={() => window.location.reload()} className="w-full py-3 rounded-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
                {t('home.tryAnyway')}
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Background gradient orbs + falling blocks ── */}
        {shouldUseDecorativeMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div animate={{ x: [0, 80, 0], y: [0, -60, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full blur-[80px] opacity-[0.12]"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
            <motion.div animate={{ x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.10]"
              style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
            {/* Subtle grid lines */}
            <div className="absolute inset-0 opacity-[0.025]" style={{
              backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          </div>
        )}


        {/* ── Main content ── */}
        <div className="relative flex-1 flex flex-col px-5 pb-4 overflow-hidden" style={{ paddingTop: '6px' }}>
          <div className="w-full max-w-[400px] mx-auto flex flex-col" style={{ paddingBottom: '76px' }}>

            {/* ─── HEADER ─── */}
            <motion.div initial={homeMotionInitial ? { opacity: 0, y: -16 } : false} animate={{ opacity: 1, y: 0 }} transition={stagger(0)}
              className="flex items-center justify-center mb-3">

              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <GridLogo isStatic={!shouldUseDecorativeMotion} />
                <div>
                  <h1 className="text-[22px] font-black tracking-tight leading-none">
                    <span style={{
                      background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 60%, #f472b6 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>FLUX</span>
                    <span style={{
                      background: 'linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>GRID</span>
                  </h1>
                  <p className="text-[9px] font-semibold tracking-[0.14em] opacity-40 mt-0.5" style={{ color: '#a0a0c0' }}>
                    QUANTUM PUZZLE
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ─── CONTINUE BUTTON ─── */}
            <AnimatePresence>
              {hasSave && savedGameData && (
                <motion.button
                  initial={homeMotionInitial ? { opacity: 0, scale: 0.94 } : false} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}
                  whileTap={shouldUseDecorativeMotion ? { scale: 0.97 } : undefined}
                  onClick={handleContinueGame}
                  className="relative rounded-[18px] p-3.5 mb-3 overflow-hidden"
                  style={{
                    background: savedGameData.gameMode === GameMode.TIMED
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.24) 0%, rgba(217,119,6,0.12) 100%)'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.24) 0%, rgba(168,85,247,0.13) 100%)',
                    border: savedGameData.gameMode === GameMode.TIMED
                      ? '1px solid rgba(245,158,11,0.46)'
                      : '1px solid rgba(129,140,248,0.46)',
                    boxShadow: savedGameData.gameMode === GameMode.TIMED
                      ? '0 10px 28px rgba(245,158,11,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
                      : '0 10px 28px rgba(99,102,241,0.24), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  {/* Shimmer - Disabled on low/mid devices */}
                  {shouldUseDecorativeMotion && (
                    <motion.div animate={{ x: ['-150%', '250%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
                      className="absolute top-0 left-0 w-1/3 h-full"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', pointerEvents: 'none' }} />
                  )}

                  {/* Top: Title and Time */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <div className="text-[17px] font-black text-left" style={{ color: 'white' }}>
                        {t('home.continue')}
                      </div>
                      <div className="text-xs font-medium text-left" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {t('home.savedGameSummary', { mode: savedModeLabel })}
                      </div>
                    </div>
                    <div 
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{
                        background: savedGameData.gameMode === GameMode.TIMED
                          ? 'rgba(245,158,11,0.16)'
                          : 'rgba(129,140,248,0.16)',
                        color: 'rgba(255,255,255,0.72)',
                      }}
                    >
                      {savedAgeLabel}
                    </div>
                  </div>

                  {/* Bottom: Stats */}
                  <div className="flex items-stretch gap-0">

                    {/* Score */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <span className="text-xs leading-none">🏆</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-[9px] font-semibold uppercase leading-none mb-0.5"
                          style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>
                          {t('home.score')}
                        </div>
                        <div className="text-sm font-black leading-none" style={{ color: 'white' }}>
                          {(savedGameData.score || 0).toLocaleString(numberLocale)}
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px self-stretch my-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

                    {/* Time (Timed mode only) */}
                    {savedGameData.gameMode === GameMode.TIMED && (
                      <>
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                          >
                            <span className="text-xs leading-none">⏱</span>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="text-[9px] font-semibold uppercase leading-none mb-0.5"
                              style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>
                              {t('home.remaining')}
                            </div>
                            <div className="text-sm font-black leading-none" style={{ color: 'white' }}>
                              {savedStatusLabel}
                            </div>
                          </div>
                        </div>
                        <div className="w-px self-stretch my-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                      </>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <span className="text-xs leading-none">
                          {savedGameData.gameMode === GameMode.TIMED ? '⚡' : '◆'}
                        </span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-[9px] font-semibold uppercase leading-none mb-0.5"
                          style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>
                          {t('home.save')}
                        </div>
                        <div className="text-sm font-black leading-none"
                          style={{
                            color: savedGameData.gameMode === GameMode.TIMED ? '#fbbf24' : '#c084fc',
                          }}>
                          {savedGameData.gameMode === GameMode.TIMED
                            ? savedModeLabel
                            : `Tier ${savedGameData.difficultyTier || 0}`}
                        </div>
                      </div>
                    </div>

                  </div>

                </motion.button>
              )}
            </AnimatePresence>

            {/* ─── MODE SECTION LABEL ─── */}
            <motion.p initial={homeMotionInitial ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={stagger(1)}
              className="text-center text-[9px] font-bold uppercase tracking-[0.18em] mb-2"
              style={{ color: 'rgba(160,160,192,0.48)' }}>
              {t('home.chooseYourMode')}
            </motion.p>

            {/* ─── MODE CARDS ─── */}
            <div className="flex flex-col gap-3">

              {/* ── ENDLESS MODE ── */}
              <motion.button
                initial={homeMotionInitial ? { opacity: 0, y: 20 } : false} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={stagger(2)}
                whileHover={shouldUseDecorativeMotion ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
                whileTap={shouldUseDecorativeMotion ? { scale: 0.98 } : undefined}
                onClick={() => handleStartMode(GameMode.ENDLESS)}
                className="relative overflow-hidden w-full rounded-[20px] flex items-center justify-between text-left"
                style={{
                  minHeight: 132,
                  padding: '19px 20px 17px 24px',
                  background: 'linear-gradient(145deg, rgba(22,22,38,0.96) 0%, rgba(16,16,30,0.98) 56%, rgba(25,18,43,0.94) 100%)',
                  border: '1px solid rgba(139,92,246,0.34)',
                  boxShadow: '0 18px 34px rgba(4,3,12,0.34), inset 0 1px 0 rgba(255,255,255,0.055), 0 0 26px rgba(139,92,246,0.1)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 1,
                    borderRadius: 19,
                    background: 'radial-gradient(circle at 92% 52%, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.075) 24%, transparent 56%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 28,
                    bottom: 28,
                    width: 3,
                    borderRadius: '0 6px 6px 0',
                    background: 'linear-gradient(180deg, #818cf8 0%, #a855f7 100%)',
                    boxShadow: '0 0 18px rgba(168,85,247,0.58)',
                  }}
                />

                {/* Left Content */}
                <div className="relative z-10 flex-1">
                  {/* Small Top Label */}
                  <div className="text-[11px] uppercase mb-2.5 font-black tracking-[0.18em] text-purple-300/75 flex items-center gap-1.5 justify-start">
                    <InfinityIcon size={13} strokeWidth={2.5} />
                    {t('home.endlessModeLabel')}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[33px] leading-none font-black uppercase mb-3 text-white text-left"
                    style={{ textShadow: '0 0 16px rgba(168,85,247,0.34)' }}
                  >
                    {t('home.infinite')}
                  </h3>

                  {/* Divider */}
                  <div className="w-7 h-px bg-gradient-to-r from-purple-300/80 to-transparent mb-3" />

                  {/* Description */}
                  <p className="text-[13px] leading-snug mb-3.5 max-w-[240px] text-white/60 text-left">
                    {t('home.infiniteDesc')}
                  </p>

                  {/* Bottom Tags */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.075] text-purple-200/90">
                      <span>∞</span>
                      <span>{t('home.unlimited')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.075] text-purple-200/90">
                      <span>📊</span>
                      <span>{t('home.simple')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 bg-purple-300/[0.08] border border-purple-200/[0.12] text-purple-50/95">
                      <span>⭐</span>
                      <span>{(highScores?.[GameMode.ENDLESS] || 0).toLocaleString(numberLocale)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Icon */}
                <div
                  className="absolute -right-1 top-1/2 z-[1] flex h-[112px] w-[112px] -translate-y-1/2 items-center justify-center"
                  style={{
                    color: 'rgba(139,92,246,0.40)',
                    filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.28))',
                    fontSize: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <InfinityIcon size={104} strokeWidth={1.45} />
                </div>

              </motion.button>

              {/* ── TIMED MODE ── */}
              <motion.button
                initial={homeMotionInitial ? { opacity: 0, y: 20 } : false} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={stagger(3)}
                whileHover={shouldUseDecorativeMotion ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
                whileTap={shouldUseDecorativeMotion ? { scale: 0.98 } : undefined}
                onClick={() => handleStartMode(GameMode.TIMED)}
                className="relative overflow-hidden w-full rounded-[20px] flex items-center justify-between text-left"
                style={{
                  minHeight: 132,
                  padding: '19px 20px 17px 24px',
                  background: 'linear-gradient(145deg, rgba(24,22,33,0.96) 0%, rgba(18,17,27,0.98) 56%, rgba(43,24,13,0.9) 100%)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  boxShadow: '0 18px 34px rgba(4,3,12,0.34), inset 0 1px 0 rgba(255,255,255,0.055), 0 0 26px rgba(245,158,11,0.1)',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 1,
                    borderRadius: 19,
                    background: 'radial-gradient(circle at 92% 52%, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.075) 24%, transparent 56%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 28,
                    bottom: 28,
                    width: 3,
                    borderRadius: '0 6px 6px 0',
                    background: 'linear-gradient(180deg, #fbbf24 0%, #f97316 100%)',
                    boxShadow: '0 0 18px rgba(245,158,11,0.58)',
                  }}
                />

                {/* Left Content */}
                <div className="relative z-10 flex-1">
                  {/* Small Top Label */}
                  <div className="text-[11px] uppercase mb-2.5 font-black tracking-[0.18em] text-amber-300/75 flex items-center gap-1.5 justify-start">
                    <Timer size={13} strokeWidth={2.5} />
                    {t('home.timedModeLabel')}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[33px] leading-none font-black uppercase mb-3 text-white text-left"
                    style={{ textShadow: '0 0 16px rgba(245,158,11,0.34)' }}
                  >
                    {t('home.timed')}
                  </h3>

                  {/* Divider */}
                  <div className="w-7 h-px bg-gradient-to-r from-orange-300/80 to-transparent mb-3" />

                  {/* Description */}
                  <p className="text-[13px] leading-snug mb-3.5 max-w-[240px] text-white/60 text-left">
                    {t('home.timedDesc')}
                  </p>

                  {/* Bottom Tags */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.075] text-amber-200/90">
                      <span>⏱</span>
                      <span>{t('home.timeLimited')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.075] text-amber-200/90">
                      <span>⚡</span>
                      <span>{t('home.fast')}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 bg-amber-300/[0.08] border border-amber-200/[0.12] text-amber-50/95">
                      <span>🏆</span>
                      <span>{t('home.bestWithScore', { score: (stats?.timedHighScore || 0).toLocaleString(numberLocale) })}</span>
                    </div>
                  </div>
                </div>

                {/* Right Icon */}
                <div
                  className="absolute -right-1 top-1/2 z-[1] flex h-[112px] w-[112px] -translate-y-1/2 items-center justify-center"
                  style={{
                    color: 'rgba(245,158,11,0.40)',
                    filter: 'drop-shadow(0 0 24px rgba(245,158,11,0.28))',
                    fontSize: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <Clock3 size={100} strokeWidth={1.35} />
                </div>

              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};
