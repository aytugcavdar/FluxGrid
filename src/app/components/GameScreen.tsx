import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GameMode } from '@shared/types';
import { Grid } from '../../features/game/components/Grid';
import { Piece } from '../../features/game/components/Piece';
import { HUD, ScorePopups, PerfectBonus, SurgeFlash, ComboFlash, ComboBar, ComboRushFlash, ChronoPopup, EventStartVisual, ComboMilestone, LineCountDisplay, FloatingScoreText, PerfectClearPopup } from '@features/hud';
import { useThemeStore } from '@shared/store/themeStore';
import { useTutorialStore } from '../../features/tutorial/store/tutorialStore';
import { playClick } from '@utils/audio';
import { AdBanner } from './AdBanner';
import { AdManager } from '@core/services/ads/AdManager';
import { useGameStore } from '../../features/game/store/gameStore';
import { TutorialOverlay } from '@features/tutorial';
import { PerformanceMetricsDisplay } from '@features/performance';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
}

interface TimePopup {
  id: number;
  value: number;
}

interface ChronoPopupData {
  id: number;
  seconds: number;
}

interface GameScreenProps {
  grid: any; // GridState type
  pieces: any[];
  combo: number;
  gameMode: GameMode;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  gridSize: number;
  scorePopups: ScorePopup[];
  showSurgeFlash: boolean;
  showRushStart: boolean;
  showRushEnd: boolean;
  timedBoostMovesLeft: number;
  timePopups: TimePopup[];
  setTimePopups: React.Dispatch<React.SetStateAction<TimePopup[]>>;
  chronoPopups: ChronoPopupData[];
  setChronoPopups: React.Dispatch<React.SetStateAction<ChronoPopupData[]>>;
  shownChain: number;
  showPerfect: boolean;
  eventStartVisual: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  setEventStartVisual: React.Dispatch<React.SetStateAction<'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null>>;
  showComboMilestone: boolean;
  lineCountToShow: number;
  showLineCount: boolean;
}

import { areGameScreenPropsEqual } from './GameScreenMemo';

