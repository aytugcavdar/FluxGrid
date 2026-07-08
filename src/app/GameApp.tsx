import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useThemeStore, type ThemeType } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useTutorialStore } from '../features/tutorial/store/tutorialStore';
import { GameMode, AppState } from '@shared/types';
import { useCountUp } from '@shared/hooks/useCountUp';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useGameSync } from '../features/game/hooks/useGameSync';
import { useUnifiedNavigationStore } from '../shared/store/unifiedNavigationStore';
import { hapticEvents, unlockAudio, playGameOver, playClick } from '@utils/audio';
import { AdManager } from '@core/services/ads/AdManager';
import { createRewardedContinueState } from '@features/game/utils/game/reviveService';
import { GameScreen } from './components/GameScreen';
import { DragOverlay } from '../features/hud/components/DragOverlay';
import { ExitConfirmDialog } from '../shared/components/ExitConfirmDialog';
import { generateShareText, shareResult } from '../utils/sharing/shareResult';
import { ErrorBoundary } from './ErrorBoundary';
import { initializePerformanceSystem } from '@features/performance';
import { usePerformanceStore } from '@features/performance/store/performanceStore';
import { detectDeviceCapabilities } from '@utils/platform/deviceCapability';
import { initializeTutorialSystem, handleGameEnd } from '@features/tutorial';

// Lazy load modals for better initial bundle size
const ContinueModal = lazy(() => import('./components/ContinueModal').then(m => ({ default: m.ContinueModal })));
const GameOverModal = lazy(() => import('./components/GameOverModal').then(m => ({ default: m.GameOverModal })));
const AchievementNotification = lazy(() => import('../features/achievements/components/AchievementNotification').then(m => ({ default: m.AchievementNotification })));

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

type AppLanguage = 'tr' | 'en' | 'de' | 'fr' | 'es';

