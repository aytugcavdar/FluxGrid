import React, { useState, useEffect, useMemo } from 'react';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../features/game/store/gameStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { useThemeStore } from '../shared/store/themeStore';
import { useDailyRewardStore } from '../shared/store/dailyRewardStore';
import { useStreakStore } from '../shared/store/streakStore';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { DailyRewardModal } from './components/DailyRewardModal';
import { Gift } from 'lucide-react';
import { detectDeviceCapabilities } from '../utils/platform/deviceCapability';



/* ─────────────────────────────────────────────── */
/* Mini grid logo animation                        */
/* ─────────────────────────────────────────────── */
const GRID_COLORS = ['#6366f1', '#a855f7', '#3b82f6', '#10b981'];
const GridLogo: React.FC = () => {
  const [lit, setLit] = useState([true, false, false, true]);
  useEffect(() => {
    const t = setInterval(() => {
      setLit([
        Math.random() > 0.3,
        Math.random() > 0.3,
        Math.random() > 0.3,
        Math.random() > 0.3,
      ]);
    }, 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 14,
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 3, padding: 8,
      boxShadow: '0 0 28px rgba(139,92,246,0.55), 0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {[0,1,2,3].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: lit[i] ? 1 : 0.25, scale: lit[i] ? 1 : 0.8 }}
          transition={{ duration: 0.45 }}
          style={{ borderRadius: 3, background: GRID_COLORS[i] }}
        />
      ))}
    </div>
  );
};


