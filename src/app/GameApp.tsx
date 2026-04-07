import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useThemeStore } from '../shared/store/themeStore';
import { useGameStore } from '../features/game/store/gameStore';
import { useTutorialStore } from '../shared/store/tutorialStore';
import { GameMode, AppState } from '@shared/types';
import { useCountUp } from '@shared/hooks/useCountUp';
import { useBrowserHistory } from './hooks/useBrowserHistory';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useGameSync } from '../features/game/hooks/useGameSync';
import { TIER_SCORE_MULTIPLIERS } from '../features/game/constants';
import { playSkill, playHaptic, unlockAudio, playGameOver, playChronoBonus, playClick } from '@utils/audio';
import { AdManager } from '@utils/adManager';
import { createContinueGrid } from '@utils/gameHelpers';
import { getRandomPiecesSync } from '../features/game/store/helpers/pieces';
import { useAbilityStore } from '../features/abilities/store/abilityStore';
import { usePassiveAbilityStore } from '../features/abilities/store/passiveAbilityStore';
import { GameScreen } from './components/GameScreen';
import { DragOverlay } from '../features/hud/components/DragOverlay';
import { ParticleExplosionOverlay } from '../features/visual-effects/components/ParticleExplosionOverlay';
import { TutorialManager } from '../shared/components/TutorialManager';
import { AbilityPanel } from '../features/abilities/components/AbilityPanel';
import { TierCelebrationOverlay } from '../features/hud/components/TierCelebrationOverlay';
import { ContinueModal } from './components/ContinueModal';
import { GameOverModal } from './components/GameOverModal';
import { generateShareText, shareResult } from '../utils/shareResult';
import { ErrorBoundary } from './ErrorBoundary';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface TimePopup {
  id: number;
  value: number;
}