export const GameScreen: React.FC<GameScreenProps> = React.memo(({
  grid,
  pieces,
  combo,
  gameMode,
  gridContainerRef,
  gridSize,
  scorePopups,
  showSurgeFlash,
  showRushStart,
  showRushEnd,
  timedBoostMovesLeft,
  timePopups,
  setTimePopups,
  chronoPopups,
  setChronoPopups,
  shownChain,
  showPerfect,
  eventStartVisual,
  setEventStartVisual,
  showComboMilestone,
  lineCountToShow,
  showLineCount,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();
  const isTutorialActive = useTutorialStore(state => state.isActive);

  // Perfect clear state
  const [showPerfectClear, setShowPerfectClear] = useState(false);
  const [prevPerfectClear, setPrevPerfectClear] = useState(false);

  // Detect perfect clear from game state
  useEffect(() => {
    const perfectClearDetected = useGameStore.getState().perfectClearDetected;
    
    if (perfectClearDetected && !prevPerfectClear) {
      setShowPerfectClear(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowPerfectClear(false);
        // Reset perfect clear flag in store
        useGameStore.setState({ perfectClearDetected: false });
      }, 3000);
    }
    
    setPrevPerfectClear(perfectClearDetected);
  }, [prevPerfectClear]);

  // Check if banner should be shown (native platform only)
  // Note: AdBanner component handles all visibility logic internally
  const showBanner = typeof window !== 'undefined' && 
                     !!(window as any).Capacitor?.isNativePlatform?.();

  // Track banner height for dynamic tray padding
  const [bannerHeight, setBannerHeight] = useState(0);

  // Memoized event handlers for banner events
  const handleBannerShown = React.useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ height: number }>;
    setBannerHeight(customEvent.detail.height);
  }, []);

  const handleBannerHidden = React.useCallback(() => {
    setBannerHeight(0);
  }, []);

  useEffect(() => {
    window.addEventListener('fluxgrid-banner-shown', handleBannerShown);
    window.addEventListener('fluxgrid-banner-hidden', handleBannerHidden);

    return () => {
      window.removeEventListener('fluxgrid-banner-shown', handleBannerShown);
      window.removeEventListener('fluxgrid-banner-hidden', handleBannerHidden);
    };
  }, [handleBannerShown, handleBannerHidden]);

  // Memoized event handlers for performance
  const handleEventStartComplete = React.useCallback(() => {
    setEventStartVisual(null);
  }, [setEventStartVisual]);

  const handleTimePopupAnimationComplete = React.useCallback((popupId: number) => {
    setTimePopups(prev => prev.filter(p => p.id !== popupId));
  }, [setTimePopups]);

  const handleChronoPopupComplete = React.useCallback((id: number) => {
    setChronoPopups(prev => prev.filter(p => p.id !== id));
  }, [setChronoPopups]);

  return (
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
          padding: 'calc(var(--safe-area-top, 0px) + 2px) 4px 2px',
          height: 'calc(var(--hud-height, 85px) + var(--safe-area-top, 0px))'
        }}
      >
        <div style={{ height: '100%' }}>
          <HUD />
        </div>
      </header>

      {/* Grid Area */}
      <main 
        className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden"
        style={{ padding: '0px 4px 4px' }}
      >
        <div 
          ref={gridContainerRef}
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <div style={{ 
            width: gridSize > 0 ? gridSize : '100%', 
            height: gridSize > 0 ? gridSize : '100%', 
            maxWidth: gridSize > 0 ? gridSize : '100vmin', 
            maxHeight: gridSize > 0 ? gridSize : '100vmin', 
            aspectRatio: '1/1',
            position: 'relative'
          }}>
            <Grid grid={grid} />
          </div>
        </div>
      </main>

      {/* Piece Tray */}
      <div style={{ 
        height: `calc(var(--tray-height, 68px) + env(safe-area-inset-bottom, 0px))`,
        marginBottom: showBanner ? '60px' : '0px', // Banner için boşluk bırak
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        backgroundColor: colors.trayBackground,
        borderTop: `1px solid ${colors.hudBorder}`,
        flexShrink: 0
      }}>
        <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '4px 6px' }}>
          <div className="grid grid-cols-3 flex-1 min-h-0" style={{ gap: '4px' }}>
            <AnimatePresence mode="popLayout">
              {pieces.map((piece, index) => (
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
                  <Piece piece={piece} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      {showBanner && <AdBanner position="bottom" />}

      {/* Game Visual Effects */}
      {/* ComboDisplay DISABLED - causes freeze at 10x combo */}
      {/* <ComboDisplay /> */}
      <FloatingScoreText />
      {/* ScorePopups DISABLED - replaced with FloatingScoreText */}
      {/* <ScorePopups popups={scorePopups} /> */}
      {/* ComboFlash DISABLED - removed edge glow effect */}
      {/* <ComboFlash combo={combo} /> */}
      <SurgeFlash active={showSurgeFlash} />
      <ComboRushFlash active={showRushStart} movesLeft={timedBoostMovesLeft} onStart={true} />
      <ComboRushFlash active={showRushEnd} movesLeft={0} onStart={false} />
      <ComboBar />
      {/* ComboMilestone DISABLED - causes crash at 10x combo */}
      {/* <ComboMilestone combo={combo} show={showComboMilestone} /> */}
      <LineCountDisplay lineCount={lineCountToShow} show={showLineCount} />
      
      {/* Event Start Visual */}
      <EventStartVisual 
        eventType={eventStartVisual} 
        onComplete={handleEventStartComplete} 
      />

      {/* Time Popups */}
      <AnimatePresence>
        {timePopups.map(popup => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 40 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: '50%',
              top: `calc(var(--hud-height) + 8px + ${(popup.id % 3) * 28}px)`,
              transform: 'translateX(-50%)',
              fontSize: '24px',
              fontWeight: 900,
              color: '#ef4444',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              zIndex: 100
            }}
            onAnimationComplete={() => handleTimePopupAnimationComplete(popup.id)}
          >
            {popup.value > 0 ? `+${popup.value}s` : `${popup.value}s`}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* CHRONO Popups */}
      <AnimatePresence>
        {chronoPopups.map(popup => (
          <ChronoPopup
            key={popup.id}
            id={popup.id}
            seconds={popup.seconds}
            onComplete={handleChronoPopupComplete}
          />
        ))}
      </AnimatePresence>

      <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-10">
        <AnimatePresence mode="wait">
          {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
        </AnimatePresence>
      </div>

      {/* Perfect Clear Popup */}
      <PerfectClearPopup show={showPerfectClear} />
      
      {/* Tutorial Overlay */}
      <TutorialOverlay />
      
      {/* Performance Metrics Display */}
      <PerformanceMetricsDisplay />
    </motion.div>
  );
}, areGameScreenPropsEqual);
