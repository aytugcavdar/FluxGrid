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
import { LeaderboardView } from '../features/leaderboard/components/LeaderboardView';
import { HomeScreen } from './HomeScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@utils/shareResult';
import { getStreak, getDailyPlayedToday, getDayNumber } from '@utils/streakManager';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AppState, GameMode } from '@shared/types';
import { X, User } from 'lucide-react';
import { useCountUp } from '@shared/hooks/useCountUp';
import { initializeFirebase } from '../services/firebase/config';
import { useAuthStore } from '../features/auth/store/authStore';

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
    [GameMode.TIMED]: '⚡',
    [GameMode.SURVIVAL]: '🛡️',
    [GameMode.ZEN]: '☁️',
    [GameMode.CAREER]: '🎯',
    [GameMode.DAILY_CHALLENGE]: '📅',
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<GameMode>(GameMode.ENDLESS);
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
  
  // History management refs
  const isHandlingPopState = useRef(false);
  const historyDepth = useRef(0);
  
  // PWA Install Prompt
  const deferredPromptRef = useRef<any>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
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
    // Initialize Firebase
    initializeFirebase();
    
    // Initialize auth
    useAuthStore.getState().initAuth();
    
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

  // Warn before closing/refreshing if game is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (appState === AppState.GAME && !isGameOver) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but setting returnValue triggers the dialog
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appState, isGameOver]);

  // PWA Install Prompt - Capture beforeinstallprompt event
  useEffect(() => {
    // Check if already installed
    const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
    if (pwaInstalled) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For iOS, check if already in standalone mode
    if (isIOSDevice) {
      const isStandalone = (navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        localStorage.setItem('pwa_installed', 'true');
        return;
      }
    }

    // For non-iOS, capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      console.log('PWA install prompt captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Show PWA prompt on game over with good score
  useEffect(() => {
    if (isGameOver && score > 1000) {
      const pwaInstalled = localStorage.getItem('pwa_installed') === 'true';
      const iosInstructionsShown = localStorage.getItem('ios_pwa_instructions_shown') === 'true';
      
      if (!pwaInstalled) {
        if (isIOS && !iosInstructionsShown) {
          // Show iOS instructions once
          setTimeout(() => setShowIOSInstructions(true), 1500);
        } else if (deferredPromptRef.current) {
          // Show PWA install button for non-iOS
          setTimeout(() => setShowPWAPrompt(true), 1500);
        }
      }
    } else {
      setShowPWAPrompt(false);
      setShowIOSInstructions(false);
    }
  }, [isGameOver, score, isIOS]);

  useEffect(() => {
    // We don't call initGame() here anymore to allow starting on the HOME screen.
    const handleFirstTouch = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstTouch);
    };
    window.addEventListener('pointerdown', handleFirstTouch);
    return () => window.removeEventListener('pointerdown', handleFirstTouch);
  }, []);

  // Sync game data to Firebase when game ends
  useEffect(() => {
    if (isGameOver && score > 0) {
      const user = useAuthStore.getState().user;
      if (user) {
        // Import sync functions dynamically to avoid circular deps
        import('../services/firebase/syncManager').then(({ syncScore, syncGameData }) => {
          // Sync score to leaderboard
          syncScore(
            user.uid,
            gameMode,
            score,
            user.displayName || 'Anonymous',
            user.photoURL || null
          ).catch(err => console.error('Failed to sync score:', err));

          // Sync game stats
          const gameData = {
            highScores: { [gameMode]: score },
            totalGamesPlayed: stats.gamesPlayed,
            lastSeenAt: Date.now(),
          };
          syncGameData(user.uid, gameData).catch(err => console.error('Failed to sync game data:', err));
        });
      }
    }
  }, [isGameOver, score, gameMode, stats.gamesPlayed]);

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
        // 'blitz': removed - integrated into TIMED mode
        // 'survival': hidden from UI but kept for future
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
    // Initialize history state with depth tracking
    if (!window.history.state) {
      window.history.replaceState({ depth: 0, appState: AppState.HOME }, '');
      historyDepth.current = 0;
    } else if (window.history.state.depth !== undefined) {
      historyDepth.current = window.history.state.depth;
    }
  }, []);

  // Push state when appState changes (except HOME)
  useEffect(() => {
    if (appState !== AppState.HOME) {
      historyDepth.current += 1;
      window.history.pushState({ depth: historyDepth.current, appState }, '');
    } else {
      // When returning to HOME, reset depth
      historyDepth.current = 0;
      window.history.replaceState({ depth: 0, appState: AppState.HOME }, '');
    }
  }, [appState]);

  // Listen to popstate (back button)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent re-entrant handling
      if (isHandlingPopState.current) return;
      isHandlingPopState.current = true;
      
      try {
        // If in GAME state, show confirmation dialog
        if (appState === AppState.GAME && !isGameOver) {
          const confirmed = window.confirm(t('game.confirmExit'));
          if (confirmed) {
            setAppState(AppState.HOME);
          } else {
            // User cancelled, push state back
            window.history.pushState({ depth: historyDepth.current, appState: AppState.GAME }, '');
          }
        } else {
          // Navigate back to previous state or HOME
          const targetState = event.state?.appState || AppState.HOME;
          const targetDepth = event.state?.depth ?? 0;
          historyDepth.current = targetDepth;
          setAppState(targetState);
        }
      } finally {
        // Reset flag after a short delay to allow state updates
        setTimeout(() => {
          isHandlingPopState.current = false;
        }, 100);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [appState, isGameOver, setAppState, t]);

  // Global Timer Loop
  useEffect(() => {
    if ((gameMode !== GameMode.TIMED && gameMode !== GameMode.ZEN && gameMode !== GameMode.SURVIVAL) || appState !== AppState.GAME || isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [gameMode, appState, isGameOver, tickTimer]);

  // Play game over sound and replace history state
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      playGameOver();
      
      // Replace history state to prevent back button from going to mid-game state
      window.history.replaceState({ depth: historyDepth.current, appState: AppState.GAME }, '');
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

  // Time popups for TIMED mode (removed BLITZ)
  // Note: BLITZ mechanics can be integrated into TIMED mode with a speed parameter in the future

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
          <HomeScreen
            onOpenProfile={() => setShowProfile(true)}
            onOpenThemeSelector={() => setShowThemeSelector(true)}
            onOpenLeaderboard={(mode) => { setLeaderboardMode(mode); setShowLeaderboard(true); }}
          />
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
                onClick={() => { playClick(); initGame(GameMode.DAILY_CHALLENGE); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-amber-600/10 hover:border-amber-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.dailyChallenge')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.dailyChallengeSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">📅</div>
              </button>

              {/* BLITZ mode removed - mechanics can be integrated into TIMED mode with speed parameter */}
              
              {/* ZEN mode hidden - can be re-enabled in future */}
              {/* <button
                onClick={() => { playClick(); initGame(GameMode.ZEN); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.zen')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.zenSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">☁️</div>
              </button> */}
              
              {/* SURVIVAL mode hidden for future use - uncomment to re-enable */}
              {/* <button
                onClick={() => { playClick(); initGame(GameMode.SURVIVAL); }}
                className="group relative w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-gray-600/10 hover:border-gray-500/30 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="block text-xl font-black text-white italic tracking-tight mb-1">{t('modes.survival')}</span>
                  <span className="block text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('modes.survivalSub')}</span>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl opacity-20 group-hover:opacity-100 transition-opacity">💀</div>
              </button> */}

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
        {showProfile && <ProfileView onClose={() => setShowProfile(false)} onOpenLeaderboard={(mode) => { setShowProfile(false); setLeaderboardMode(mode); setShowLeaderboard(true); }} />}
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-gray-900 overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 px-6 py-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { playClick(); setShowLeaderboard(false); }}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight italic uppercase">LİDERLİK TABLOSU</h1>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{leaderboardMode}</p>
                </div>
              </div>
            </div>
            <LeaderboardView mode={leaderboardMode} />
          </motion.div>
        )}
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
                // Mode suggestions (BLITZ removed, SURVIVAL hidden)
                const MODE_SUGGESTIONS: Record<string, { mode: GameMode; label: string; desc: string }> = {
                  [GameMode.ENDLESS]: { mode: GameMode.TIMED, label: 'Rush\'ı dene', desc: '60 saniye, satır başı süre' },
                  [GameMode.TIMED]: { mode: GameMode.ZEN, label: 'Zen\'i dene', desc: 'Stressiz, sakin oyun' },
                  [GameMode.ZEN]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Skor kovalama modu' },
                  [GameMode.CAREER]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Kariyer arası dinlenme' },
                  [GameMode.DAILY_CHALLENGE]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Bugünlük bitmedi' },
                  [GameMode.SURVIVAL]: { mode: GameMode.ENDLESS, label: 'Sonsuz\'u dene', desc: 'Klasik mod' },
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

                    {/* Share Preview - Emoji Grid */}
                    {gameMode === GameMode.DAILY_CHALLENGE && dailyClearHistory.length > 0 && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 text-center">
                          Paylaşım Önizleme
                        </div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: 18,
                          textAlign: 'center',
                          letterSpacing: 4,
                          lineHeight: 1.3
                        }}>
                          {generateShareText(score, gameMode, combo, surgeWasUsed, dailyClearHistory)
                            .split('\n')
                            .slice(2, -2)
                            .map((line, i) => (
                              <div key={i}>{line || '\u00A0'}</div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Stats Chips - Only show if not CAREER mode */}
                    {gameMode !== GameMode.CAREER && stats && (
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                          <div className="text-sm font-bold text-blue-400">
                            {combo > 0 ? `x${combo}` : '--'}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Max Combo</div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-lg py-2 px-3">
                          <div className="text-sm font-bold text-purple-400">
                            {stats.linesCleared || 0}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">Satır</div>
                        </div>
                      </div>
                    )}

                    {/* Best Score Comparison */}
                    {!isNewRecord && highScore > 0 && score > 0 && (
                      <div className="mb-4 p-3 bg-white/5 rounded-lg text-center">
                        <div className="text-xs text-gray-400 mb-1">
                          Rekoruna %{Math.round((score / highScore) * 100)} yaklaştın
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((score / highScore) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          />
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

                    {/* PWA Install Prompt - Non-iOS */}
                    {showPWAPrompt && deferredPromptRef.current && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={async () => {
                          playClick();
                          const prompt = deferredPromptRef.current;
                          if (prompt) {
                            prompt.prompt();
                            const { outcome } = await prompt.userChoice;
                            if (outcome === 'accepted') {
                              localStorage.setItem('pwa_installed', 'true');
                              setShowPWAPrompt(false);
                            }
                            deferredPromptRef.current = null;
                          }
                        }}
                        className="w-full mt-3 py-2 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <div className="text-lg">📱</div>
                        <div className="flex-1 text-left">
                          <div className="text-xs font-semibold text-blue-400">
                            Ana Ekrana Ekle
                          </div>
                          <div className="text-[10px] text-blue-400/60">
                            Hızlı erişim için
                          </div>
                        </div>
                      </motion.button>
                    )}

                    {/* iOS PWA Instructions */}
                    {showIOSInstructions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-lg border border-blue-500/30 bg-blue-500/10 text-left"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="text-lg">📱</div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-blue-400 mb-1">
                              Ana Ekrana Ekle
                            </div>
                            <div className="text-[10px] text-blue-400/80 leading-relaxed">
                              Safari'de <span className="font-bold">Paylaş</span> butonuna bas, sonra <span className="font-bold">Ana Ekrana Ekle</span>'yi seç
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              localStorage.setItem('ios_pwa_instructions_shown', 'true');
                              setShowIOSInstructions(false);
                            }}
                            className="text-blue-400/60 hover:text-blue-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
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
                 bossType === 'SPEED_SURGE' ? `Sadece ${Math.floor((useGameStore.getState().movesLeft || 20) / 2)} hamlen var!` :
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