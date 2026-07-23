import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { GameMode } from '@shared/types';
import { Grid2D as Grid } from '../../features/game/components/Grid2D';
import { Piece } from '../../features/game/components/Piece';
import { HUD, PerfectBonus, SurgeFlash, EventStartVisual, LineCountDisplay, FloatingScoreText, FloatingTimeText } from '@features/hud';
import { useThemeStore } from '@shared/store/themeStore';
import { playClick } from '@utils/audio';
import { useGameStore } from '../../features/game/store/gameStore';
import { getTrayDecisionSupport } from '../../features/game/utils/trayDecisionSupport';
import { TutorialOverlay } from '@features/tutorial';
import { AdBanner } from './AdBanner';
import { AdManager } from '@core/services/ads/AdManager';
import { useTutorialStore } from '../../features/tutorial/store/tutorialStore';

interface ScorePopup {
  id: number;
  value: number;
  combo: number;
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
  shownChain: number;
  showPerfect: boolean;
  eventStartVisual: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  setEventStartVisual: React.Dispatch<React.SetStateAction<'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null>>;
  showComboMilestone: boolean;
  lineCountToShow: number;
  showLineCount: boolean;
}

import { areGameScreenPropsEqual } from './GameScreenMemo';

const TIMED_INTRO_STORAGE_KEY = 'flux_timed_intro_v1';