/* ─────────────────────────────────────────────── */
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

  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const isLowEndDevice = deviceCapabilities?.tier === 'low';

  useEffect(() => {
    const loadDeviceCapabilities = async () => {
      const caps = await detectDeviceCapabilities();
      setDeviceCapabilities(caps);
    };
    loadDeviceCapabilities();
  }, []);

  const meetsMinimumRequirements = useMemo(() => {
    if (!deviceCapabilities) return true; // Default to true while loading
    const { memory, cores, gpuRenderer } = deviceCapabilities;
    if (memory < 3 || cores < 6) return false;
    if (gpuRenderer) {
      const gpu = gpuRenderer.toLowerCase();
      if (
        gpu.includes('mali-4') || gpu.includes('mali-g31') ||
        gpu.includes('adreno (tm) 3') || gpu.includes('adreno 3') ||
        gpu.includes('powervr sgx')
      ) return false;
    }
    return true;
  }, [deviceCapabilities]);

  useEffect(() => { initializeRewards(); }, [initializeRewards]);
  useEffect(() => { setHasSave(hasSavedGame()); }, [hasSavedGame]);

  // Auto-start tutorial for first-time users
  useEffect(() => {
    const tutorialData = localStorage.getItem('flux_tutorial_v2');
    if (!tutorialData) {
      initGame(GameMode.ENDLESS);
    }
  }, []);

  const sonsuzBestScore = highScores?.[GameMode.ENDLESS] || 0;
  const timedBestScore  = highScores?.[GameMode.TIMED]   || 0;
  const overallBestScore = useMemo(() => Math.max(sonsuzBestScore, timedBestScore), [sonsuzBestScore, timedBestScore]);
  const { currentStreak: dailyStreak } = useStreakStore();

  const stagger = (i: number) => ({ duration: 0.5, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] });

  return (
    <MotionConfig reducedMotion={isLowEndDevice ? 'always' : 'user'}>
      <div
        className="fixed inset-0 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0812 0%, #110d22 45%, #0c0918 100%)',
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
              <h2 className="text-xl font-bold mb-2" style={{ color: '#f8f8f8' }}>{t('home.minimumRequirementsTitle', 'Cihaz Gereksinimleri')}</h2>
              <p className="text-sm mb-4 opacity-70" style={{ color: '#ccc' }}>{t('home.minimumRequirementsDesc', 'Cihazınız minimum gereksinimleri karşılamıyor.')}</p>
              <button onClick={() => window.location.reload()} className="w-full py-3 rounded-2xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
                {t('home.tryAnyway', 'Yine de Dene')}
              </button>
            </motion.div>
          </div>
        )}

        {/* ── Background gradient orbs + falling blocks ── */}
        {!isLowEndDevice && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div animate={{ x: [0, 80, 0], y: [0, -60, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full blur-[80px] opacity-[0.18]"
              style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
            <motion.div animate={{ x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.14]"
              style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
            {/* Subtle grid lines */}
            <div className="absolute inset-0 opacity-[0.025]" style={{
              backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          </div>
        )}


        {/* ── Main content ── */}
        <div className="relative flex-1 flex flex-col px-5 pt-3 pb-4 overflow-hidden">
          <div className="w-full max-w-[400px] mx-auto flex flex-col h-full" style={{ paddingBottom: '76px' }}>

            {/* ─── HEADER ─── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={stagger(0)}
              className="flex items-center justify-between mb-5">

              {/* Logo */}
              <div className="flex items-center gap-3">
                <GridLogo />
                <div>
                  <h1 className="text-2xl font-black tracking-tight leading-none">
                    <span style={{
                      background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 60%, #f472b6 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>FLUX</span>
                    <span style={{
                      background: 'linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>GRID</span>
                  </h1>
                  <p className="text-[10px] font-semibold tracking-[0.15em] opacity-40 mt-0.5" style={{ color: '#a0a0c0' }}>
                    QUANTUM PUZZLE
                  </p>
                </div>
              </div>

              {/* Daily Reward */}
              {hasReward && (
                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }} onClick={() => setShowRewardModal(true)}
                  className="relative">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 6px 20px rgba(249,115,22,0.45)' }}>
                    <Gift className="w-5 h-5 text-white" />
                  </motion.div>
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0812]" />
                </motion.button>
              )}
            </motion.div>

            {/* ─── STATS ROW ─── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={stagger(1)}
              className="grid grid-cols-2 gap-3 mb-5">
              {/* Streak */}
              <div className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
                }}>
                <div className="absolute top-3 right-3 text-xl opacity-30">🔥</div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-50 mb-1" style={{ color: '#a0a0c0' }}>
                  Günlük Seri
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black" style={{
                    background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{dailyStreak}</span>
                  <span className="text-xs font-semibold opacity-50" style={{ color: '#a0a0c0' }}>gün</span>
                </div>
              </div>
              {/* Best Score */}
              <div className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  boxShadow: '0 4px 20px rgba(168,85,247,0.08)',
                }}>
                <div className="absolute top-3 right-3 text-xl opacity-30">🏆</div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-50 mb-1" style={{ color: '#a0a0c0' }}>
                  En Yüksek Skor
                </p>
                <div className="text-2xl font-black" style={{
                  background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {overallBestScore.toLocaleString()}
                </div>
              </div>
            </motion.div>

            {/* ─── CONTINUE BUTTON ─── */}
            <AnimatePresence>
              {hasSave && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { if (soundEnabled) playClick(); loadSavedGame(); }}
                  className="relative rounded-2xl p-4 mb-4 overflow-hidden flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.2) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    boxShadow: '0 8px 28px rgba(99,102,241,0.2)',
                  }}
                >
                  {/* Shimmer */}
                  <motion.div animate={{ x: ['-150%', '250%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/3 h-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', pointerEvents: 'none' }} />

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.3)' }}>
                    <span className="text-xl">▶️</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-white">Devam Et</div>
                    <div className="text-xs opacity-50" style={{ color: '#a0a0c0' }}>Kaldığın yerden devam et</div>
                  </div>
                  <span className="text-white opacity-40 text-lg">›</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* ─── MODE SECTION LABEL ─── */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={stagger(2)}
              className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: 'rgba(160,160,192,0.5)' }}>
              {t('home.chooseYourMode', 'Mod Seç')}
            </motion.p>

            {/* ─── MODE CARDS ─── */}
            <div className="flex-1 flex flex-col gap-4">

              {/* ── ENDLESS MODE ── */}
              <motion.button
                initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={stagger(3)}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (soundEnabled) playClick(); initGame(GameMode.ENDLESS); }}
                className="relative rounded-3xl overflow-hidden flex-1"
                style={{
                  minHeight: 120, maxHeight: 140,
                  background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 50%, #7c3aed 100%)',
                  boxShadow: '0 16px 48px rgba(109,40,217,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
                }}
              >
                {/* Inner glow top */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                {/* Animated shimmer */}
                {!isLowEndDevice && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/2 h-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none' }} />
                )}
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />

                <div className="relative flex flex-col h-full px-6 py-5">
                  <div className="flex items-start justify-between mb-auto">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-1">Sonsuz</div>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{t('home.infinite', 'Sonsuz')}</h3>
                      <p className="text-xs text-white/70 leading-relaxed max-w-[190px]">
                        Rahat oyna, rekor kas
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <span className="text-3xl font-black text-white">∞</span>
                    </motion.div>
                  </div>
                  {/* High Score */}
                  {sonsuzBestScore > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">En İyi</div>
                      <div className="text-lg font-black text-white">{sonsuzBestScore.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </motion.button>

              {/* ── TIMED MODE ── */}
              <motion.button
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={stagger(4)}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (soundEnabled) playClick(); initGame(GameMode.TIMED); }}
                className="relative rounded-3xl overflow-hidden flex-1"
                style={{
                  minHeight: 120, maxHeight: 140,
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
                  boxShadow: '0 16px 48px rgba(217,119,6,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                {!isLowEndDevice && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                    className="absolute top-0 left-0 w-1/2 h-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none' }} />
                )}
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />

                <div className="relative flex flex-col h-full px-6 py-5">
                  <div className="flex items-start justify-between mb-auto">
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-1">Zamanlı</div>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{t('home.timed', 'Zamanlı')}</h3>
                      <p className="text-xs text-white/70 leading-relaxed max-w-[190px]">
                        60 saniye, hızlı combo
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <span className="text-3xl">⏱</span>
                    </motion.div>
                  </div>
                  {/* High Score */}
                  {timedBestScore > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-white/40">En İyi</div>
                      <div className="text-lg font-black text-white">{timedBestScore.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        <DailyRewardModal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} />
      </div>
    </MotionConfig>
  );
};
