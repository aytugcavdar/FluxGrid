import React, { useEffect, useState, useRef } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { useGameStore } from '../features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useAbilityStore } from '../features/abilities/store/abilityStore';
import { usePassiveAbilityStore } from '../features/abilities/store/passiveAbilityStore';
import { useProfileStore } from '../features/profile/store/profileStore';
import { DragOverlay } from '@features/hud';
import { AbilityPanel } from '../features/abilities/components/AbilityPanel';
import { ProfileView } from '../features/profile/components/ProfileView';
import { LeaderboardView } from '../features/leaderboard/components';
import { HomeScreen } from './HomeScreen';
import { GameOverModal, GameScreen } from './components';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAudio, playGameOver, playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@utils/shareResult';
import { startHeartbeat, stopHeartbeat } from '@utils/heartbeat';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { AppState, GameMode } from '@shared/types';
import { X } from 'lucide-react';
import { useCountUp } from '@shared/hooks/useCountUp';
import { initializeFirebase } from '../services/firebase/config';
import { useAuthStore } from '../features/auth/store/authStore';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useGameSync } from '../features/game/hooks/useGameSync';
import { TIER_SCORE_MULTIPLIERS } from '../features/game/constants';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface TimePopup {
  id: number;
  value: number;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction, isSurgeActive,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft,
    dailyClearHistory, highScore, stats, highScores,
    activeSkill, activateSkill,
    maxCombo, chronoBonus, timedBoostMovesLeft, finalSprintBonus
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const [showAbilities, setShowAbilities] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<GameMode>(GameMode.ENDLESS);
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
  const [milestoneTier, setMilestoneTier] = useState<{ tier: number; tierName: string; multiplier: number } | null>(null);
  const [timePopups, setTimePopups] = useState<TimePopup[]>([]);
  const timePopupIdRef = useRef(0);
  const prevTimeLeftRef = useRef(timeLeft);
  const [timedWarning, setTimedWarning] = useState<'30sn' | '10sn' | null>(null);
  const prevComboRef = useRef(combo);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [surgeWasUsed, setSurgeWasUsed] = useState(false);
  
  // COMBO RUSH state'leri
  const [showRushStart, setShowRushStart] = useState(false);
  const [showRushEnd, setShowRushEnd] = useState(false);
  const prevRushMovesRef = useRef(timedBoostMovesLeft);
  
  // Score display animation state
  const displayScore = useCountUp(score, 600, isGameOver);
  const currentModeHighScore = highScores[gameMode] || 0;
  const isNewRecord = score > 0 && score >= currentModeHighScore;
  const [showRecordBadge, setShowRecordBadge] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Grid sizing with ResizeObserver for safe area compatibility
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState(0);
  
  // Custom hooks
  useBrowserHistory();
  const { showPWAPrompt, showIOSInstructions, setShowIOSInstructions, triggerInstall } = usePWAInstall(isGameOver, score);
  useGameSync();



  // Initialize stores on mount
  useEffect(() => {
    // Clean up deprecated localStorage keys
    import('../utils/cleanupLocalStorage').then(({ cleanupDeprecatedKeys }) => {
      cleanupDeprecatedKeys();
    });

    // Initialize Firebase
    initializeFirebase();
    
    // Config kontrolü — initializeFirebase'den hemen sonra
    import('../services/firebase/configService').then(({ getAppConfig, isMaintenanceMode }) => {
      getAppConfig().then(config => {
        if (isMaintenanceMode(config)) {
          // Bakım modunu store veya state'e aktar
          // Şimdilik console.warn yeterli, ileride UI eklenebilir
          console.warn('App is in maintenance mode:', config?.maintenanceMessage);
        }
      });
    });
    
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

    // Cleanup on unmount
    return () => {
      useAuthStore.getState().cleanup();
    };
  }, []);

  // Heartbeat management
  useEffect(() => {
    const { user } = useAuthStore.getState();
    if (user) {
      startHeartbeat(user.uid);
    }

    // Auth store değişikliklerini dinle
    const unsub = useAuthStore.subscribe((state) => {
      if (state.user) {
        startHeartbeat(state.user.uid);
      } else {
        stopHeartbeat();
      }
    });

    return () => {
      stopHeartbeat();
      unsub();
    };
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

  // Global Timer Loop
  useEffect(() => {
    if ((gameMode !== GameMode.TIMED && gameMode !== GameMode.ZEN) || appState !== AppState.GAME || isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 250); // 250ms for more accurate timer updates
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
      const tier = lastAction.tier ?? 0;
      const tierName = lastAction.tierName ?? '';
      const multiplier = TIER_SCORE_MULTIPLIERS[tier] ?? 1.0;
      
      setMilestoneTier({ tier, tierName, multiplier });
      setTimeout(() => setMilestoneTier(null), 2500);
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

  // 30 second warning for TIMED mode
  // TIMED mode warnings: 30 second and 10 second
  useEffect(() => {
    if (gameMode === GameMode.TIMED) {
      // 30 second warning
      if (timeLeft === 30 && prevTimeLeftRef.current === 31) {
        setTimedWarning('30sn');
        setTimeout(() => setTimedWarning(null), 2500);
      }
      // 10 second warning
      if (timeLeft === 10 && prevTimeLeftRef.current === 11) {
        setTimedWarning('10sn');
        setTimeout(() => setTimedWarning(null), 2000);
      }
    }
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, gameMode]);

  // Combo break penalty visual feedback for TIMED mode
  useEffect(() => {
    if (gameMode === GameMode.TIMED && prevComboRef.current > 0 && combo === 0) {
      // Show -1 second popup
      setTimePopups(prev => [...prev, {
        id: timePopupIdRef.current++,
        value: -1,
        x: Math.random() * 60 + 20, // Random x position 20-80%
        y: 30
      }]);
    }
    prevComboRef.current = combo;
  }, [combo, gameMode]);

  // COMBO RUSH başlangıç ve bitiş efektleri
  useEffect(() => {
    if (gameMode !== GameMode.TIMED) return;
    
    // RUSH başladı (0'dan > 0'a geçti)
    if (prevRushMovesRef.current === 0 && timedBoostMovesLeft > 0) {
      setShowRushStart(true);
      setTimeout(() => setShowRushStart(false), 1500);
    }
    
    // RUSH bitti (1'den 0'a düştü)
    if (prevRushMovesRef.current === 1 && timedBoostMovesLeft === 0) {
      setShowRushEnd(true);
      setTimeout(() => setShowRushEnd(false), 300);
    }
    
    prevRushMovesRef.current = timedBoostMovesLeft;
  }, [timedBoostMovesLeft, gameMode]);

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

        {appState === AppState.GAME && (
          <GameScreen
            pieces={pieces}
            combo={combo}
            gameMode={gameMode}
            activeSkill={activeSkill}
            activateSkill={activateSkill}
            gridContainerRef={gridContainerRef}
            gridSize={gridSize}
            scorePopups={scorePopups}
            showSurgeFlash={showSurgeFlash}
            showRushStart={showRushStart}
            showRushEnd={showRushEnd}
            timedBoostMovesLeft={timedBoostMovesLeft}
            timePopups={timePopups}
            setTimePopups={setTimePopups}
            timedWarning={timedWarning}
            shownChain={shownChain}
            showPerfect={showPerfect}
            milestoneTier={milestoneTier}
          />
        )}
      </AnimatePresence>

      {/* Persistence and Global Overlays */}
      <DragOverlay />
      <AnimatePresence>
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
        {unlockedAchievementId && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-gray-900 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 max-w-[90vw] sm:min-w-[280px]"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 rounded-full flex items-center justify-center text-lg sm:text-xl flex-shrink-0">🏅</div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">Başarım Açıldı!</span>
              <span className="font-bold text-sm sm:text-base truncate">{achievements.find(a => a.id === unlockedAchievementId)?.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <GameOverModal
          isGameOver={isGameOver}
          score={score}
          displayScore={displayScore}
          highScore={highScore}
          currentModeHighScore={currentModeHighScore}
          isNewRecord={isNewRecord}
          showRecordBadge={showRecordBadge}
          showButtons={showButtons}
          gameMode={gameMode}
          combo={combo}
          maxCombo={maxCombo}
          chronoBonus={chronoBonus}
          finalSprintBonus={finalSprintBonus}
          stats={stats}
          surgeWasUsed={surgeWasUsed}
          dailyClearHistory={dailyClearHistory}
          shareStatus={shareStatus}
          showPWAPrompt={showPWAPrompt}
          showIOSInstructions={showIOSInstructions}
          onClose={() => {
            resetGame();
            setAppState(AppState.HOME);
          }}
          onPlayAgain={() => initGame(gameMode)}
          onTryMode={(mode) => initGame(mode)}
          onShare={async () => {
            const text = generateShareText(score, gameMode, combo, surgeWasUsed, dailyClearHistory);
            const result = await shareResult(text);
            setShareStatus(result === 'failed' ? 'idle' : result === 'shared' ? 'shared' : 'copied');
            if (result !== 'failed') {
              setTimeout(() => setShareStatus('idle'), 2000);
            }
          }}
          onInstallPWA={triggerInstall}
          onCloseIOSInstructions={() => {
            localStorage.setItem('ios_pwa_instructions_shown', 'true');
            setShowIOSInstructions(false);
          }}
        />
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