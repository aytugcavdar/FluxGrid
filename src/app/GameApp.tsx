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
import { TIER_SCORE_MULTIPLIERS, TIER_THRESHOLDS } from '../features/game/constants';
import { playSkill, hapticEvents, unlockAudio, playGameOver, playClick } from '@utils/audio';
import { AdManager } from '@core/services/ads/AdManager';
import { createContinueGrid } from '@features/game/utils/game/gameHelpers';
import { getRandomPiecesSync } from '../features/game/store/helpers/pieces';
import { GameScreen } from './components/GameScreen';
import { DragOverlay } from '../features/hud/components/DragOverlay';
import { ParticleExplosionOverlay } from '../features/visual-effects/components/ParticleExplosionOverlay';
import { ScreenShakeEffect, LineClearAnimations, PlacementFeedbackEffect, GridBreathingEffect, PlacementImpactEffect, TierTransitionAnimation, ScoreMilestoneCelebration, AbilityUnlockAnimation, StreakIndicator, NearMissWarning, PauseResumeAnimation, GameOverSequence, VictoryCelebration, ModeChangeTransition } from '../features/visual-effects/components';
import { TierCelebrationOverlay } from '../features/hud/components/TierCelebrationOverlay';
import { ExitConfirmDialog } from '../shared/components/ExitConfirmDialog';
import { generateShareText, shareResult } from '../utils/sharing/shareResult';
import { ErrorBoundary } from './ErrorBoundary';
import { PerformanceMetricsDisplay } from '@features/performance';
import { initializePerformanceSystem, cleanupPerformanceSystem } from '@features/performance';
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

interface TimePopup {
  id: number;
  value: number;
}

const TIER_EVENT_LABELS: Record<number, string> = {
  1: 'Buz Fırtınası',
  2: 'Deprem',
  3: 'Ayna Modu',
  4: 'Kaos',
  5: 'VOID',
  6: 'VOID+',
};

