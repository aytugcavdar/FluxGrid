import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { GameMode } from '@shared/types';
import { SkillType } from '../../features/game/types';
import { Grid } from '../../features/game/components/Grid';
import { Piece } from '../../features/game/components/Piece';
import { HUD, ScorePopups, ChainCounter, PerfectBonus, SurgeFlash, ComboFlash, ComboBar, ComboRushFlash } from '@features/hud';
import { useGameStore } from '../../features/game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { playClick } from '@utils/audio';

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

interface GameScreenProps {
  pieces: any[];
  combo: number;
  gameMode: GameMode;
  isFirstGame: boolean;
  guidedStep: number;
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
  timedWarning: '30sn' | '10sn' | null;
  shownChain: number;
  showPerfect: boolean;
  milestoneTier: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  pieces,
  combo,
  gameMode,
  isFirstGame,
  guidedStep,
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
  timedWarning,
  shownChain,
  showPerfect,
  milestoneTier,
}) => {
  const { getThemeColors } = useThemeStore();
  const colors = getThemeColors();

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
          padding: `calc(2px + env(safe-area-inset-top, 0px)) 4px 2px`,
          height: `calc(var(--hud-height, 92px) + env(safe-area-inset-top, 0px))`
        }}
      >
        <div style={{ height: '100%' }}>
          <HUD />
        </div>
      </header>

      {/* Grid Area */}
      <main className="flex-1 relative flex items-center justify-center min-h-0 overflow-hidden">
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
        
        {/* Guided Experience Overlay */}
        {isFirstGame && guidedStep > 0 && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none',
            zIndex: 25,
          }}>
            <motion.div
              key={guidedStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 60,
                background: guidedStep === 1 ? 'rgba(59,130,246,0.95)' : guidedStep === 2 ? 'rgba(249,115,22,0.95)' : 'rgba(16,185,129,0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: 16,
                padding: '10px 12px',
                fontSize: 11,
                fontWeight: 700,
                color: 'white',
                letterSpacing: '.01em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ 
                textAlign: 'center', 
                lineHeight: '1.3',
                maxWidth: '100%',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
              }}>
                {guidedStep === 1 && 'Parçayı sürükle, yeşil alana bırak'}
                {guidedStep === 2 && 'Satırı tamamen doldur'}
                {guidedStep === 3 && '⚡ Flux dolunca REROLL kullan'}
              </div>
              
              <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: step === guidedStep ? 'white' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.3s',
                      boxShadow: step === guidedStep ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </motion.div>
            
            <button
              onClick={() => { playClick(); useGameStore.getState().completeGuidedMode(); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                fontWeight: 700,
                letterSpacing: '.05em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                minWidth: 48,
                textAlign: 'center',
              }}
            >
              ATLA
            </button>
            
            {guidedStep === 3 && (
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(16,185,129,0)',
                    '0 0 0 8px rgba(16,185,129,0.4)',
                    '0 0 0 0 rgba(16,185,129,0)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  bottom: 'calc(var(--tray-height, 90px) + env(safe-area-inset-bottom, 0px) + 52px)',
                  left: 12,
                  width: 'calc(33.333% - 8px)',
                  height: 48,
                  borderRadius: 8,
                  border: '2px solid rgba(16,185,129,0.6)',
                  pointerEvents: 'none',
                }}
              />
            )}
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
        <div className="max-w-2xl mx-auto h-full flex flex-col" style={{ padding: '4px 6px' }}>
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
      <ComboRushFlash active={showRushStart} movesLeft={timedBoostMovesLeft} onStart={true} />
      <ComboRushFlash active={showRushEnd} movesLeft={0} onStart={false} />
      {gameMode !== GameMode.ZEN && <ComboBar />}

      {/* Time Popups */}
      <AnimatePresence>
        {timePopups.map(popup => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: `${popup.x}%`,
              top: `${popup.y}%`,
              fontSize: 24,
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

      {/* TIMED Mode Warnings */}
      <AnimatePresence>
        {timedWarning === '30sn' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-0 right-0 flex justify-center pointer-events-none z-50"
          >
            <div style={{
              background: 'rgba(249,115,22,0.95)',
              border: '2px solid rgba(249,115,22,1)',
              borderRadius: 16,
              padding: '12px 24px',
              boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
            }}>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                ⚡ Son 30 saniye — 1.5× puan kazanıyorsun!
              </div>
            </div>
          </motion.div>
        )}
        {timedWarning === '10sn' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-0 right-0 flex justify-center pointer-events-none z-50"
          >
            <div style={{
              background: 'rgba(239,68,68,0.95)',
              border: '2px solid rgba(239,68,68,1)',
              borderRadius: 16,
              padding: '14px 28px',
              boxShadow: '0 8px 32px rgba(239,68,68,0.5)',
            }}>
              <div style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#fff',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                🔥 Şimdi veya hiç! — Son 10 saniye
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-20 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none z-50">
        <AnimatePresence mode="popLayout">
          {shownChain >= 2 && <ChainCounter key={`c${shownChain}`} chain={shownChain} />}
          {showPerfect && <PerfectBonus key="perfect" show={showPerfect} />}
        </AnimatePresence>
      </div>

      {/* Milestone Banner */}
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
  );
};
