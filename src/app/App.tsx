import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Grid } from '../features/game/components/Grid';
import { Piece } from '../features/game/components/Piece';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useAbilityStore } from '../features/abilities/store/abilityStore';
import { usePassiveAbilityStore } from '../features/abilities/store/passiveAbilityStore';
import { useProfileStore } from '../features/profile/store/profileStore';
import { HUD, ScorePopups, ChainCounter, PerfectBonus, SurgeFlash, ComboFlash, DragOverlay } from '@features/hud';
import { LevelMap } from '../features/career/components/LevelMap';
import { CareerPage } from '../features/career/components/CareerPage';
import { Tutorial, shouldShowTutorial } from '@shared/components';
import { AbilityPanel } from '../features/abilities/components/AbilityPanel';
import { ProfileView } from '../features/profile/components/ProfileView';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@utils/shareResult';
import { generateLevel } from '@features/career/utils/levelGenerator';
import { safeParseInt } from '@features/game/store/helpers/localStorage';
import { getStreak, getDailyPlayedToday, getDayNumber } from '@utils/streakManager';
import clsx from 'clsx';
import { AppState, GameMode } from '@shared/types';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface TimePopup {
  id: number;
  value: number;
  isNegative: boolean;
}

const App: React.FC = () => {
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction, isSurgeActive,
    isLevelComplete, nextLevel, currentLevelIndex, movesLeft,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft,
    earnedStars, dailyClearHistory, highScore, stats, maxLevelReached, startLevel, survivalTime
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [prevGameOver, setPrevGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const prevScoreRef = useRef(0);
  const popupIdRef = useRef(0);
  const [shownChain, setShownChain] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [showSurgeFlash, setShowSurgeFlash] = useState(false);
  const lastActionRef = useRef<typeof lastAction>(null);
  const prevSurgeRef = useRef(false);
  const [milestoneTier, setMilestoneTier] = useState('');
  const [timePopups, setTimePopups] = useState<TimePopup[]>([]);
  const prevTimeRef = useRef(0);
  const timePopupIdRef = useRef(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [surgeWasUsed, setSurgeWasUsed] = useState(false);
  const [streak, setStreak] = useState(getStreak);
  const [dailyPlayedToday, setDailyPlayedToday] = useState(getDailyPlayedToday);

  // Game Over Message Helper
  const getGameOverMessage = () => {
    if (gameMode === GameMode.ENDLESS) {
      return {
        title: 'Harika Oyun!',
        subtitle: 'Artık Hamle Kalmadı',
        description: 'Tüm parçalar yerleştirilemez durumda'
      };
    }
    
    if (gameMode === GameMode.TIMED) {
      if (timeLeft <= 0) {
        return {
          title: 'Süre Doldu!',
          subtitle: 'Quantum Rush Sona Erdi',
          description: `${score.toLocaleString()} puan kazandın`
        };
      }
    }
    
    if (gameMode === GameMode.CAREER) {
      if (movesLeft <= 0) {
        return {
          title: 'Hamle Bitti',
          subtitle: `Seviye ${currentLevelIndex} Başarısız`,
          description: 'Hedeflere ulaşamadın'
        };
      }
      return {
        title: 'Oyun Bitti',
        subtitle: `Seviye ${currentLevelIndex}`,
        description: 'Artık hamle kalmadı'
      };
    }
    
    return {
      title: 'Oyun Bitti',
      subtitle: 'Tekrar Dene',
      description: ''
    };
  };

  // Initialize stores on mount
  useEffect(() => {
    useAbilityStore.getState().initializeAbilities();
    usePassiveAbilityStore.getState().initializePassives();
    useProfileStore.getState().initializeProfile();
  }, []);

  useEffect(() => {
    // We don't call initGame() here anymore to allow starting on the HOME screen.
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch);
    return () => window.removeEventListener('pointerdown', handleFirstTouch);
  }, []);

  // URL parameter handling for shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode) {
      const modeMap: Record<string, GameMode> = {
        'endless': GameMode.ENDLESS,
        'daily': GameMode.DAILY_CHALLENGE,
        'timed': GameMode.TIMED,
        'zen': GameMode.ZEN,
        'blitz': GameMode.BLITZ,
        'survival': GameMode.SURVIVAL,
      };
      
      const gameMode = modeMap[mode.toLowerCase()];
      if (gameMode) {
        initGame(gameMode);
      }
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [initGame]);

  // History management for Android back button
  useEffect(() => {
    // Initialize history state
    if (!window.history.state) {
      window.history.replaceState({ appState: AppState.HOME }, '');
    }
  }, []);

  // Push state when appState changes (except HOME)
  useEffect(() => {
    if (appState !== AppState.HOME) {
      window.history.pushState({ appState }, '');
    }
  }, [appState]);

  // Listen to popstate (back button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If in GAME state, show confirmation dialog
      if (appState === AppState.GAME && !isGameOver) {
        const confirmed = window.confirm('Oyundan çıkmak istediğinize emin misiniz? İlerlemeniz kaybolacak.');
        if (confirmed) {
          setAppState(AppState.HOME);
        } else {
          // User cancelled, push state back
          window.history.pushState({ appState: AppState.GAME }, '');
        }
      } else {
        // Navigate back to previous state or HOME
        const targetState = event.state?.appState || AppState.HOME;
        setAppState(targetState);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [appState, isGameOver, setAppState]);

  // Global Timer Loop
  useEffect(() => {
    if ((gameMode !== GameMode.TIMED && gameMode !== GameMode.ZEN && gameMode !== GameMode.BLITZ && gameMode !== GameMode.SURVIVAL) || appState !== AppState.GAME || isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, appState, isGameOver, tickTimer]);

  // Play game over sound
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      playGameOver();
    }
    setPrevGameOver(isGameOver);
  }, [isGameOver]);

  // Score popup on score change
  useEffect(() => {
    if (score > prevScoreRef.current && prevScoreRef.current > 0) {
      const diff = score - prevScoreRef.current;
      const id = popupIdRef.current++;
      setScorePopups(prev => [...prev.slice(-3), { id, value: diff, combo }]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== id));
      }, 1200);
    }
    prevScoreRef.current = score;
  }, [score, combo]);

  // Zincir + Renk bonusu
  useEffect(() => {
    if (!lastAction || lastAction === lastActionRef.current) return;
    lastActionRef.current = lastAction;
    
    // Handle MILESTONE type for difficulty tier progression
    if (lastAction.type === 'MILESTONE') {
      setMilestoneTier(lastAction.tierName ?? '');
      setTimeout(() => setMilestoneTier(''), 2500);
      return;
    }
    
    if (lastAction.type !== 'CLEAR') return;

    const chain = lastAction.chainCount ?? 0;
    if (chain >= 2) {
      setShownChain(chain);
      setTimeout(() => setShownChain(0), 1400);
    }
    if (lastAction.colorBonus) {
      setShowPerfect(true);
      setTimeout(() => setShowPerfect(false), 1600);
    }
  }, [lastAction]);

  // Surge flash
  useEffect(() => {
    if (isSurgeActive && !prevSurgeRef.current) {
      setShowSurgeFlash(true);
      setTimeout(() => setShowSurgeFlash(false), 1200);
    }
    prevSurgeRef.current = isSurgeActive;
  }, [isSurgeActive]);

  // BLITZ mode time popups
  useEffect(() => {
    if (gameMode !== GameMode.BLITZ) return;
    
    const diff = timeLeft - prevTimeRef.current;
    if (diff !== 0 && prevTimeRef.current !== 0) {
      const id = timePopupIdRef.current++;
      const isNegative = diff < 0;
      setTimePopups(prev => [...prev.slice(-2), { id, value: Math.abs(diff), isNegative }]);
      setTimeout(() => setTimePopups(prev => prev.filter(p => p.id !== id)), 900);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft, gameMode]);

  // Achievement notification timeout
  const { clearAchievementNotification } = useGameStore();
  useEffect(() => {
    if (unlockedAchievementId) {
      const timer = setTimeout(() => {
        clearAchievementNotification();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [unlockedAchievementId, clearAchievementNotification]);

  // Track surge usage for sharing
  useEffect(() => {
    if (isSurgeActive) setSurgeWasUsed(true);
  }, [isSurgeActive]);

  // Reset share state on new game
  useEffect(() => {
    if (!isGameOver) {
      setSurgeWasUsed(false);
      setShareStatus('idle');
    }
  }, [isGameOver]);

  // Update streak state when Daily Challenge ends
  useEffect(() => {
    if (gameMode === GameMode.DAILY_CHALLENGE && isGameOver) {
      setStreak(getStreak());
      setDailyPlayedToday(getDailyPlayedToday());
    }
  }, [isGameOver, gameMode]);

  return (
    <div className="game-container" onPointerDown={unlockAudio} style={{ background: colors.background }}>
      <AnimatePresence mode="wait">
        {appState === AppState.HOME && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-y-auto"
            style={{ backgroundColor: colors.cardBackground }}
          >
            <div className="w-full max-w-xs">
              {/* Logo Section */}
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-center mb-4"
              >
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white mb-1 leading-none uppercase">
                  FLUX<span className="text-blue-500">GRID</span>
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-6 bg-blue-500/40" />
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-bold">Zen Puzzle</span>
                  <div className="h-[1px] w-6 bg-blue-500/40" />
                </div>
              </motion.div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: 6, margin: '8px 0 16px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>
                    {highScore > 0 ? (highScore >= 1000 ? `${(highScore / 1000).toFixed(1)}k` : highScore) : '--'}
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>EN İYİ SKOR</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                    {stats.gamesPlayed}
                  </div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>OYUN</div>
                </div>
                <div style={{ flex: 1, background: streak > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${streak > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                    {streak > 0 ? streak : '--'}
                  </div>
                  <div style={{ fontSize: 8, color: streak > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>SERİ</div>
                </div>
              </div>

              {/* Daily Challenge Card */}
              <motion.button
                onClick={() => { playClick(); initGame(GameMode.DAILY_CHALLENGE); }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  marginBottom: 8,
                  background: dailyPlayedToday ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)',
                  border: `0.5px solid ${dailyPlayedToday ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dailyPlayedToday ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dailyPlayedToday ? '#34d399' : '#fbbf24' }}>
                    Günlük Bulmaca #{getDayNumber()}
                  </div>
                  <div style={{ fontSize: 9, color: dailyPlayedToday ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.4)', marginTop: 1 }}>
                    {dailyPlayedToday ? 'Bugün tamamlandı' : 'Henüz oynanmadı'}
                  </div>
                </div>
                {!dailyPlayedToday && (
                  <div style={{ fontSize: 10, color: 'rgba(245,158,11,0.6)' }}>→</div>
                )}
              </motion.button>

              {/* Career Continue Button */}
              {maxLevelReached > 0 && (() => {
                const nextLevel = Math.max(1, maxLevelReached + 1);
                const careerLevelDef = generateLevel(nextLevel);
                const careerStars = safeParseInt(localStorage.getItem(`flux_level_${maxLevelReached}_stars`) || '0');
                
                return (
                  <motion.button
                    onClick={() => { playClick(); startLevel(nextLevel); }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      marginBottom: 16,
                      background: 'rgba(59,130,246,0.08)',
                      border: '0.5px solid rgba(59,130,246,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>
                        Kariyer — Seviye {nextLevel}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(147,197,253,0.4)', marginTop: 1 }}>
                        {careerLevelDef.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3].map(s => (
                        <svg key={s} width="10" height="10" viewBox="0 0 10 10">
                          <polygon
                            points="5,0 6.5,3.5 10,3.5 7.5,6 8.5,10 5,7.5 1.5,10 2.5,6 0,3.5 3.5,3.5"
                            fill={careerStars >= s ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                          />
                        </svg>
                      ))}
                    </div>
                  </motion.button>
                );
              })()}

              {/* Quick Start Grid */}
              {(() => {
                const QUICK_MODES = [
                  { mode: GameMode.ENDLESS, label: 'Sonsuz', icon: '∞', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
                  { mode: GameMode.TIMED, label: 'Rush', icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                  { mode: GameMode.BLITZ, label: 'Blitz', icon: '🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
                  { mode: GameMode.ZEN, label: 'Zen', icon: '☁', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
                ];

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                    {QUICK_MODES.map(({ mode, label, icon, color, bg, border }) => (
                      <motion.button
                        key={mode}
                        onClick={() => { playClick(); initGame(mode); }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 12,
                          background: bg,
                          border: `0.5px solid ${border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '.05em' }}>
                          {label.toUpperCase()}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                );
              })()}

              {/* Bottom Navigation */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '.05em',
                    cursor: 'pointer'
                  }}
                >
                  HARİTA
                </button>
                <button
                  onClick={() => { playClick(); setAppState(AppState.MODES); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '.05em',
                    cursor: 'pointer'
                  }}
                >
                  TÜM MODLAR
                </button>
                <button
                  onClick={() => { playClick(); setShowThemeSelector(true); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '.05em',
                    cursor: 'pointer'
                  }}
                >
                  AYARLAR
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {appState === AppState.MODES && (
          <motion.div
            key="modes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gray-900"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white italic tracking-tight uppercase mb-2">MOD SEÇİMİ</h2>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">Nasıl Oynamak İstersin?</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">KARİYER</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hikaye Modu & Görevler</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🗺️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.ENDLESS); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">SONSUZ</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Limit Yok, Sadece Skor</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">♾️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.TIMED); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">QUANTUM RUSH</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hızlı Ol, Süre Kazan</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.ZEN); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">ZEN</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Hedef yok. Süre yok. Her 10 satırda palet değişir.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">☁️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.BLITZ); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">BLITZ</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">30 saniye. Her satır 2 saniye kazandırır.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.SURVIVAL); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-gray-600/10 hover:border-gray-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">SURVIVAL</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">Grid dolmadan önce temizle. Satırlar yükseliyor.</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">💀</div>
              </button>

              <button
                onClick={() => { playClick(); setAppState(AppState.HOME); }}
                className="w-full py-4 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                ← Geri Dön
              </button>
            </div>
          </motion.div>
        )}

        {appState === AppState.LEVEL_MAP && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LevelMap />
          </motion.div>
        )}

        {appState === AppState.CAREER && (
          <motion.div key="career" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CareerPage />
          </motion.div>
        )}

        {appState === AppState.GAME && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex flex-col z-30 overflow-hidden"
          >
            {/* HUD */}
            <header className="flex-none w-full max-w-4xl mx-auto" style={{ padding: '2px 4px', height: 'var(--hud-height)' }}>
              <div style={{ height: '100%' }}>
                <HUD />
              </div>
            </header>

            {/* Grid Area */}
            <main className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', maxWidth: '100vmin', maxHeight: '100vmin', aspectRatio: '1/1' }}>
                  <Grid />
                </div>
              </div>
            </main>

            {/* Piece Tray */}
            <div style={{ 
              height: 'var(--tray-height)', 
              paddingBottom: 'env(safe-area-inset-bottom, 8px)',
              backgroundColor: colors.trayBackground,
              borderTop: `1px solid ${colors.hudBorder}`
            }}>
              <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '1px 6px' }}>
                <div className="grid grid-cols-3 flex-1 min-h-0" style={{ gap: '4px' }}>
                  <AnimatePresence mode="popLayout">
                    {pieces.map((piece) => (
                      <motion.div
                        key={piece.instanceId}
                        layout
                        initial={{ scale: 0.6, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className={clsx(
                          "piece-slot border transition-colors h-full",
                          piece.type === 'ICE' ? "bg-blue-900/15 border-blue-400/20" :
                            piece.type === 'BOMB' ? "bg-red-900/15 border-red-400/20" :
                              ""
                        )}
                        style={{ 
                          borderRadius: '6px',
                          backgroundColor: piece.type === 'NORMAL' ? colors.cardBackground : undefined,
                          borderColor: piece.type === 'NORMAL' ? colors.cardBorder : undefined
                        }}
                      >
                        <Piece piece={piece} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Game Visual Effects */}
            <ScorePopups popups={scorePopups} />
            <ComboFlash combo={combo} />
            <SurgeFlash active={showSurgeFlash} />
            
            {/* BLITZ Time Popups */}
            <div style={{ position: 'fixed', top: 80, right: 16, display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none', zIndex: 50 }}>
              <AnimatePresence>
                {timePopups.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.6 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: p.isNegative ? '#ef4444' : '#f59e0b',
                      textAlign: 'right'
                    }}
                  >
                    {p.isNegative ? '-' : '+'}{p.value}s
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-50">
              <AnimatePresence mode="popLayout">
                {shownChain >= 2 && <ChainCounter key={`c${shownChain}`} chain={shownChain} />}
                {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
              </AnimatePresence>
            </div>

            {/* Milestone Banner for Endless Mode Difficulty Tiers */}
            <AnimatePresence>
              {milestoneTier && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -30 }}
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 60,
                    pointerEvents: 'none',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    fontSize: 28, 
                    fontWeight: 700, 
                    color: '#f59e0b', 
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 8px rgba(245,158,11,0.5)'
                  }}>
                    {milestoneTier.toUpperCase()}
                  </div>
                  <div style={{ 
                    fontSize: 11, 
                    color: 'rgba(255,255,255,0.4)', 
                    marginTop: 2,
                    letterSpacing: '0.1em'
                  }}>
                    YENİ ZOR SEVİYE
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence and Global Overlays */}
      <DragOverlay />
      <AnimatePresence>
        {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}
        {showAbilities && <AbilityPanel onClose={() => setShowAbilities(false)} />}
        {showProfile && <ProfileView onClose={() => setShowProfile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isLevelComplete && gameMode === GameMode.CAREER && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-900/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-800 border-2 border-blue-500/30 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-4xl">🏆</motion.span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 italic tracking-tight">TEBRİKLER!</h2>
              <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-6">Seviye {currentLevelIndex} Tamamlandı</p>
              
              {/* Stars Animation */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3].map(s => (
                  <motion.svg
                    key={s}
                    width="32"
                    height="32"
                    viewBox="0 0 10 10"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: earnedStars >= s ? 1 : 0.5, rotate: 0 }}
                    transition={{ delay: s * 0.15, type: 'spring', stiffness: 200 }}
                  >
                    <polygon
                      points="5,0 6.5,3.5 10,3.5 7.5,6 8.5,10 5,7.5 1.5,10 2.5,6 0,3.5 3.5,3.5"
                      fill={earnedStars >= s ? '#f59e0b' : 'rgba(255,255,255,0.1)'}
                    />
                  </motion.svg>
                ))}
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 mb-8">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Kazanılan Skor</p>
                <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
              </div>
              <button onClick={nextLevel} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest transition-all shadow-lg">SONRAKİ SEVİYE</button>
              <button
                onClick={() => setAppState(AppState.LEVEL_MAP)}
                className="w-full mt-3 py-3 rounded-2xl bg-white/5 text-white/40 text-[10px] font-bold tracking-widest uppercase"
              >Haritaya Dön</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAchievementId && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[280px]"
          >
            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center text-xl">🏅</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Başarım Açıldı!</span>
              <span className="font-bold">{achievements.find(a => a.id === unlockedAchievementId)?.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-gray-800 border border-white/8 p-6 md:p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center relative overflow-hidden"
            >
              {(() => {
                const gameOverMsg = getGameOverMessage();
                
                // Mode suggestions
                const MODE_SUGGESTIONS: Record<string, { mode: GameMode; label: string; desc: string }> = {
                  [GameMode.ENDLESS]: { mode: GameMode.BLITZ, label: 'Blitz\'i dene', desc: '30 saniye, anlık heyecan' },
                  [GameMode.BLITZ]: { mode: GameMode.TIMED, label: 'Rush\'ı dene', desc: '60 saniye, satır başı süre' },
                  [GameMode.TIMED]: { mode: GameMode.SURVIVAL, label: 'Survival\'ı dene', desc: 'Satırlar yükseliyor' },
                  [GameMode.SURVIVAL]: { mode: GameMode.ZEN, label: 'Zen\'i dene', desc: 'Stressiz, sakin oyun' },
                  [GameMode.ZEN]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Skor kovalama modu' },
                  [GameMode.CAREER]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Kariyer arası dinlenme' },
                  [GameMode.DAILY_CHALLENGE]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Bugünlük bitmedi' },
                };
                const suggestion = MODE_SUGGESTIONS[gameMode];

                return (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">{gameOverMsg.title}</h2>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-4">{gameOverMsg.subtitle}</p>

                    {/* Score Display */}
                    <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '.1em', marginBottom: 4 }}>
                        {gameMode === GameMode.TIMED ? 'QUANTUM RUSH' :
                          gameMode === GameMode.BLITZ ? 'BLITZ' :
                            gameMode === GameMode.CAREER ? `SEVİYE ${currentLevelIndex}` :
                              gameMode === GameMode.SURVIVAL ? `${Math.floor(survivalTime)}s HAYATTA KALDI` :
                                'SKOR'}
                      </div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                        {score.toLocaleString()}
                      </div>
                      {score > (highScore * 0.9) && score < highScore && (
                        <div style={{ fontSize: 10, color: 'rgba(245,158,11,0.7)', marginTop: 4 }}>
                          Rekora %{Math.round((score / highScore) * 100)} yaklaştın
                        </div>
                      )}
                      {score >= highScore && highScore > 0 && (
                        <div style={{ fontSize: 10, color: '#34d399', marginTop: 4 }}>
                          🎉 Yeni rekor!
                        </div>
                      )}
                    </div>

                    {/* Mini Stats Row */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>
                          {combo > 0 ? `x${combo}` : '--'}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>MAX COMBO</div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                          {stats.linesCleared}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>TOPLAM SATIR</div>
                      </div>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                          {stats.gamesPlayed}
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>TOPLAM OYUN</div>
                      </div>
                    </div>

                    {/* Retry Button */}
                    <button
                      onClick={() => gameMode === GameMode.CAREER ? resetGame() : initGame(gameMode)}
                      className="w-full py-4 rounded-xl bg-rose-600 text-white font-semibold group transition-all"
                    >
                      <span className="group-active:scale-95 block">Tekrar Dene</span>
                    </button>

                    {/* Share Result Button */}
                    <button
                      onClick={async () => {
                        const text = generateShareText(
                          score,
                          gameMode,
                          combo,
                          surgeWasUsed,
                          dailyClearHistory
                        );
                        const result = await shareResult(text);
                        setShareStatus(result === 'failed' ? 'idle' : result === 'shared' ? 'shared' : 'copied');
                        if (result !== 'failed') {
                          setTimeout(() => setShareStatus('idle'), 2000);
                        }
                      }}
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '12px 0',
                        borderRadius: 12,
                        border: '0.5px solid rgba(59,130,246,0.3)',
                        background: 'rgba(59,130,246,0.08)',
                        color: '#60a5fa',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {shareStatus === 'copied' ? '✓ Kopyalandı!' : shareStatus === 'shared' ? '✓ Paylaşıldı!' : '↗ Sonucu Paylaş'}
                    </button>

                    {/* Mode Suggestion */}
                    {suggestion && (
                      <button
                        onClick={() => { playClick(); initGame(suggestion.mode); }}
                        style={{
                          width: '100%',
                          marginTop: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: '0.5px solid rgba(255,255,255,0.06)',
                          background: 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                            {suggestion.label}
                          </div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                            {suggestion.desc}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>→</div>
                      </button>
                    )}

                    {/* Home Button */}
                    <button
                      onClick={() => setAppState(AppState.HOME)}
                      className="w-full mt-3 py-3 rounded-xl bg-white/5 text-white/40 text-[10px] font-bold uppercase"
                    >
                      Ana Menüye Dön
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowThemeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-white/8 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">Tema Seç</h2>
              <p className="text-gray-400 text-xs text-center mb-6">Oyun masası görünümünü değiştir</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { playClick(); setTheme('dark'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'dark' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Koyu</p>
                  <p className="text-gray-400 text-xs">Varsayılan</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('light'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'light' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Açık</p>
                  <p className="text-gray-400 text-xs">Parlak</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('neon'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'neon' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Neon</p>
                  <p className="text-gray-400 text-xs">Mor Ton</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('ocean'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'ocean' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0a1929 0%, #0c1821 100%)' }}></div>
                  <p className="text-white text-sm font-bold">Okyanus</p>
                  <p className="text-gray-400 text-xs">Mavi Ton</p>
                </button>
              </div>
              
              <button
                onClick={() => { playClick(); setShowThemeSelector(false); }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
              >
                Tamam
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;