const TimedModeIntroCard: React.FC<{
  visible: boolean;
  onClose: () => void;
  reducedMotion: boolean;
}> = ({ visible, onClose, reducedMotion }) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onClose, 7000);
    return () => window.clearTimeout(timer);
  }, [onClose, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.24, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 'calc(var(--safe-area-top, 0px) + 104px)',
            left: 12,
            right: 12,
            zIndex: 46,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 'min(360px, calc(100vw - 24px))',
              borderRadius: 18,
              padding: '12px 13px',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,41,59,0.9))',
              border: '1px solid rgba(251,191,36,0.34)',
              boxShadow: reducedMotion ? '0 8px 22px rgba(0,0,0,0.24)' : '0 12px 34px rgba(0,0,0,0.34), 0 0 22px rgba(251,191,36,0.12)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(251,191,36,0.14)',
                  border: '1px solid rgba(251,191,36,0.34)',
                  color: '#fbbf24',
                  fontSize: 18,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                ⏱
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fef3c7', fontSize: 13, fontWeight: 950, letterSpacing: '0.02em' }}>
                  {t('tutorial.timedIntro.title')}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 1.35, marginTop: 3 }}>
                  {t('tutorial.timedIntro.description')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
                  {[1, 2, 3].map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: '4px 7px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      {t(`tutorial.timedIntro.tip${item}`)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t('tutorial.timedIntro.dismiss')}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.78)',
                  fontSize: 16,
                  fontWeight: 900,
                  lineHeight: '28px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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
  const isGameOver = useGameStore(state => state.isGameOver);
  const timeLeft = useGameStore(state => state.timeLeft);
  const isTutorialActive = useTutorialStore(state => state.isActive);
  const isNativeApp = typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.();
  const [showTimedIntro, setShowTimedIntro] = React.useState(false);
  const [consentAllowsAds, setConsentAllowsAds] = React.useState(() => AdManager.canRequestAds());

  React.useEffect(() => {
    const handleConsentUpdate = () => setConsentAllowsAds(AdManager.canRequestAds());
    window.addEventListener('fluxgrid-ad-consent-updated', handleConsentUpdate);
    return () => window.removeEventListener('fluxgrid-ad-consent-updated', handleConsentUpdate);
  }, []);

  React.useEffect(() => {
    if (gameMode !== GameMode.TIMED || isGameOver || isTutorialActive) return;
    try {
      if (localStorage.getItem(TIMED_INTRO_STORAGE_KEY) === 'true') return;
    } catch {}
    setShowTimedIntro(true);
  }, [gameMode, isGameOver, isTutorialActive]);

  const dismissTimedIntro = React.useCallback(() => {
    setShowTimedIntro(false);
    try {
      localStorage.setItem(TIMED_INTRO_STORAGE_KEY, 'true');
    } catch {}
  }, []);

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
    consentAllowsAds &&
    !isTutorialActive &&
    !showTimedIntro &&
    !isGameOver &&
    !AdManager.isNoAdsActive();
  const bottomSafeArea = 'max(env(safe-area-inset-bottom, 0px), var(--safe-area-bottom, 0px))';
  const bannerReserve = shouldRenderBanner
    ? 'var(--native-banner-reserve, clamp(76px, 10vh, 96px))'
    : '0px';

  const trayDecisionSupport = React.useMemo(
    () => getTrayDecisionSupport(grid, pieces),
    [grid, pieces]
  );
  const traySlotByIdRef = React.useRef<Record<string, number>>({});
  const traySlots = React.useMemo(() => {
    const activeIds = new Set(pieces.map((piece: any) => piece.instanceId));
    Object.keys(traySlotByIdRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        delete traySlotByIdRef.current[id];
      }
    });

    const usedSlots = new Set<number>();
    pieces.forEach((piece: any) => {
      const explicitSlot = Number.isInteger(piece.traySlot) ? piece.traySlot : undefined;
      const rememberedSlot = traySlotByIdRef.current[piece.instanceId];
      const slot = explicitSlot ?? rememberedSlot;
      if (typeof slot === 'number' && slot >= 0 && slot < 3 && !usedSlots.has(slot)) {
        traySlotByIdRef.current[piece.instanceId] = slot;
        usedSlots.add(slot);
      }
    });

    pieces.forEach((piece: any, fallbackIndex: number) => {
      if (Number.isInteger(traySlotByIdRef.current[piece.instanceId])) return;
      const fallbackSlot = !usedSlots.has(fallbackIndex)
        ? fallbackIndex
        : [0, 1, 2].find(slot => !usedSlots.has(slot));
      if (typeof fallbackSlot === 'number') {
        traySlotByIdRef.current[piece.instanceId] = fallbackSlot;
        usedSlots.add(fallbackSlot);
      }
    });

    return [0, 1, 2].map(slot => (
      pieces.find((piece: any) => traySlotByIdRef.current[piece.instanceId] === slot) ?? null
    ));
  }, [pieces]);

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
      return 'transparent';
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

  return (
    <motion.div
      data-game-screen-ready="true"
      key="game"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
                filter: isNativeApp ? 'none' : 'blur(10px)',
                opacity: isNativeApp ? 0.38 : currentTheme === 'light' ? 0.82 : 0.9,
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-10%',
                background: backgroundLayers.boardHalo,
                filter: isNativeApp ? 'none' : 'blur(18px)',
                opacity: isNativeApp ? 0.24 : currentTheme === 'light' ? 0.72 : 0.86,
                pointerEvents: 'none',
              }}
            />
            <Grid grid={grid} />
          </div>
        </div>
      </main>

      {/* ══ Piece Tray — glassmorphism ══ */}
      <div style={{
        height: `calc(var(--tray-height, 72px) + ${bottomSafeArea} + ${bannerReserve})`,
        marginBottom: '0px',
        paddingBottom: `calc(${bottomSafeArea} + 6px + ${bannerReserve})`,
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Top gradient accent line — pulses on refresh */}
        <motion.div
          animate={trayFlash && !isNativeApp
            ? { opacity: [0, 0, 0], scaleX: [0.6, 1, 0.6] }
            : { opacity: 0, scaleX: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'transparent',
            transformOrigin: 'center',
          }}
        />
        {/* Tray background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'transparent',
          backdropFilter: 'none',
        }} />

        <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '4px 6px 0', position: 'relative' }}>
          <div className="grid grid-cols-3 flex-1 min-h-0" style={{ gap: '5px' }}>
            <AnimatePresence mode="popLayout">
              {traySlots.map((piece: any, slotIndex: number) => {
                if (!piece) {
                  return (
                    <div
                      key={`empty-tray-slot-${slotIndex}`}
                      className="piece-slot h-full"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                }

                const decision = trayDecisionSupport[piece.instanceId] || { canPlace: true, canClear: false };
                // Stagger direction: full refresh → slide from right
                // Single removal → pop upward
                const enterX = 28 + slotIndex * 10;  // slight cascade from right
                const enterDelay = slotIndex * 0.055;

                return (
                  <motion.div
                    key={piece.instanceId}
                    layout
                    initial={{ x: enterX, y: -4, opacity: 0, scale: 0.82, filter: isNativeApp ? 'none' : 'blur(4px)' }}
                    animate={{ x: 0, y: -4, opacity: 1, scale: 1, filter: 'none' }}
                    exit={{
                      y: -18,
                      opacity: 0,
                      scale: 0.7,
                      filter: 'none',
                      transition: { duration: 0.18, ease: 'easeIn' }
                    }}
                    transition={isNativeApp
                      ? { duration: 0.18, ease: 'easeOut', delay: enterDelay }
                      : { type: 'spring', stiffness: 320, damping: 24, delay: enterDelay }}
                    className="piece-slot h-full"
                    style={{
                      border: '1px solid transparent',
                      background: 'transparent',
                      boxShadow: 'none',
                      position: 'relative',
                      opacity: decision.canPlace ? 1 : 0.52,
                      filter: decision.canPlace ? 'saturate(1)' : 'saturate(0.45)',
                      transition: isNativeApp
                        ? 'opacity 0.16s, filter 0.16s'
                        : 'opacity 0.2s, filter 0.2s',
                    }}
                  >
                    <Piece piece={piece} index={slotIndex} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Ad Banner */}

      {/* Game Visual Effects */}
      {/* ComboDisplay DISABLED - causes freeze at 10x combo */}
      {/* <ComboDisplay /> */}
      <FloatingScoreText />
      <FloatingTimeText />
      {/* ScorePopups DISABLED - replaced with FloatingScoreText */}
      {/* <ScorePopups popups={scorePopups} /> */}
      <SurgeFlash active={showSurgeFlash} />
      {/* ComboMilestone DISABLED - causes crash at 10x combo */}
      {/* <ComboMilestone combo={combo} show={showComboMilestone} /> */}
      <LineCountDisplay lineCount={lineCountToShow} show={showLineCount} />
      
      {/* Event Start Visual */}
      <EventStartVisual 
        eventType={eventStartVisual} 
        onComplete={handleEventStartComplete} 
      />

      <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-10">
        <AnimatePresence mode="wait">
          {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
        </AnimatePresence>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay />

      <TimedModeIntroCard
        visible={showTimedIntro}
        onClose={dismissTimedIntro}
        reducedMotion={isNativeApp}
      />

      {shouldRenderBanner && <AdBanner position="bottom" />}
    </motion.div>
  );
}, areGameScreenPropsEqual);