interface ChronoPopup {
  id: number;
  seconds: number;
}

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    initGame, pieces, isGameOver, resetGame, score, combo, lastAction, isSurgeActive,
    achievements, unlockedAchievementId, appState, setAppState, gameMode, tickTimer, timeLeft,
    dailyClearHistory, highScore, stats, highScores,
    activeSkill, activateSkill,
    maxCombo, chronoBonus, timedBoostMovesLeft, finalSprintBonus, difficultyTier, grid
  } = useGameStore();
  const { currentTheme, setTheme, getThemeColors, getPieceColors } = useThemeStore();
  const colors = getThemeColors();
  const [showAbilities, setShowAbilities] = useState(false);
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
  const [timePopups, setTimePopups] = useState<TimePopup[]>([]);
  const timePopupIdRef = useRef(0);
  const [chronoPopups, setChronoPopups] = useState<ChronoPopup[]>([]);
  const chronoPopupIdRef = useRef(0);
  const prevTimeLeftRef = useRef(timeLeft);
  const prevComboRef = useRef(combo);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [surgeWasUsed, setSurgeWasUsed] = useState(false);
  
  // Enhanced visual feedback states
  const [showComboMilestone, setShowComboMilestone] = useState(false);
  const [lineCountToShow, setLineCountToShow] = useState(0);
  const [showLineCount, setShowLineCount] = useState(false);
  
  // COMBO RUSH state'leri
  const [showRushStart, setShowRushStart] = useState(false);
  const [showRushEnd, setShowRushEnd] = useState(false);
  const prevRushMovesRef = useRef(timedBoostMovesLeft);
  
  // Event start visual state
  const activeEvent = useGameStore(state => state.activeEvent);
  const [eventStartVisual, setEventStartVisual] = useState<typeof activeEvent>(null);
  const prevActiveEventRef = useRef<typeof activeEvent>(null);
  
  // Score display animation state
  const displayScore = useCountUp(score, 450, isGameOver);
  const currentModeHighScore = highScores[gameMode] || 0;
  const isNewRecord = score > 0 && score >= currentModeHighScore;
  const [showRecordBadge, setShowRecordBadge] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Tier celebration state
  const [tierCelebration, setTierCelebration] = useState<{
    tier: number;
    tierName: string;
    multiplier: number;
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
  
  // Custom hooks
  useBrowserHistory();
  const { showPWAPrompt, showIOSInstructions, setShowIOSInstructions, triggerInstall } = usePWAInstall(isGameOver, score);
  useGameSync();



  // Initialize stores on mount
  useEffect(() => {
    useAbilityStore.getState().initializeAbilities();
    usePassiveAbilityStore.getState().initializePassives();
    
    // Note: Splash is already dismissed by index.tsx for menu
    // No need to dismiss again here
    
    // Listen for tutorial completion to return to home
    const handleTutorialReturnHome = () => {
      resetGame();
      setAppState(AppState.HOME);
    };
    
    window.addEventListener('tutorial-return-home', handleTutorialReturnHome);
    return () => window.removeEventListener('tutorial-return-home', handleTutorialReturnHome);
  }, [resetGame, setAppState]);



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
    if (gameMode !== GameMode.TIMED || appState !== AppState.GAME || isGameOver) return;
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

  // Show continue modal when game over and continue is available
  useEffect(() => {
    if (isGameOver && !prevGameOver) {
      const canContinue = AdManager.canShowRewardedContinue();
      if (canContinue) {
        setShowContinueModal(true);
        const remaining = 3 - (parseInt(localStorage.getItem('flux_ad_rewarded_daily') || '0', 10));
        setContinueUsesRemaining(Math.max(0, remaining));
      }
    }
  }, [isGameOver, prevGameOver]);

  // Handle continue feature
  const handleContinue = async () => {
    try {
      const result = await AdManager.showRewardedContinue();
      
      if (result.success) {
        // Create completely empty grid for fresh start
        const emptyGrid = createContinueGrid();
        
        const newPieces = getRandomPiecesSync(
          3,
          emptyGrid,
          gameMode === GameMode.DAILY_CHALLENGE,
          useThemeStore.getState().getPieceColors(),
          0, // Reset tier to 0 so easier pieces are generated
          gameMode
        );
        
        useGameStore.setState({
          grid: emptyGrid,
          pieces: newPieces,
          isGameOver: false,
          combo: 0,
          lastAction: null,
          isSurgeActive: false,
          activeSkill: null,
        });
        
        setShowContinueModal(false);
      } else {
        // Ad failed, show game over modal
        setShowContinueModal(false);
      }
    } catch (error) {
      console.error('[GameApp] Continue failed:', error);
      setShowContinueModal(false);
    }
  };

  const handleDecline = () => {
    setShowContinueModal(false);
  };

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
    
    if (lastAction.type !== 'CLEAR') return;

    // Handle CHRONO bonus popup
    if (lastAction.chronoBonus && lastAction.chronoBonus > 0) {
      // Play sound
      playChronoBonus();
      
      // Create popup with fixed positioning (no grid coordinates needed)
      const id = chronoPopupIdRef.current++;
      setChronoPopups(prev => [...prev, {
        id,
        seconds: lastAction.chronoBonus!,
      }]);
    }

    const chain = lastAction.chainCount ?? 0;
    if (chain >= 2) {
      setShownChain(chain);
      setTimeout(() => setShownChain(0), 1400);
    }
    if (lastAction.colorBonus) {
      setShowPerfect(true);
      setTimeout(() => setShowPerfect(false), 1600);
    }
    
    // Line count display (2+ lines cleared)
    const linesCleared = lastAction.lines || 0;
    if (linesCleared >= 2) {
      setLineCountToShow(linesCleared);
      setShowLineCount(true);
      setTimeout(() => setShowLineCount(false), 1000);
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
    
    // Combo milestone detection (5, 10, 15, 20)
    if ([5, 10, 15, 20].includes(combo) && combo > prevComboRef.current) {
      setShowComboMilestone(true);
      setTimeout(() => setShowComboMilestone(false), 800);
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
        multiplier
      });
      
      playSkill();
      playHaptic('surge');
      
      setTimeout(() => setTierCelebration(null), 2800);
    }
  }, [lastAction]);

  // Time popups for TIMED mode (removed BLITZ)
  // Note: BLITZ mechanics can be integrated into TIMED mode with a speed parameter in the future

  // Achievement notification timeout
  const { clearAchievementNotification } = useGameStore();
  useEffect(() => {
    if (unlockedAchievementId) {
      // Play achievement sound
      // @ts-ignore - 'success' pattern exists but TypeScript cache issue
      playHaptic('success');
      
      // Show native notification
      const achievement = achievements.find(a => a.id === unlockedAchievementId);
      if (achievement) {
        import('@utils/notificationHelper').then(({ showAchievementNotification }) => {
          showAchievementNotification(achievement);
        });
      }
      
      const timer = setTimeout(() => {
        clearAchievementNotification();
      }, 5000); // 5 saniye göster (4 saniye yerine)
      return () => clearTimeout(timer);
    }
  }, [unlockedAchievementId, clearAchievementNotification, achievements]);

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
            chronoPopups={chronoPopups}
            setChronoPopups={setChronoPopups}
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
      <ParticleExplosionOverlay />
      <TutorialManager />
      <AnimatePresence>
        {showAbilities && <AbilityPanel onClose={() => setShowAbilities(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {unlockedAchievementId && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-3 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 w-[calc(100vw-2rem)] max-w-[340px]"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              boxShadow: '0 10px 40px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            <motion.div 
              className="w-9 h-9 sm:w-11 sm:h-11 bg-white/30 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              🏅
            </motion.div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-900/70">
                Başarım Açıldı!
              </span>
              <span className="font-bold text-sm sm:text-base text-gray-900 truncate leading-tight">
                {achievements.find(a => a.id === unlockedAchievementId)?.name}
              </span>
              <span className="text-[11px] sm:text-xs text-amber-900/60 truncate leading-tight">
                {achievements.find(a => a.id === unlockedAchievementId)?.description}
              </span>
            </div>
            <motion.div
              className="text-xl sm:text-2xl flex-shrink-0"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <ContinueModal
          isVisible={showContinueModal}
          onContinue={handleContinue}
          onDecline={handleDecline}
          canContinue={AdManager.canShowRewardedContinue()}
          usesRemaining={continueUsesRemaining}
        />
      </AnimatePresence>

      <AnimatePresence>
        <GameOverModal
          isGameOver={isGameOver && !showContinueModal}
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
          difficultyTier={difficultyTier}
          surgeWasUsed={surgeWasUsed}
          dailyClearHistory={dailyClearHistory}
          shareStatus={shareStatus}
          showPWAPrompt={showPWAPrompt}
          showIOSInstructions={showIOSInstructions}
          onClose={() => {
            resetGame();
            setAppState(AppState.MODES); // Go back to menu
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