const GAME_APP_LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string }> = [
  { code: 'tr', label: 'TR Turkce' },
  { code: 'en', label: 'EN English' },
  { code: 'de', label: 'DE Deutsch' },
  { code: 'fr', label: 'FR Francais' },
  { code: 'es', label: 'ES Espanol' },
];

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, timeLeft,
    dailyClearHistory, highScore, stats, highScores,
    maxCombo, timedBoostMovesLeft, finalSprintBonus, timedScoreBreakdown, difficultyTier, tierStartMove, totalMovesPlayed, grid,
    newRecordDiff, gameLogs,
    timerStartTime, timerExpectedEnd, comboTimerStartTime, comboTimerDuration,
    finalizeGameOver, markReviveUsed, reviveUsedThisRun
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors, getPieceColors } = useThemeStore();
  const colors = getThemeColors();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [prevGameOver, setPrevGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const prevScoreRef = useRef(0);
  const popupIdRef = useRef(0);
  const [shownChain, setShownChain] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [showSurgeFlash, setShowSurgeFlash] = useState(false);
  const lastActionRef = useRef<typeof lastAction>(null);
  const prevComboRef = useRef(combo);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [surgeWasUsed, setSurgeWasUsed] = useState(false);
  
  // Save gameMode when game over happens to prevent mode switching bug
  const [gameOverMode, setGameOverMode] = useState<GameMode>(gameMode);
  
  // Enhanced visual feedback states
  const [showComboMilestone, setShowComboMilestone] = useState(false);
  const [lineCountToShow, setLineCountToShow] = useState(0);
  const [showLineCount, setShowLineCount] = useState(false);
  
  // Event start visual state
  const activeEvent = useGameStore(state => state.activeEvent);
  const [eventStartVisual, setEventStartVisual] = useState<typeof activeEvent>(null);
  const prevActiveEventRef = useRef<typeof activeEvent>(null);
  
  // Score display animation state
  const displayScore = useCountUp(score, 450, isGameOver);
  
  // Memoize expensive score calculations (Requirement 1.5)
  const currentModeHighScore = useMemo(() => highScores[gameMode] || 0, [highScores, gameMode]);
  const isNewRecord = useMemo(() => score > 0 && score >= currentModeHighScore, [score, currentModeHighScore]);
  const todayBestCombo = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (gameLogs || []).reduce((best, log) => {
      const logDay = new Date(log.timestamp).toISOString().slice(0, 10);
      return logDay === today ? Math.max(best, log.maxCombo || 0) : best;
    }, maxCombo || 0);
  }, [gameLogs, maxCombo]);
  const tierMovesSurvived = useMemo(() => {
    if (gameMode !== GameMode.ENDLESS) return 0;
    if (difficultyTier <= 0) return totalMovesPlayed || 0;
    return Math.max(1, (totalMovesPlayed || 0) - (tierStartMove || 0));
  }, [difficultyTier, gameMode, tierStartMove, totalMovesPlayed]);
  const canUseRewardedContinue = useMemo(
    () => gameMode !== GameMode.TIMED && !reviveUsedThisRun && AdManager.canShowRewardedContinue(),
    [gameMode, reviveUsedThisRun]
  );
  const [showRecordBadge, setShowRecordBadge] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Grid sizing with ResizeObserver for safe area compatibility
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [gridSize, setGridSize] = useState(0);
  
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
  
  // Continue feature state
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueUsesRemaining, setContinueUsesRemaining] = useState(3);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const continueRequestIdRef = useRef(0);
  
  // Custom hooks
  const { showPWAPrompt, showIOSInstructions, setShowIOSInstructions, triggerInstall } = usePWAInstall(isGameOver, score);
  useGameSync();
  
  // Get exit dialog state from useBrowserHistory
  const browserHistory = useBrowserHistory();
  const {
    showExitDialog,
    handleConfirm: handleExitConfirm,
    handleCancel: handleExitCancel,
    requestGameExit,
  } = browserHistory;

  // Memoized event handlers for performance
  const handlePlayAgain = useCallback(() => {
    initGame(gameOverMode);
  }, [gameOverMode, initGame]);


  const handleClose = useCallback(() => {
    resetGame();
    setAppState(AppState.MODES);
  }, [resetGame, setAppState]);

  const handleTryMode = useCallback((mode: GameMode) => {
    initGame(mode);
  }, [initGame]);

  const handleShare = useCallback(async () => {
    const text = generateShareText(score, gameOverMode, combo, surgeWasUsed, dailyClearHistory);
    const result = await shareResult(text);
    setShareStatus(result === 'failed' ? 'idle' : result === 'shared' ? 'shared' : 'copied');
    if (result !== 'failed') {
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  }, [score, gameOverMode, combo, surgeWasUsed, dailyClearHistory]);

  const handleCloseIOSInstructions = useCallback(() => {
    localStorage.setItem('ios_pwa_instructions_shown', 'true');
    setShowIOSInstructions(false);
  }, [setShowIOSInstructions]);

  const handleThemeChange = useCallback((theme: ThemeType) => {
    playClick();
    setTheme(theme);
  }, [setTheme]);

  const handleLanguageChange = useCallback((lang: AppLanguage) => {
    playClick();
    i18n.changeLanguage(lang);
    localStorage.setItem('flux_language', lang);
  }, [i18n]);

  const handleThemeSelectorClose = useCallback(() => {
    playClick();
    setShowThemeSelector(false);
  }, []);

  const handleThemeSelectorBackdropClick = useCallback(() => {
    setShowThemeSelector(false);
  }, []);

  const handleModalContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);



  // Memoized event handler for tutorial completion
  const handleTutorialReturnHome = useCallback(() => {
    resetGame();
    setAppState(AppState.HOME);
  }, [resetGame, setAppState]);

  // Initialize stores on mount
  useEffect(() => {
    // Note: Splash is already dismissed by index.tsx for menu
    // No need to dismiss again here
    
    // Initialize performance monitoring system
    // Will check localStorage for production enablement
    const cleanupPerformance = initializePerformanceSystem();
    
    // Listen for localStorage changes to re-initialize if enabled in production
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'enablePerformanceOverlay' && e.newValue === 'true') {
        console.log('[GameApp] Performance overlay enabled, reinitializing...');
        // Cleanup old and reinitialize
        cleanupPerformance();
        initializePerformanceSystem();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // DON'T initialize tutorial here - it should only start when game starts
    // Tutorial will be initialized in initGame() when user actually starts playing
    
    // Listen for tutorial completion to return to home
    window.addEventListener('tutorial-return-home', handleTutorialReturnHome);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tutorial-return-home', handleTutorialReturnHome);
      cleanupPerformance();
    };
  }, [handleTutorialReturnHome]);



  // Memoized event handler for beforeunload
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (appState === AppState.GAME && !isGameOver) {
      // Save game before closing
      useGameStore.getState().saveCurrentGame();
      
      e.preventDefault();
      // Modern browsers ignore custom messages, but setting returnValue triggers the dialog
      e.returnValue = '';
    }
  }, [appState, isGameOver]);

  // Warn before closing/refreshing if game is in progress
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);

  // Memoized event handler for visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && appState === AppState.GAME && !isGameOver) {
      // App going to background, save game
      console.log('[GameApp] App going to background, saving game...');
      useGameStore.getState().saveCurrentGame();
    }
  }, [appState, isGameOver]);

  // Auto-save when app goes to background (mobile)
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  // Memoized event handler for pause event
  const handlePause = useCallback(() => {
    if (appState === AppState.GAME && !isGameOver) {
      console.log('[GameApp] App paused, saving game...');
      useGameStore.getState().saveCurrentGame();
    }
  }, [appState, isGameOver]);

  // Auto-save on pause event (Capacitor/Cordova)
  useEffect(() => {
    document.addEventListener('pause', handlePause);
    return () => document.removeEventListener('pause', handlePause);
  }, [handlePause]);

  // Memoized event handler for first touch (audio unlock)
  const handleFirstTouch = useCallback(() => {
    unlockAudio();
    window.removeEventListener('pointerdown', handleFirstTouch);
  }, []);

  useEffect(() => {
    let active = true;
    detectDeviceCapabilities().then(capabilities => {
      if (!active) return;
      usePerformanceStore.getState().updateDeviceInfo({
        tier: capabilities.tier,
        model: capabilities.deviceModel,
        score: capabilities.score,
        gpu: capabilities.gpuRenderer,
        native: capabilities.isNative,
      });
    }).catch(error => {
      console.warn('[GameApp] Device capability detection failed:', error);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // We don't call initGame() here anymore to allow starting on the HOME screen.
    window.addEventListener('pointerdown', handleFirstTouch);
    return () => window.removeEventListener('pointerdown', handleFirstTouch);
  }, [handleFirstTouch]);

  // URL parameter handling for shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode) {
      const modeMap: Record<string, GameMode> = {
        'endless': GameMode.ENDLESS,
        'daily': GameMode.DAILY_CHALLENGE,
        'timed': GameMode.TIMED,
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

  // Align updates to visible second boundaries instead of waking React four times per second.
  useEffect(() => {
    if (appState !== AppState.GAME || isGameOver || gameMode !== GameMode.TIMED) return;
    let timeoutId: number | null = null;
    let stopped = false;

    const runTick = () => {
      const current = useGameStore.getState();
      if (
        stopped ||
        current.appState !== AppState.GAME ||
        current.isGameOver ||
        current.gameMode !== GameMode.TIMED
      ) return;

      current.tickTimer();

      const next = useGameStore.getState();
      if (next.isGameOver || !next.timerExpectedEnd) return;

      const remainingMs = Math.max(0, next.timerExpectedEnd - Date.now());
      const boundaryDelay = remainingMs % 1000;
      const delay = Math.max(50, boundaryDelay === 0 ? 1000 : boundaryDelay) + 16;
      timeoutId = window.setTimeout(runTick, delay);
    };

    runTick();
    return () => {
      stopped = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [gameMode, appState, isGameOver, timerExpectedEnd]);

  // Every mode only needs one state update when the combo actually expires.
  useEffect(() => {
    if (
      appState !== AppState.GAME ||
      isGameOver ||
      combo <= 0 ||
      comboTimerStartTime === null
    ) return;

    const remainingMs = Math.max(
      0,
      comboTimerStartTime + comboTimerDuration - Date.now()
    );
    const timeoutId = window.setTimeout(() => {
      const current = useGameStore.getState();
      if (current.comboTimerStartTime !== comboTimerStartTime || current.combo <= 0) return;
      useGameStore.setState({
        combo: 0,
        comboTimerStartTime: null,
        comboTimeLeft: 0,
      });
    }, remainingMs + 16);

    return () => window.clearTimeout(timeoutId);
  }, [appState, combo, comboTimerDuration, comboTimerStartTime, isGameOver]);

  // Play game over sound + haptic
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      playGameOver();
      hapticEvents.gameOver();
      setGameOverMode(gameMode);
      handleGameEnd();
    }
    setPrevGameOver(isGameOver);
  }, [isGameOver, gameMode]);

  // Show continue modal when game over and continue is available
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      if (canUseRewardedContinue) {
        setShowContinueModal(true);
        setContinueUsesRemaining(AdManager.getRewardedContinueRemaining());
      } else {
        finalizeGameOver();
      }
    }
  }, [canUseRewardedContinue, finalizeGameOver, isGameOver, prevGameOver]);

  // Handle continue feature
  const handleContinue = useCallback(async () => {
    console.log('[GameApp] handleContinue called');

    if (gameMode === GameMode.TIMED) {
      setShowContinueModal(false);
      finalizeGameOver();
      return;
    }
    
    // CRITICAL: Prevent multiple clicks
    if (isLoadingAd) {
      console.log('[GameApp] Already loading ad, ignoring click');
      return;
    }
    
    // Set loading state immediately to prevent rapid clicks
    setIsLoadingAd(true);
    const requestId = continueRequestIdRef.current + 1;
    continueRequestIdRef.current = requestId;
    
    // Small delay to ensure state update propagates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('[GameApp] Calling AdManager.showRewardedContinue()...');
      const result = await AdManager.showRewardedContinue();
      
      console.log('[GameApp] Rewarded ad result:', result);

      if (continueRequestIdRef.current !== requestId) {
        console.log('[GameApp] Stale rewarded continue result ignored');
        return;
      }
      
      if (result.success) {
        console.log('[GameApp] Ad successful, continuing game...');

        markReviveUsed();
        
        useGameStore.setState(createRewardedContinueState({
          grid,
          gameMode,
          difficultyTier,
          timerStartTime,
          pieceColors: useThemeStore.getState().getPieceColors(),
        }));
        
        setShowContinueModal(false);
        setIsLoadingAd(false);
        console.log('[GameApp] Game continued successfully!');
      } else {
        // Ad failed, show game over modal
        console.log('[GameApp] Ad failed:', result.error);
        setShowContinueModal(false);
        setIsLoadingAd(false);
        finalizeGameOver();
      }
    } catch (error) {
      console.error('[GameApp] Continue failed:', error);
      setShowContinueModal(false);
      setIsLoadingAd(false);
      finalizeGameOver();
    }
  }, [difficultyTier, finalizeGameOver, gameMode, grid, isLoadingAd, markReviveUsed, timerStartTime]);

  const handleDecline = useCallback(() => {
    continueRequestIdRef.current += 1;
    setShowContinueModal(false);
    setIsLoadingAd(false);
    finalizeGameOver();
  }, [finalizeGameOver]);

  const handleNativeBack = useCallback(() => {
    if (showThemeSelector) {
      setShowThemeSelector(false);
      return true;
    }

    if (showIOSInstructions) {
      handleCloseIOSInstructions();
      return true;
    }

    if (showExitDialog) {
      handleExitCancel();
      return true;
    }

    if (showContinueModal) {
      if (!isLoadingAd) {
        handleDecline();
      }
      return true;
    }

    if (isGameOver) {
      handleClose();
      return true;
    }

    if (appState === AppState.GAME) {
      requestGameExit();
      return true;
    }

    if (appState !== AppState.HOME) {
      setAppState(AppState.HOME);
      return true;
    }

    return false;
  }, [
    appState,
    handleClose,
    handleCloseIOSInstructions,
    handleDecline,
    handleExitCancel,
    isGameOver,
    isLoadingAd,
    requestGameExit,
    setAppState,
    showContinueModal,
    showExitDialog,
    showIOSInstructions,
    showThemeSelector,
  ]);

  useEffect(() => {
    const setNativeBackHandler = useUnifiedNavigationStore.getState().setNativeBackHandler;
    setNativeBackHandler(handleNativeBack);

    return () => {
      const navigationStore = useUnifiedNavigationStore.getState();
      if (navigationStore.nativeBackHandler === handleNativeBack) {
        navigationStore.setNativeBackHandler(null);
      }
    };
  }, [handleNativeBack]);

  // Score popup on score change
  useEffect(() => {
    if (score > prevScoreRef.current && prevScoreRef.current > 0) {
      const diff = score - prevScoreRef.current;
      const id = popupIdRef.current++;
      setScorePopups(prev => [...prev.slice(-3), { id, value: diff, combo }]);
      const timer = setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== id));
      }, 1200);
      return () => clearTimeout(timer);
    }
    prevScoreRef.current = score;
  }, [score, combo]);

  // Zincir + Renk bonusu
  useEffect(() => {
    if (!lastAction || lastAction === lastActionRef.current) return;
    lastActionRef.current = lastAction;
    
    // Tutorial validation events
    if (lastAction.type === 'PLACE') {
      window.dispatchEvent(new CustomEvent('tutorial-validation', {
        detail: { type: 'piece_placed' }
      }));
    }
    
    if (lastAction.type !== 'CLEAR') return;

    // Dispatch line cleared event for tutorial
    if (lastAction.lines && lastAction.lines > 0) {
      window.dispatchEvent(new CustomEvent('tutorial-validation', {
        detail: { type: 'line_cleared' }
      }));
    }
    
    // Dispatch combo achieved event for tutorial
    if (lastAction.combo && lastAction.combo >= 2) {
      window.dispatchEvent(new CustomEvent('tutorial-validation', {
        detail: { type: 'combo_achieved' }
      }));
    }

    const chain = lastAction.chainCount ?? 0;
    if (chain >= 2) {
      setShownChain(chain);
      const timer = setTimeout(() => setShownChain(0), 1400);
      return () => clearTimeout(timer);
    }
    if (lastAction.colorBonus) {
      setShowPerfect(true);
      const timer = setTimeout(() => setShowPerfect(false), 1600);
      return () => clearTimeout(timer);
    }
    
    // Line count display (2+ lines cleared)
    const linesCleared = lastAction.lines || 0;
    if (linesCleared >= 2) {
      setLineCountToShow(linesCleared);
      setShowLineCount(true);
      const timer = setTimeout(() => setShowLineCount(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Combo milestone detection for small feedback at meaningful growth points.
  useEffect(() => {
    if ((combo === 2 || combo === 5 || combo === 8 || (combo > 8 && combo % 5 === 0)) && combo > prevComboRef.current) {
      setShowComboMilestone(true);
      const timer = setTimeout(() => setShowComboMilestone(false), 800);
      return () => clearTimeout(timer);
    }
    
    prevComboRef.current = combo;
  }, [combo, gameMode]);

  // Event start visual trigger
  useEffect(() => {
    if (activeEvent && activeEvent !== prevActiveEventRef.current) {
      setEventStartVisual(activeEvent);
    }
    prevActiveEventRef.current = activeEvent;
  }, [activeEvent]);

  // Time popups for TIMED mode (removed BLITZ)
  // Note: BLITZ mechanics can be integrated into TIMED mode with a speed parameter in the future

  // Achievement notification timeout
  const { clearAchievementNotification } = useGameStore();
  useEffect(() => {
    if (unlockedAchievementId) {
      hapticEvents.achievement();
      
      // Show native notification
      const achievement = achievements.find(a => a.id === unlockedAchievementId);
      if (achievement) {
        import('@/src/utils/native/notificationHelper').then(({ showAchievementNotification }) => {
          showAchievementNotification(achievement);
        });
      }
      
      const timer = setTimeout(() => {
        clearAchievementNotification();
      }, 3000); // 3 saniye göster
      return () => clearTimeout(timer);
    }
  }, [unlockedAchievementId, clearAchievementNotification, achievements]);

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

  return (
    <div className="game-container" onPointerDown={unlockAudio} style={{ background: colors.background }}>
      <AnimatePresence mode="wait">
        {appState === AppState.GAME && (
          <GameScreen
            key={`game-${gameMode}-${isGameOver ? 'over' : 'playing'}`}
            grid={grid}
            pieces={pieces}
            combo={combo}
            gameMode={gameMode}
            gridContainerRef={gridContainerRef}
            gridSize={gridSize}
            scorePopups={scorePopups}
            showSurgeFlash={showSurgeFlash}
            timedBoostMovesLeft={timedBoostMovesLeft}
            shownChain={shownChain}
            showPerfect={showPerfect}
            eventStartVisual={eventStartVisual}
            setEventStartVisual={setEventStartVisual}
            showComboMilestone={showComboMilestone}
            lineCountToShow={lineCountToShow}
            showLineCount={showLineCount}
          />
        )}
      </AnimatePresence>

      {/* Persistence and Global Overlays */}
      <DragOverlay />
      
      {/* Achievement Notification */}
      <Suspense fallback={null}>
        <AchievementNotification />
      </Suspense>

      <AnimatePresence>
        <Suspense fallback={null}>
          <ContinueModal
            isVisible={showContinueModal}
            onContinue={handleContinue}
            onDecline={handleDecline}
            canContinue={canUseRewardedContinue}
            usesRemaining={continueUsesRemaining}
            isLoading={isLoadingAd}
          />
        </Suspense>
      </AnimatePresence>

      <AnimatePresence>
        <Suspense fallback={null}>
          <GameOverModal
            isGameOver={isGameOver && !showContinueModal}
            score={score}
            displayScore={displayScore}
            highScore={highScore}
            currentModeHighScore={currentModeHighScore}
            isNewRecord={isNewRecord}
            showRecordBadge={showRecordBadge}
            showButtons={showButtons}
            gameMode={gameOverMode}
            combo={combo}
            maxCombo={maxCombo}
            todayBestCombo={todayBestCombo}
            finalSprintBonus={finalSprintBonus}
            timedScoreBreakdown={timedScoreBreakdown}
            newRecordDiff={newRecordDiff}
            stats={stats}
            difficultyTier={difficultyTier}
            tierMovesSurvived={tierMovesSurvived}
            surgeWasUsed={surgeWasUsed}
            dailyClearHistory={dailyClearHistory}
            shareStatus={shareStatus}
            showPWAPrompt={showPWAPrompt}
            showIOSInstructions={showIOSInstructions}
            timerStartTime={timerStartTime}
            timerExpectedEnd={timerExpectedEnd}
            onClose={handleClose}
            onPlayAgain={handlePlayAgain}
            onTryMode={handleTryMode}
            onShare={handleShare}
            onInstallPWA={triggerInstall}
            onCloseIOSInstructions={handleCloseIOSInstructions}
          />
        </Suspense>
      </AnimatePresence>
      
      {/* Theme Selector Modal */}
      <AnimatePresence>
        {showThemeSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleThemeSelectorBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              onClick={handleModalContentClick}
              className="bg-gray-800 border border-white/8 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">{t('settings.title')}</h2>
              <p className="text-gray-400 text-xs text-center mb-6">{t('settings.themeDesc')}</p>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={clsx(
                    "p-2.5 rounded-lg border transition-all",
                    currentTheme === 'dark' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-8 rounded-md mb-2" style={{ background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)' }}></div>
                  <p className="text-white text-xs font-bold truncate">{t('settings.dark')}</p>
                </button>
                
                <button
                  onClick={() => handleThemeChange('light')}
                  className={clsx(
                    "p-2.5 rounded-lg border transition-all",
                    currentTheme === 'light' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-8 rounded-md mb-2" style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)' }}></div>
                  <p className="text-white text-xs font-bold truncate">{t('settings.light')}</p>
                </button>
                
                <button
                  onClick={() => handleThemeChange('neon')}
                  className={clsx(
                    "p-2.5 rounded-lg border transition-all",
                    currentTheme === 'neon' ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="w-full h-8 rounded-md mb-2" style={{ background: 'linear-gradient(180deg, #0f0e17 0%, #1a0a2e 100%)' }}></div>
                  <p className="text-white text-xs font-bold truncate">{t('settings.neon')}</p>
                </button>
              </div>

              {/* Language Selection */}
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textAlign: 'center' }}>
                  {t('settings.language')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  {GAME_APP_LANGUAGE_OPTIONS.map(option => (
                    <button
                      key={option.code}
                      onClick={() => handleLanguageChange(option.code)}
                      style={{
                        padding: '10px 0',
                        borderRadius: 10,
                        border: `1.5px solid ${i18n.language === option.code ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        background: i18n.language === option.code ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
                        color: i18n.language === option.code ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleThemeSelectorClose}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
              >
                {t('settings.confirm')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Exit Confirmation Dialog */}
      <ExitConfirmDialog
        isVisible={showExitDialog}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
      
    </div>
  );
};

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
