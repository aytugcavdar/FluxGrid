import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Grid } from '../features/game/components/Grid';
import { Piece } from '../features/game/components/Piece';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useAbilityStore } from '../features/abilities/store/abilityStore';
import { usePassiveAbilityStore } from '../features/abilities/store/passiveAbilityStore';
import { useProfileStore } from '../features/profile/store/profileStore';
import { HUD, ScorePopups, ChainCounter, PerfectBonus, SurgeFlash, ComboFlash, DragOverlay, ComboBar } from '@features/hud';
import { LevelMap } from '../features/career/components/LevelMap';
import { CareerPage } from '../features/career/components/CareerPage';
import { Tutorial, shouldShowTutorial } from '@shared/components';
import { AbilityPanel } from '../features/abilities/components/AbilityPanel';
import { ProfileView } from '../features/profile/components/ProfileView';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@utils/shareResult';
import { getStreak, getDailyPlayedToday, getDayNumber } from '@utils/streakManager';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AppState, GameMode } from '@shared/types';
import { X } from 'lucide-react';
import { useCountUp } from '@shared/hooks/useCountUp';

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

// Helper function to get mode icon
const getModeIcon = (mode: GameMode): string => {
  const icons: Record<GameMode, string> = {
    [GameMode.ENDLESS]: '∞',
    [GameMode.BLITZ]: '🔥',
    [GameMode.TIMED]: '⚡',
    [GameMode.SURVIVAL]: '🛡️',
    [GameMode.ZEN]: '☁️',
    [GameMode.CAREER]: '🎯',
    [GameMode.DAILY_CHALLENGE]: '📅',
    [GameMode.PUZZLE]: '🧩',
  };
  return icons[mode] || '🎮';
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction, isSurgeActive,
    isLevelComplete, nextLevel, currentLevelIndex,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft,
    earnedStars, dailyClearHistory, highScore, stats, maxLevelReached, startLevel, bossType,
    isFirstGame, guidedStep
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showBossIntro, setShowBossIntro] = useState(false);
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
  
  // Score display animation state
  const displayScore = useCountUp(score, 600, isGameOver);
  const isNewRecord = score >= highScore && highScore > 0;
  const [showRecordBadge, setShowRecordBadge] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Grid sizing with ResizeObserver for safe area compatibility
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState(0);



  // Initialize stores on mount
  useEffect(() => {
    useAbilityStore.getState().initializeAbilities();
    usePassiveAbilityStore.getState().initializePassives();
    useProfileStore.getState().initializeProfile();
    
    // Babylon.js tamamen hazır olunca splash kapat
    // (initGame çağrılmadan önce)
    if (typeof (window as any).splashComplete === 'function') {
      (window as any).splashComplete();
      delete (window as any).splashComplete;
    }
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
        const confirmed = window.confirm(t('game.confirmExit'));
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

  // Show new record badge with delay
  useEffect(() => {
    if (isGameOver && isNewRecord) {
      const timer = setTimeout(() => setShowRecordBadge(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowRecordBadge(false);
    }
  }, [isGameOver, isNewRecord]);

  // Show buttons with delay (800ms)
  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => setShowButtons(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(false);
    }
  }, [isGameOver]);

  // Grid sizing with ResizeObserver for safe area
  useEffect(() => {
    if (!gridContainerRef.current) return;
    
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setGridSize(Math.min(width, height));
      }
    });
    
    obs.observe(gridContainerRef.current);
    return () => obs.disconnect();
  }, []);

  // Language change handler
  const changeLanguage = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('flux_language', lang);
  };

  // Boss intro animation
  useEffect(() => {
    if (appState === AppState.GAME && bossType) {
      setShowBossIntro(true);
      const t = setTimeout(() => setShowBossIntro(false), 2500);
      return () => clearTimeout(t);
    }
  }, [appState, bossType]);

  return (
    <div className="game-container" onPointerDown={unlockAudio} style={{ background: colors.background }}>
      <AnimatePresence mode="wait">
        {appState === AppState.HOME && (
          <ErrorBoundary
            fallback={
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: colors.cardBackground }}>
                <div className="w-full max-w-xs">
                  {/* Fallback UI without animations */}
                  <div className="text-center mb-3">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-1 leading-none uppercase">
                      FLUX<span className="text-blue-500">GRID</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-[1px] w-6 bg-blue-500/40" />
                      <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-bold">Zen Puzzle</span>
                      <div className="h-[1px] w-6 bg-blue-500/40" />
                    </div>
                  </div>
                  <button
                    onClick={() => { playClick(); initGame(GameMode.ENDLESS); }}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      borderRadius: 16,
                      background: 'rgba(167,139,250,0.15)',
                      border: '1px solid rgba(167,139,250,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      color: '#a78bfa',
                      fontSize: 20,
                      fontWeight: 800
                    }}
                  >
                    {t('home.play')}
                  </button>
                  <p className="text-white/40 text-xs text-center mt-4">
                    {t('game.errorOccurred')} - Animasyonlar devre dışı
                  </p>
                </div>
              </div>
            }
          >
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
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center mb-3"
              >
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-1 leading-none uppercase">
                  FLUX<span className="text-blue-500">GRID</span>
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-6 bg-blue-500/40" />
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-bold">Zen Puzzle</span>
                  <div className="h-[1px] w-6 bg-blue-500/40" />
                </div>
              </motion.div>

              {/* Stats Row */}
              {stats && typeof stats.gamesPlayed === 'number' && stats.gamesPlayed > 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                  style={{ display: 'flex', gap: 6, margin: '8px 0 16px' }}
                >
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>
                      {highScore > 0 ? (highScore >= 1000 ? `${(highScore / 1000).toFixed(1)}k` : highScore) : '--'}
                    </div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t('home.bestScore')}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                      {stats.gamesPlayed}
                    </div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t('home.games')}</div>
                  </div>
                  <div style={{ flex: 1, background: streak > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${streak > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '8px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: streak > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                      {streak > 0 ? streak : '--'}
                    </div>
                    <div style={{ fontSize: 8, color: streak > 0 ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t('home.streak')}</div>
                  </div>
                </motion.div>
              )}

              {/* Primary Action Button */}
              {(() => {
                const primaryAction = (() => {
                  // Build highScores object from localStorage with error handling
                  const highScores: { [key: string]: number } = {};
                  Object.values(GameMode).forEach(mode => {
                    try {
                      const stored = localStorage.getItem(`flux_highscore_${mode}`);
                      if (stored) {
                        const parsed = parseInt(stored, 10);
                        if (!isNaN(parsed) && parsed >= 0) {
                          highScores[mode] = parsed;
                        } else {
                          console.warn(`[Error Handling] Invalid high score for mode ${mode}: ${stored}`);
                        }
                      }
                    } catch (e) {
                      console.error(`[Error Handling] Failed to read high score for mode ${mode}:`, e);
                    }
                  });

                  // Fallback for missing user data - default to new user state
                  const isNewUser = !stats || typeof stats.gamesPlayed !== 'number' || stats.gamesPlayed === 0;
                  
                  if (!stats || typeof stats.gamesPlayed !== 'number') {
                    console.warn('[Error Handling] Missing or corrupted user stats, defaulting to new user state');
                  }
                  
                  if (isNewUser) {
                    return {
                      label: t('home.play'),
                      mode: GameMode.ENDLESS,
                      showTutorialLink: true,
                    };
                  }

                  // Get last played mode from localStorage with error handling
                  const modeStatsStr = localStorage.getItem('flux_mode_stats');
                  let lastMode: GameMode | null = null;
                  let highestMode: GameMode | null = null;
                  
                  if (modeStatsStr) {
                    try {
                      const modeStats = JSON.parse(modeStatsStr);
                      const modes = Object.values(modeStats) as any[];
                      
                      if (modes.length > 0) {
                        // Validate mode data
                        const validModes = modes.filter(m => 
                          m && 
                          typeof m.mode === 'string' && 
                          Object.values(GameMode).includes(m.mode) &&
                          typeof m.lastPlayed === 'number' &&
                          typeof m.highScore === 'number'
                        );

                        if (validModes.length !== modes.length) {
                          console.warn('[Error Handling] Some mode stats entries were invalid and filtered out');
                        }

                        if (validModes.length > 0) {
                          // Get last played
                          const sortedByTime = [...validModes].sort((a, b) => b.lastPlayed - a.lastPlayed);
                          lastMode = sortedByTime[0].mode;
                          
                          // Get highest scoring
                          const sortedByScore = [...validModes].sort((a, b) => b.highScore - a.highScore);
                          highestMode = sortedByScore[0].mode;
                        }
                      }
                    } catch (e) {
                      console.error('[Error Handling] Failed to parse mode stats, corrupted data detected:', e);
                      // Clear corrupted data
                      try {
                        localStorage.removeItem('flux_mode_stats');
                        console.info('[Error Handling] Cleared corrupted mode stats from localStorage');
                      } catch (clearError) {
                        console.error('[Error Handling] Failed to clear corrupted mode stats:', clearError);
                      }
                    }
                  }

                  // Fallback for invalid mode data - default to ENDLESS
                  const selectedMode = lastMode || highestMode || GameMode.ENDLESS;
                  
                  // Validate selected mode
                  if (!Object.values(GameMode).includes(selectedMode)) {
                    console.warn(`[Error Handling] Invalid mode detected: ${selectedMode}, falling back to ENDLESS`);
                    return {
                      label: 'DEVAM ET',
                      mode: GameMode.ENDLESS,
                      score: highScores[GameMode.ENDLESS] || 0,
                      showTutorialLink: false,
                    };
                  }

                  const modeScore = highScores[selectedMode] || 0;

                  return {
                    label: modeScore > 0 ? 'TEKRAR OYNA' : 'DEVAM ET',
                    mode: selectedMode,
                    score: modeScore,
                    showTutorialLink: false,
                  };
                })();

                // Get mode display info
                const getModeInfo = (mode: GameMode) => {
                  const modeInfo: Record<GameMode, { icon: string; color: string; bg: string; border: string }> = {
                    [GameMode.ENDLESS]: { icon: '∞', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' },
                    [GameMode.TIMED]: { icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                    [GameMode.BLITZ]: { icon: '🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
                    [GameMode.ZEN]: { icon: '☁', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
                    [GameMode.DAILY_CHALLENGE]: { icon: '📅', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                    [GameMode.CAREER]: { icon: '🗺️', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
                    [GameMode.SURVIVAL]: { icon: '💀', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
                    [GameMode.PUZZLE]: { icon: '🧩', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)' },
                  };
                  return modeInfo[mode] || modeInfo[GameMode.ENDLESS];
                };

                const modeInfo = getModeInfo(primaryAction.mode);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                    style={{ marginBottom: 16 }}
                  >
                    <motion.button
                      onClick={() => { playClick(); initGame(primaryAction.mode); }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: '100%',
                        padding: '20px 24px',
                        borderRadius: 16,
                        background: modeInfo.bg,
                        border: `1px solid ${modeInfo.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ fontSize: 32, lineHeight: 1 }}>{modeInfo.icon}</div>
                      <div style={{ 
                        fontSize: 20, 
                        fontWeight: 800, 
                        color: modeInfo.color, 
                        letterSpacing: '.05em',
                        textAlign: 'center'
                      }}>
                        {primaryAction.label}
                      </div>
                      {primaryAction.score !== undefined && primaryAction.score > 0 && (
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 600, 
                          color: 'rgba(255,255,255,0.4)',
                          textAlign: 'center'
                        }}>
                          {t('home.bestScore')}: {primaryAction.score.toLocaleString()}
                        </div>
                      )}
                    </motion.button>
                    
                    {/* Tutorial link for new users */}
                    {primaryAction.showTutorialLink && (
                      <motion.button
                        onClick={() => { playClick(); setShowTutorial(true); }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        style={{
                          width: '100%',
                          marginTop: 8,
                          padding: '8px 0',
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {t('home.howToPlay')}
                      </motion.button>
                    )}
                    
                    {/* Career Continuation Chip */}
                    {maxLevelReached && typeof maxLevelReached === 'number' && maxLevelReached > 0 && (
                      <motion.button
                        onClick={() => { 
                          playClick(); 
                          const nextLevel = Math.max(1, maxLevelReached + 1);
                          startLevel(nextLevel); 
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
                        style={{
                          width: '100%',
                          marginTop: 8,
                          padding: '6px 12px',
                          background: 'rgba(59,130,246,0.08)',
                          border: '0.5px solid rgba(59,130,246,0.2)',
                          borderRadius: 8,
                          color: '#93c5fd',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <span>kardan devam</span>
                        <span style={{ opacity: 0.6 }}>→</span>
                        <span>Seviye {maxLevelReached + 1}</span>
                      </motion.button>
                    )}
                  </motion.div>
                );
              })()}

              {/* Daily Challenge Card */}
              <motion.button
                onClick={() => { playClick(); initGame(GameMode.DAILY_CHALLENGE); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  marginBottom: 12,
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: dailyPlayedToday ? '#34d399' : '#fbbf24' }}>
                    {t('home.dailyChallenge', { day: getDayNumber() })}
                  </div>
                  <div style={{ fontSize: 8, color: dailyPlayedToday ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.4)', marginTop: 1 }}>
                    {dailyPlayedToday ? t('home.dailyPlayed') : t('home.dailyNotPlayed')}
                  </div>
                </div>
                {!dailyPlayedToday && (
                  <div style={{ fontSize: 9, color: 'rgba(245,158,11,0.6)' }}>→</div>
                )}
              </motion.button>



              {/* Bottom Navigation */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                style={{ display: 'flex', gap: 6 }}
              >
                <button
                  onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
                    {t('home.map')}
                  </span>
                </button>
                <button
                  onClick={() => { playClick(); setAppState(AppState.MODES); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
                    {t('home.allModes')}
                  </span>
                </button>
                <button
                  onClick={() => { playClick(); setShowThemeSelector(true); }}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '.05em' }}>
                    {t('home.settings')}
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>
          </ErrorBoundary>
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
              <h2 className="text-3xl font-black text-white italic tracking-tight uppercase mb-2">{t('modes.title')}</h2>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-bold">{t('modes.subtitle')}</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <button
                onClick={() => { playClick(); setAppState(AppState.LEVEL_MAP); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.career')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.careerSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">🗺️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.ENDLESS); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.endless')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.endlessSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">♾️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.TIMED); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.rush')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.rushSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.ZEN); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.zen')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.zenSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">☁️</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.BLITZ); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.blitz')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.blitzSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">⚡</div>
              </button>

              <button
                onClick={() => { playClick(); initGame(GameMode.SURVIVAL); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-gray-600/10 hover:border-gray-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.survival')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.survivalSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">💀</div>
              </button>

              <button
                onClick={() => { playClick(); setAppState(AppState.HOME); }}
                className="w-full py-4 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                {t('home.backButton')}
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
            <header 
              className="flex-none w-full max-w-4xl mx-auto" 
              style={{ 
                padding: `calc(2px + env(safe-area-inset-top, 0px)) 4px 2px`,
                height: `calc(var(--hud-height, 68px) + env(safe-area-inset-top, 0px))`
              }}
            >
              <div style={{ height: '100%' }}>
                <HUD />
              </div>
            </header>

            {/* Grid Area */}
            <main className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">
              <div 
                ref={gridContainerRef}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <div style={{ 
                  width: gridSize > 0 ? gridSize : '100%', 
                  height: gridSize > 0 ? gridSize : '100%', 
                  maxWidth: gridSize > 0 ? gridSize : '100vmin', 
                  maxHeight: gridSize > 0 ? gridSize : '100vmin', 
                  aspectRatio: '1/1' 
                }}>
                  <Grid />
                </div>
              </div>
              
              {/* Guided Experience Overlay */}
              {isFirstGame && guidedStep > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 25,
                }}>
                  {/* Guided message banner */}
                  <motion.div
                    key={guidedStep}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(59,130,246,0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 20,
                      padding: '6px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      letterSpacing: '.02em',
                    }}
                  >
                    {guidedStep === 1 && 'Alttaki parçayı sürükle ve ızgaraya bırak'}
                    {guidedStep === 2 && 'Bir satırı tamamen doldur'}
                    {guidedStep === 3 && 'İşte böyle! Flux ile yetenek kullanabilirsin'}
                  </motion.div>
                  
                  {/* Skip button */}
                  <button
                    onClick={() => useGameStore.getState().completeGuidedMode()}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 12,
                      background: 'rgba(255,255,255,0.08)',
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      padding: '4px 10px',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      fontWeight: 600,
                      letterSpacing: '.05em',
                    }}
                  >
                    ATLA
                  </button>
                </div>
              )}
            </main>

            {/* Piece Tray */}
            <div style={{ 
              height: `calc(var(--tray-height, 90px) + env(safe-area-inset-bottom, 0px))`,
              paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 4px)`,
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
            {gameMode !== GameMode.ZEN && <ComboBar />}
            
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
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getModeIcon(gameMode)}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">
                          Oyun Bitti
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          playClick();
                          resetGame();
                          setAppState(AppState.HOME);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Score Display with Count-Up Animation */}
                    <div className="text-center my-6">
                      <div 
                        className={clsx(
                          "text-4xl font-bold transition-colors duration-300",
                          isNewRecord ? "text-amber-400" : "text-white"
                        )}
                      >
                        {displayScore.toLocaleString()}
                      </div>
                      
                      {isNewRecord && showRecordBadge && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-amber-400 text-sm font-semibold"
                        >
                          🏆 Yeni Rekor!
                        </motion.div>
                      )}
                      
                      {!isNewRecord && highScore > 0 && (
                        <div className="mt-2 text-xs text-gray-400">
                          En iyinin %{Math.round((score / highScore) * 100)}'i
                        </div>
                      )}
                    </div>

                    {/* Stats Chips - Only show if not CAREER mode */}
                    {gameMode !== GameMode.CAREER && (
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                          <div className="text-sm font-bold text-blue-400">
                            {combo > 0 ? `x${combo}` : '--'}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Max Combo</div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                          <div className="text-sm font-bold text-purple-400">
                            {stats.linesCleared}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Satır</div>
                        </div>
                      </div>
                    )}

                    {/* Primary Action Button - Tekrar Oyna */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showButtons ? 1 : 0 }}
                      onClick={() => {
                        playClick();
                        initGame(gameMode);
                      }}
                      className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all active:scale-95"
                    >
                      Tekrar Oyna
                    </motion.button>

                    {/* Share Result Button */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showButtons ? 1 : 0 }}
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
                      className="w-full mt-2 py-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-semibold hover:bg-blue-500/20 transition-all"
                    >
                      {shareStatus === 'copied' ? '✓ Kopyalandı!' : shareStatus === 'shared' ? '✓ Paylaşıldı!' : '↗ Sonucu Paylaş'}
                    </motion.button>

                    {/* Mode Suggestion */}
                    {suggestion && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showButtons ? 1 : 0 }}
                        onClick={() => { playClick(); initGame(suggestion.mode); }}
                        className="w-full mt-2 py-2 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 text-left"
                      >
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-400">
                            {suggestion.label}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {suggestion.desc}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">→</div>
                      </motion.button>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Boss Intro Overlay */}
      <AnimatePresence>
        {showBossIntro && bossType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 65,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {bossType === 'ICE_STORM' ? '❄️' :
                 bossType === 'BOMB_RAIN' ? '💣' :
                 bossType === 'SPEED_SURGE' ? '⚡' :
                 bossType === 'DARKNESS' ? '🌑' : '🪞'}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#ef4444',
                letterSpacing: '-0.02em',
              }}>
                BOSS SEVİYE
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 8,
                maxWidth: 240,
                textAlign: 'center',
              }}>
                {bossType === 'ICE_STORM' ? 'Her 2 hamlede bir buz bloğu düşüyor!' :
                 bossType === 'BOMB_RAIN' ? 'Dikkat: Bombalar sahada!' :
                 bossType === 'SPEED_SURGE' ? 'Daha az hamle, aynı hedef!' :
                 bossType === 'DARKNESS' ? 'Parça renkleri gizli — şansına güven!' :
                 'Her yerleştirmede ayna parça da geliyor!'}
              </div>
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
              <h2 className="text-2xl font-bold text-white mb-4 text-center">{t('settings.title')}</h2>
              <p className="text-gray-400 text-xs text-center mb-6">{t('settings.themeDesc')}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { playClick(); setTheme('dark'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'dark' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)' }}></div>
                  <p className="text-white text-sm font-bold">{t('settings.dark')}</p>
                  <p className="text-gray-400 text-xs">{t('settings.darkSub')}</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('light'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'light' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)' }}></div>
                  <p className="text-white text-sm font-bold">{t('settings.light')}</p>
                  <p className="text-gray-400 text-xs">{t('settings.lightSub')}</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('neon'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'neon' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)' }}></div>
                  <p className="text-white text-sm font-bold">{t('settings.neon')}</p>
                  <p className="text-gray-400 text-xs">{t('settings.neonSub')}</p>
                </button>
                
                <button
                  onClick={() => { playClick(); setTheme('ocean'); }}
                  className={clsx(
                    "p-4 rounded-xl border-2 transition-all",
                    currentTheme === 'ocean' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-16 rounded-lg mb-2" style={{ background: 'linear-gradient(180deg, #0a1929 0%, #0c1821 100%)' }}></div>
                  <p className="text-white text-sm font-bold">{t('settings.ocean')}</p>
                  <p className="text-gray-400 text-xs">{t('settings.oceanSub')}</p>
                </button>
              </div>

              {/* Language Selection */}
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textAlign: 'center' }}>
                  {t('settings.language')}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['tr', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => { playClick(); changeLanguage(lang); }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${i18n.language === lang ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: i18n.language === lang ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                        color: i18n.language === lang ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {lang === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => { playClick(); setShowThemeSelector(false); }}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
              >
                {t('settings.confirm')}
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