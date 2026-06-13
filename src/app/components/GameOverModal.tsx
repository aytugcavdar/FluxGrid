import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import type { TimedScoreBreakdown } from '@features/game/store/gameStore';

interface GameOverModalProps {
  isGameOver: boolean;
  score: number;
  displayScore: number;
  highScore: number;
  currentModeHighScore: number;
  isNewRecord: boolean;
  showRecordBadge: boolean;
  showButtons: boolean;
  gameMode: GameMode;
  combo: number;
  maxCombo: number;
  todayBestCombo: number;
  finalSprintBonus: number;
  timedScoreBreakdown: TimedScoreBreakdown;
  newRecordDiff: number;
  stats: any;
  difficultyTier: number;
  tierMovesSurvived?: number;
  surgeWasUsed: boolean;
  dailyClearHistory: boolean[][];
  shareStatus: 'idle' | 'copied' | 'shared';
  showPWAPrompt: boolean;
  showIOSInstructions: boolean;
  timerStartTime: number | null;
  timerExpectedEnd: number | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onTryMode: (mode: GameMode) => void;
  onShare: () => Promise<void>;
  onInstallPWA: () => Promise<void>;
  onCloseIOSInstructions: () => void;
}

const CountUp: React.FC<{ target: number; duration?: number }> = ({
  target,
  duration = 1200,
}) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    let frameId = 0;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, target]);

  return <span>{value.toLocaleString('tr-TR')}</span>;
};

export const GameOverModal: React.FC<GameOverModalProps> = React.memo(({
  isGameOver,
  score,
  displayScore,
  currentModeHighScore,
  isNewRecord,
  showRecordBadge,
  showButtons,
  gameMode,
  newRecordDiff,
  stats,
  onClose,
  onPlayAgain,
}) => {
  const modeIsTimed = gameMode === GameMode.TIMED;
  const modeIsEndless = gameMode === GameMode.ENDLESS;
  const accentColor = modeIsTimed ? '#f59e0b' : '#818cf8';
  const accentLight = modeIsTimed ? 'rgba(245,158,11,0.15)' : 'rgba(129,140,248,0.15)';

  const personalBest = useMemo(() => {
    if (modeIsTimed) {
      return stats?.timedHighScore || currentModeHighScore || 0;
    }
    return currentModeHighScore || 0;
  }, [currentModeHighScore, modeIsTimed, stats]);

  const recordDiff = useMemo(() => {
    if (!isNewRecord) return 0;
    return Math.max(0, newRecordDiff || score - currentModeHighScore);
  }, [currentModeHighScore, isNewRecord, newRecordDiff, score]);

  const recordGap = useMemo(() => {
    if (isNewRecord || currentModeHighScore <= 0) return 0;
    return Math.max(0, currentModeHighScore - score);
  }, [currentModeHighScore, isNewRecord, score]);

  const resultLine = useMemo(() => {
    if (isNewRecord) return 'Yeni rekor. Bir tur daha.';
    if (recordGap > 0) return `Rekora ${recordGap.toLocaleString('tr-TR')} puan kaldı.`;
    return 'Bir tur daha.';
  }, [isNewRecord, recordGap]);

  if (!isGameOver) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      aria-describedby="game-over-description"
    >
      <motion.div
        initial={{ y: 60, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        style={{
          width: '100%',
          maxWidth: 340,
          margin: '0 16px',
          borderRadius: 26,
          background: 'linear-gradient(160deg, #13102a 0%, #1a1535 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 36px 74px rgba(0,0,0,0.62), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{
          height: 3,
          background: isNewRecord
            ? 'linear-gradient(90deg, #f59e0b, #f472b6, #f59e0b)'
            : `linear-gradient(90deg, ${accentColor}88, ${accentColor}, ${accentColor}88)`,
        }} />

        <div style={{
          position: 'absolute',
          top: -62,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 280,
          height: 180,
          background: isNewRecord
            ? 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)'
            : `radial-gradient(ellipse, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ padding: '20px 20px 22px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: accentLight,
                  border: `1px solid ${accentColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 900,
                  color: accentColor,
                }}
              >
                {modeIsTimed ? 'T' : modeIsEndless ? '∞' : 'G'}
              </div>
              <div>
                <div
                  id="game-over-title"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    lineHeight: 1,
                  }}
                >
                  OYUN BİTTİ
                </div>
                <div
                  id="game-over-description"
                  style={{ fontSize: 11, fontWeight: 650, color: accentColor, lineHeight: 1.2 }}
                >
                  {modeIsTimed ? 'Zamanlı Mod' : modeIsEndless ? 'Sonsuz Mod' : 'Oyun'}
                </div>
              </div>
            </div>

            <button
              onClick={() => { playClick(); onClose(); }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.45)',
              }}
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <AnimatePresence>
              {isNewRecord && showRecordBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.2 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 20,
                    marginBottom: 10,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(244,114,182,0.2))',
                    border: '1px solid rgba(245,158,11,0.45)',
                  }}
                  role="status"
                  aria-label="Yeni rekor"
                >
                  <span style={{ fontSize: 13 }} aria-hidden="true">★</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
                    YENİ REKOR!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-1px',
                background: isNewRecord
                  ? 'linear-gradient(135deg, #fbbf24, #f472b6)'
                  : 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              role="heading"
              aria-level={1}
              aria-label={`Final skor: ${displayScore}`}
            >
              <CountUp target={displayScore} />
            </motion.div>

            {personalBest > 0 && (
              <div
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 7 }}
                aria-label={`En iyi skor: ${personalBest.toLocaleString('tr-TR')}`}
              >
                EN İYİ: {personalBest.toLocaleString('tr-TR')}
              </div>
            )}

            {isNewRecord && recordDiff > 0 && (
              <div
                style={{ fontSize: 12, color: '#fbbf24', marginTop: 7, fontWeight: 800 }}
                aria-label={`Yeni rekor farkı: +${recordDiff.toLocaleString('tr-TR')}`}
              >
                +{recordDiff.toLocaleString('tr-TR')} yeni rekor farkı
              </div>
            )}

            <div style={{ fontSize: 12, color: isNewRecord ? '#fbbf24' : accentColor, marginTop: 9, fontWeight: 800 }}>
              {resultLine}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showButtons ? 1 : 0 }}
            transition={{ duration: 0.25, delay: 0.25 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <button
              onClick={() => { playClick(); onPlayAgain(); }}
              style={{
                width: '100%',
                padding: '15px 0',
                borderRadius: 16,
                border: 'none',
                background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
                boxShadow: `0 8px 28px ${accentColor}50`,
                color: 'white',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: '0.02em',
              }}
              aria-label="Tekrar oyna"
            >
              <RotateCcw size={16} aria-hidden="true" />
              {modeIsTimed ? 'Bir Tur Daha' : 'Tekrar Oyna'}
            </button>

            <button
              onClick={() => { playClick(); onClose(); }}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 15,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.58)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              aria-label="Ana menüye dön"
            >
              Ana Menü
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});