const CONTINUE_TIMED_SECONDS = 15;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft,
    dailyClearHistory, highScore, stats, highScores,
    maxCombo, timedBoostMovesLeft, finalSprintBonus, timedScoreBreakdown, difficultyTier, tierStartMove, totalMovesPlayed, grid,
    newRecordDiff, gameLogs,
    timerStartTime, timerExpectedEnd,
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
  const [timePopups, setTimePopups] = useState<TimePopup[]>([]);
  const timePopupIdRef = useRef(0);
  const prevTimeLeftRef = useRef(timeLeft);
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
  const [showRecordBadge, setShowRecordBadge] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Tier celebration state
  const [tierCelebration, setTierCelebration] = useState<{
    tier: number;
    tierName: string;
    multiplier: number;
    eventLabel: string;
    nextGoal: number | null;
  } | null>(null);
  
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
  
  // Custom hooks
  useBrowserHistory();
  const { showPWAPrompt, showIOSInstructions, setShowIOSInstructions, triggerInstall } = usePWAInstall(isGameOver, score);
  useGameSync();
  
  // Get exit dialog state from useBrowserHistory
  const browserHistory = useBrowserHistory();
  const { showExitDialog, handleConfirm: handleExitConfirm, handleCancel: handleExitCancel } = browserHistory;

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

  const handleLanguageChange = useCallback((lang: 'tr' | 'en') => {
    playClick();
    changeLanguage(lang);
  }, []);

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

  // Global Timer Loop
  useEffect(() => {
    if (appState !== AppState.GAME || isGameOver) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 250); // 250ms for more accurate timer updates
    return () => clearInterval(interval);
  }, [gameMode, appState, isGameOver, tickTimer]);

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
      const canContinue = !reviveUsedThisRun && AdManager.canShowRewardedContinue();
      if (canContinue) {
        setShowContinueModal(true);
        setContinueUsesRemaining(AdManager.getRewardedContinueRemaining());
      } else {
        finalizeGameOver();
      }
    }
  }, [finalizeGameOver, isGameOver, prevGameOver, reviveUsedThisRun]);

  // Handle continue feature
  const handleContinue = useCallback(async () => {
    console.log('[GameApp] handleContinue called');
    
    // CRITICAL: Prevent multiple clicks
    if (isLoadingAd) {
      console.log('[GameApp] Already loading ad, ignoring click');
      return;
    }
    
    // Set loading state immediately to prevent rapid clicks
    setIsLoadingAd(true);
    
    // Small delay to ensure state update propagates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('[GameApp] Calling AdManager.showRewardedContinue()...');
      const result = await AdManager.showRewardedContinue();
      
      console.log('[GameApp] Rewarded ad result:', result);
      
      if (result.success) {
        console.log('[GameApp] Ad successful, continuing game...');
        
        const rescueGrid = createContinueGrid(grid);
        const rescueTier = gameMode === GameMode.ENDLESS ? Math.max(0, difficultyTier - 1) : 0;
        
        const newPieces = getRandomPiecesSync(
          3,
          rescueGrid,
          gameMode === GameMode.DAILY_CHALLENGE,
          useThemeStore.getState().getPieceColors(),
          rescueTier,
          gameMode
        );

        const now = Date.now();
        const timedResumeState = gameMode === GameMode.TIMED
          ? {
              timeLeft: CONTINUE_TIMED_SECONDS,
              timerStartTime: timerStartTime ?? now,
              timerExpectedEnd: now + CONTINUE_TIMED_SECONDS * 1000,
            }
          : {};

        markReviveUsed();
        
        useGameStore.setState({
          grid: rescueGrid,
          pieces: newPieces,
          isGameOver: false,
          gameOverFinalized: false,
          combo: 0,
          comboTimerStartTime: null,
          comboTimeLeft: 0,
          lastAction: null,
          ...timedResumeState,
        });
        
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
    setShowContinueModal(false);
    finalizeGameOver();
  }, [finalizeGameOver]);

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

  // Track previous timeLeft for combo break detection
  useEffect(() => {
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Combo break penalty visual feedback for TIMED mode
  useEffect(() => {
    if (gameMode === GameMode.TIMED && prevComboRef.current > 0 && combo === 0) {
      // Show -1 second popup
      setTimePopups(prev => [...prev, {
        id: timePopupIdRef.current++,
        value: -1,
      }]);
    }
    
    // Combo milestone detection: small feedback at meaningful growth points.
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

  // Tier celebration detection
  useEffect(() => {
    if (lastAction?.type === 'MILESTONE' && lastAction.tier && lastAction.tierName) {
      const multiplier = TIER_SCORE_MULTIPLIERS[lastAction.tier] || 1.0;
      
      setTierCelebration({
        tier: lastAction.tier,
        tierName: lastAction.tierName,
        multiplier,
        eventLabel: TIER_EVENT_LABELS[lastAction.tier] ?? 'Tier baskısı',
        nextGoal: TIER_THRESHOLDS[lastAction.tier + 1] ?? null,
      });
      
      playSkill();
      hapticEvents.surge();
      
      const timer = setTimeout(() => setTierCelebration(null), 2800);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

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

  // Language change handler
  const changeLanguage = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('flux_language', lang);
  };

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
            timePopups={timePopups}
            setTimePopups={setTimePopups}
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
      <ScreenShakeEffect>
        <DragOverlay />
      </ScreenShakeEffect>
      <GridBreathingEffect />
      <LineClearAnimations />
      <PlacementFeedbackEffect />
      <PlacementImpactEffect />
      <ParticleExplosionOverlay />
      
      {/* Achievement Notification */}
      <Suspense fallback={null}>
        <AchievementNotification />
      </Suspense>

      {/* Tier Celebration Overlay */}
      <AnimatePresence>
        {tierCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none"
          >
            <TierCelebrationOverlay
              tier={tierCelebration.tier}
              tierName={tierCelebration.tierName}
              multiplier={tierCelebration.multiplier}
              eventLabel={tierCelebration.eventLabel}
              nextGoal={tierCelebration.nextGoal}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <Suspense fallback={null}>
          <ContinueModal
            isVisible={showContinueModal}
            onContinue={handleContinue}
            onDecline={handleDecline}
            canContinue={!reviveUsedThisRun && AdManager.canShowRewardedContinue()}
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
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['tr', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
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
      
      {/* New Juice System Components */}
      <TierTransitionAnimation />
      <ScoreMilestoneCelebration />
      <AbilityUnlockAnimation />
      <StreakIndicator />
      <NearMissWarning />
      <PauseResumeAnimation />
      <GameOverSequence />
      <VictoryCelebration />
      <ModeChangeTransition />
    </div>
  );
};

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
