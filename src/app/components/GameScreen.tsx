import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GameMode } from '@shared/types';
import { SkillType } from '../../features/game/types';
import { Grid } from '../../features/game/components/Grid';
import { Piece } from '../../features/game/components/Piece';
import { HUD, ScorePopups, PerfectBonus, SurgeFlash, ComboFlash, ComboBar, ComboRushFlash, ChronoPopup, EventStartVisual, ComboMilestone, LineCountDisplay } from '@features/hud';
import { useThemeStore } from '@shared/store/themeStore';
import { useTutorialStore } from '@shared/store/tutorialStore';
import { playClick } from '@utils/audio';
import { AdBanner } from './AdBanner';
import { AdManager } from '@utils/adManager';

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
  pieces: any[];
  combo: number;
  gameMode: GameMode;
  activeSkill: SkillType | null;
  activateSkill: (skill: SkillType) => void;
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

export const GameScreen: React.FC<GameScreenProps> = ({
  pieces,
  combo,
  gameMode,
  activeSkill,
  activateSkill,
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

  // Check if banner should be shown (native platform only)
  // Note: AdBanner component handles all visibility logic internally
  const showBanner = typeof window !== 'undefined' && 
                     !!(window as any).Capacitor?.isNativePlatform?.();

  // Track banner height for dynamic tray padding
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    const handleBannerShown = (event: Event) => {
      const customEvent = event as CustomEvent<{ height: number }>;
      setBannerHeight(customEvent.detail.height);
    };

    const handleBannerHidden = () => {
      setBannerHeight(0);
    };

    window.addEventListener('fluxgrid-banner-shown', handleBannerShown);
    window.addEventListener('fluxgrid-banner-hidden', handleBannerHidden);

    return () => {
      window.removeEventListener('fluxgrid-banner-shown', handleBannerShown);
      window.removeEventListener('fluxgrid-banner-hidden', handleBannerHidden);
    };
  }, []);

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
        {/* Active Skill Banner */}
        <AnimatePresence>
          {(activeSkill === SkillType.SHATTER || activeSkill === SkillType.BOMB) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                position: 'absolute',
                top: 8,
                left: 12,
                right: 12,
                zIndex: 25,
                pointerEvents: 'auto',
                padding: '10px 14px',
                background: activeSkill === SkillType.SHATTER 
                  ? 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))' 
                  : 'linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.08))',
                border: `1px solid ${activeSkill === SkillType.SHATTER ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ fontSize: 20, lineHeight: 1 }}
                >
                  {activeSkill === SkillType.SHATTER ? '🔨' : '💣'}
                </motion.div>
                <div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: activeSkill === SkillType.SHATTER ? '#ef4444' : '#f97316',
                    marginBottom: 1
                  }}>
                    {activeSkill === SkillType.SHATTER ? 'Hedef bloğa dokun' : 'Patlama merkezi seç'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {activeSkill === SkillType.SHATTER ? 'Tek blok kır' : '3×3 alan temizle'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { playClick(); activateSkill(activeSkill); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            <Grid />
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
      <ScorePopups popups={scorePopups} />
      <ComboFlash combo={combo} />
      <SurgeFlash active={showSurgeFlash} />
      <ComboRushFlash active={showRushStart} movesLeft={timedBoostMovesLeft} onStart={true} />
      <ComboRushFlash active={showRushEnd} movesLeft={0} onStart={false} />
      {gameMode !== GameMode.ZEN && <ComboBar />}
      <ComboMilestone combo={combo} show={showComboMilestone} />
      <LineCountDisplay lineCount={lineCountToShow} show={showLineCount} />
      
      {/* Event Start Visual */}
      <EventStartVisual 
        eventType={eventStartVisual} 
        onComplete={() => setEventStartVisual(null)} 
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
            onAnimationComplete={() => {
              setTimePopups(prev => prev.filter(p => p.id !== popup.id));
            }}
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
            onComplete={(id: number) => {
              setChronoPopups(prev => prev.filter(p => p.id !== id));
            }}
          />
        ))}
      </AnimatePresence>

      <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-10">
        <AnimatePresence mode="wait">
          {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
