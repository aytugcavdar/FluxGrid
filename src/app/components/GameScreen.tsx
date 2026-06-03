import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GameMode } from '@shared/types';
import { Grid } from '../../features/game/components/Grid';
import { Piece } from '../../features/game/components/Piece';
import { HUD, ScorePopups, PerfectBonus, SurgeFlash, ComboFlash, ComboRushFlash, EventStartVisual, ComboMilestone, LineCountDisplay, FloatingScoreText, FloatingTimeText, LineClearFlash, ComboBar } from '@features/hud';
import { useThemeStore } from '@shared/store/themeStore';
import { useTutorialStore } from '../../features/tutorial/store/tutorialStore';
import { playClick } from '@utils/audio';
import { AdBanner } from './AdBanner';
import { AdManager } from '@core/services/ads/AdManager';
import { useGameStore } from '../../features/game/store/gameStore';
import { getTrayDecisionSupport } from '../../features/game/utils/trayDecisionSupport';
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

interface GameScreenProps {
  grid: any; // GridState type
  pieces: any[];
  combo: number;
  gameMode: GameMode;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  gridSize: number;
  scorePopups: ScorePopup[];
  showSurgeFlash: boolean;
  timedBoostMovesLeft: number;
  timePopups: TimePopup[];
  setTimePopups: React.Dispatch<React.SetStateAction<TimePopup[]>>;
  shownChain: number;
  showPerfect: boolean;
  eventStartVisual: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  setEventStartVisual: React.Dispatch<React.SetStateAction<'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null>>;
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
  timedBoostMovesLeft,
  timePopups,
  setTimePopups,
  shownChain,
  showPerfect,
  eventStartVisual,
  setEventStartVisual,
  showComboMilestone,
  lineCountToShow,
  showLineCount,
}) => {
  const { getThemeColors, currentTheme } = useThemeStore();
  const colors = getThemeColors();
  const isTutorialActive = useTutorialStore(state => state.isActive);
  const isGameOver = useGameStore(state => state.isGameOver);
  const timeLeft = useGameStore(state => state.timeLeft);

  // Track piece set refreshes (all 3 pieces replaced at once = reroll/new round)
  const prevPieceIdsRef = React.useRef<string>('');
  const [trayGeneration, setTrayGeneration] = React.useState(0);
  const [trayFlash, setTrayFlash] = React.useState(false);

  React.useEffect(() => {
    const currentIds = pieces.map((p: any) => p.instanceId).join(',');
    if (prevPieceIdsRef.current !== '' && currentIds !== prevPieceIdsRef.current) {
      // Check if it's a full refresh (all pieces changed)
      const prevIds = prevPieceIdsRef.current.split(',');
      const newIds  = currentIds.split(',');
      const allNew  = newIds.every((id: string) => !prevIds.includes(id));
      if (allNew && pieces.length === 3) {
        setTrayGeneration(g => g + 1);
        setTrayFlash(true);
        setTimeout(() => setTrayFlash(false), 500);
      }
    }
    prevPieceIdsRef.current = currentIds;
  }, [pieces]);

  const shouldRenderBanner =
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.() &&
    !isTutorialActive &&
    !isGameOver &&
    !AdManager.isNoAdsActive();

  const trayDecisionSupport = React.useMemo(
    () => getTrayDecisionSupport(grid, pieces),
    [grid, pieces]
  );

  const isTimedPressure = gameMode === GameMode.TIMED && !isGameOver && timeLeft <= 10;
  const isHighCombo = combo >= 5;

  const backgroundLayers = React.useMemo(() => {
    if (currentTheme === 'light') {
      return {
        base: 'linear-gradient(145deg, #8d7659 0%, #a8895f 44%, #67503a 100%)',
        focus: 'radial-gradient(circle at 50% 43%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 32%, rgba(54,36,20,0.32) 74%, rgba(54,36,20,0.44) 100%)',
        texture: 'linear-gradient(115deg, rgba(255,255,255,0.075) 0%, transparent 34%, rgba(0,0,0,0.14) 100%)',
        boardHalo: 'radial-gradient(ellipse at center, rgba(255,255,255,0.17) 0%, rgba(120,53,15,0.14) 36%, rgba(54,36,20,0.0) 72%)',
        boardFocus: 'radial-gradient(ellipse at center, rgba(36,24,14,0.24) 0%, rgba(36,24,14,0.14) 46%, rgba(36,24,14,0.0) 76%)',
      };
    }

    if (currentTheme === 'neon') {
      return {
        base: 'linear-gradient(145deg, #111827 0%, #171a2c 48%, #0e1420 100%)',
        focus: 'radial-gradient(circle at 50% 42%, rgba(232,121,249,0.11) 0%, rgba(34,211,238,0.055) 34%, rgba(12,18,30,0.28) 76%, rgba(7,11,18,0.42) 100%)',
        texture: 'linear-gradient(120deg, rgba(34,211,238,0.045) 0%, transparent 38%, rgba(232,121,249,0.055) 100%)',
        boardHalo: 'radial-gradient(ellipse at center, rgba(232,121,249,0.13) 0%, rgba(34,211,238,0.07) 38%, rgba(8,13,22,0.0) 72%)',
        boardFocus: 'radial-gradient(ellipse at center, rgba(15,23,36,0.26) 0%, rgba(10,15,25,0.13) 48%, rgba(8,13,22,0.0) 78%)',
      };
    }

    return {
      base: 'linear-gradient(145deg, #111827 0%, #151d2a 46%, #0d1420 100%)',
      focus: 'radial-gradient(circle at 50% 42%, rgba(148,163,184,0.14) 0%, rgba(59,130,246,0.065) 32%, rgba(14,21,32,0.28) 76%, rgba(8,12,19,0.42) 100%)',
      texture: 'linear-gradient(120deg, rgba(255,255,255,0.045) 0%, transparent 36%, rgba(9,14,22,0.16) 100%)',
      boardHalo: 'radial-gradient(ellipse at center, rgba(96,165,250,0.13) 0%, rgba(168,85,247,0.065) 34%, rgba(8,13,22,0.0) 74%)',
      boardFocus: 'radial-gradient(ellipse at center, rgba(15,23,42,0.26) 0%, rgba(12,18,30,0.13) 48%, rgba(8,13,22,0.0) 78%)',
    };
  }, [currentTheme]);

  const stateBackground = React.useMemo(() => {
    if (isGameOver) {
      return 'radial-gradient(circle at 50% 38%, rgba(10,15,24,0.10) 0%, rgba(4,8,14,0.38) 100%)';
    }

    if (isTimedPressure) {
      return 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.13) 0%, rgba(245,158,11,0.045) 34%, rgba(0,0,0,0.0) 74%)';
    }

    if (isHighCombo) {
      return 'radial-gradient(circle at 50% 40%, rgba(168,85,247,0.10) 0%, rgba(59,130,246,0.04) 36%, rgba(0,0,0,0.0) 76%)';
    }

    return 'transparent';
  }, [isGameOver, isHighCombo, isTimedPressure]);

  // Memoized event handlers for performance
  const handleEventStartComplete = React.useCallback(() => {
    setEventStartVisual(null);
  }, [setEventStartVisual]);

  const handleTimePopupAnimationComplete = React.useCallback((popupId: number) => {
    setTimePopups(prev => prev.filter(p => p.id !== popupId));
  }, [setTimePopups]);

  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex flex-col z-30 overflow-hidden"
      style={{ background: backgroundLayers.base }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `${backgroundLayers.focus}, ${backgroundLayers.texture}`,
          opacity: 1,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          maskImage: 'radial-gradient(circle at 50% 42%, black 0%, black 58%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 42%, black 0%, black 58%, transparent 100%)',
          opacity: currentTheme === 'light' ? 0.18 : 0.22,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: stateBackground,
          opacity: 1,
        }}
      />
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
          <div className="game-board" style={{ 
            width: gridSize > 0 ? gridSize : '100%', 
            height: gridSize > 0 ? gridSize : '100%', 
            maxWidth: gridSize > 0 ? gridSize : '100vmin', 
            maxHeight: gridSize > 0 ? gridSize : '100vmin', 
            aspectRatio: '1/1',
            position: 'relative'
          }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-6%',
                background: backgroundLayers.boardFocus,
                filter: 'blur(10px)',
                opacity: currentTheme === 'light' ? 0.82 : 0.9,
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-10%',
                background: backgroundLayers.boardHalo,
                filter: 'blur(18px)',
                opacity: currentTheme === 'light' ? 0.72 : 0.86,
                pointerEvents: 'none',
              }}
            />
            <Grid grid={grid} />
          </div>
          {gameMode !== GameMode.TIMED && <ComboBar gridSize={gridSize} />}
        </div>
      </main>

      {/* ══ Piece Tray — glassmorphism ══ */}
      <div style={{
        height: `calc(var(--tray-height, 72px) + env(safe-area-inset-bottom, 0px))`,
        marginBottom: '0px',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Top gradient accent line — pulses on refresh */}
        <motion.div
          animate={trayFlash
            ? { opacity: [0.4, 1, 0.4], scaleX: [0.6, 1, 0.6] }
            : { opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.4) 30%, rgba(168,85,247,0.5) 50%, rgba(244,114,182,0.4) 70%, transparent 100%)',
            transformOrigin: 'center',
          }}
        />
        {/* Tray background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: currentTheme === 'neon'
            ? 'linear-gradient(180deg, rgba(17,20,34,0.96) 0%, rgba(14,17,29,0.99) 100%)'
            : 'linear-gradient(180deg, rgba(15,23,36,0.96) 0%, rgba(12,18,30,0.99) 100%)',
          backdropFilter: 'blur(12px)',
        }} />

        <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '6px 8px 0', position: 'relative' }}>
          <div className="grid grid-cols-3 flex-1 min-h-0" style={{ gap: '6px' }}>
            <AnimatePresence mode="popLayout">
              {pieces.map((piece: any, index: number) => {
                const isIce   = piece.type === 'ICE';
                const isBomb  = piece.type === 'BOMB';
                const decision = trayDecisionSupport[piece.instanceId] || { canPlace: true, canClear: false };
                const borderColor = isIce
                  ? 'rgba(56,189,248,0.45)'
                  : isBomb
                  ? 'rgba(239,68,68,0.45)'
                  : decision.canClear
                  ? 'rgba(34,197,94,0.56)'
                  : decision.canPlace
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(148,163,184,0.12)';
                const bgColor = isIce
                  ? 'rgba(56,189,248,0.06)'
                  : isBomb
                  ? 'rgba(239,68,68,0.06)'
                  : decision.canClear
                  ? 'rgba(34,197,94,0.075)'
                  : decision.canPlace
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(255,255,255,0.018)';
                const glowColor = isIce
                  ? '0 0 12px rgba(56,189,248,0.2)'
                  : isBomb
                  ? '0 0 12px rgba(239,68,68,0.2)'
                  : decision.canClear
                  ? '0 0 18px rgba(34,197,94,0.2), inset 0 0 0 1px rgba(74,222,128,0.18)'
                  : decision.canPlace
                  ? '0 0 10px rgba(255,255,255,0.035)'
                  : 'none';

                // Stagger direction: full refresh → slide from right
                // Single removal → pop upward
                const enterX = 28 + index * 10;  // slight cascade from right
                const enterDelay = index * 0.055;

                return (
                  <motion.div
                    key={piece.instanceId}
                    layout
                    initial={{ x: enterX, opacity: 0, scale: 0.82, filter: 'blur(4px)' }}
                    animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{
                      y: -18,
                      opacity: 0,
                      scale: 0.7,
                      filter: 'blur(6px)',
                      transition: { duration: 0.18, ease: 'easeIn' }
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 320,
                      damping: 24,
                      delay: enterDelay,
                    }}
                    className="piece-slot h-full"
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      boxShadow: glowColor,
                      position: 'relative',
                      opacity: decision.canPlace ? 1 : 0.52,
                      filter: decision.canPlace ? 'saturate(1)' : 'saturate(0.45)',
                      transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s, filter 0.2s',
                    }}
                  >
                    {decision.canClear && (
                      <motion.div
                        aria-hidden="true"
                        animate={{ opacity: [0.35, 0.9, 0.35], scaleX: [0.72, 1, 0.72] }}
                        transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                          position: 'absolute',
                          left: 12,
                          right: 12,
                          top: 5,
                          height: 2,
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.95), transparent)',
                          transformOrigin: 'center',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <Piece piece={piece} index={index} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ad Banner */}
      {shouldRenderBanner && <AdBanner position="bottom" />}

      {/* Game Visual Effects */}
      {/* ComboDisplay DISABLED - causes freeze at 10x combo */}
      {/* <ComboDisplay /> */}
      <FloatingScoreText />
      <FloatingTimeText />
      {/* ScorePopups DISABLED - replaced with FloatingScoreText */}
      {/* <ScorePopups popups={scorePopups} /> */}
      {/* Combo edge glow — re-enabled */}
      <ComboFlash combo={combo} />
      {/* Line clear horizontal sweep flash */}
      <LineClearFlash />
      <SurgeFlash active={showSurgeFlash} />
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

      <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-10">
        <AnimatePresence mode="wait">
          {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
        </AnimatePresence>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay />
      
      {/* Performance Metrics Display */}
      <PerformanceMetricsDisplay />
    </motion.div>
  );
}, areGameScreenPropsEqual);
