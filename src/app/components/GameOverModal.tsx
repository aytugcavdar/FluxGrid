import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Share2, ChevronRight } from 'lucide-react';
import { GameMode } from '@shared/types';
import { playClick } from '@utils/audio';
import { generateShareText, shareResult } from '@/src/utils/sharing/shareResult';

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

/* Animated count-up number */
const CountUp: React.FC<{ target: number; duration?: number; color?: string }> = ({
  target, duration = 1400, color = 'white',
}) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span style={{ color }}>{val.toLocaleString()}</span>;
};

/* Confetti particle */
const CONFETTI_COLORS = ['#f59e0b', '#f472b6', '#818cf8', '#34d399', '#fb923c', '#60a5fa'];
const Confetti: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 1.2,
      size: 5 + Math.random() * 7,
      rotate: Math.random() * 360,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-5vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate * 4, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size, height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
          }}
        />
      ))}
    </div>
  );
};

/* Stat chip */
const StatChip: React.FC<{ icon: string; label: string; value: string | number; color: string; delay?: number; show?: boolean }> = ({
  icon, label, value, color, delay = 0, show = true,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.85 }}
    animate={{ opacity: show ? 1 : 0, y: show ? 0 : 12, scale: show ? 1 : 0.85 }}
    transition={{ duration: 0.3, delay, ease: [0.34, 1.56, 0.64, 1] }}
    style={{
      flex: 1,
      minWidth: 96,
      padding: '10px 8px',
      borderRadius: 14,
      background: `${color}12`,
      border: `1px solid ${color}30`,
      textAlign: 'center',
    }}
    role="listitem"
    aria-label={`${label}: ${value}`}
  >
    <div style={{ fontSize: 16, marginBottom: 3 }} aria-hidden="true">{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
  </motion.div>
);

const MODE_SUGGESTIONS: Record<string, { mode: GameMode; label: string; desc: string; color: string }> = {
  [GameMode.ENDLESS]: { mode: GameMode.TIMED, label: 'Zamanlı Modu Dene', desc: '60 sn içinde en yüksek skor', color: '#f59e0b' },
  [GameMode.TIMED]: { mode: GameMode.ENDLESS, label: 'Sonsuz Modu Dene', desc: 'Sınırsız, tier rekoru kır', color: '#818cf8' },
  [GameMode.DAILY_CHALLENGE]: { mode: GameMode.ENDLESS, label: 'Sonsuz Modu Dene', desc: 'Pratik yap, hazırlan', color: '#818cf8' },
};

const MODE_RETRY_TIPS: Record<string, string> = {
  [GameMode.ENDLESS]: 'Tekrar dene: geniş boşlukları koru, tier yükselmeden önce satır aç.',
  [GameMode.TIMED]: 'Tekrar dene: ilk 30 saniyede combo kur, son sprintte satır temizle.',
  [GameMode.DAILY_CHALLENGE]: 'Tekrar dene: ilk hamlelerde tahtayı ortadan kilitleme.',
};

const TIER_NAMES: Record<number, string> = {
  0: 'Başlangıç',
  1: 'Gelişmiş',
  2: 'Uzman',
  3: 'Usta',
  4: 'Efsane',
  5: 'Kaos',
  6: 'VOID+',
};

export const GameOverModal: React.FC<GameOverModalProps> = React.memo(({
  isGameOver, score, displayScore, highScore, currentModeHighScore,
  isNewRecord, showRecordBadge, showButtons, gameMode,
  combo, maxCombo, todayBestCombo, finalSprintBonus, newRecordDiff, stats,
  difficultyTier, tierMovesSurvived = 0, surgeWasUsed, dailyClearHistory,
  shareStatus, showPWAPrompt, showIOSInstructions,
  timerStartTime, timerExpectedEnd,
  onClose, onPlayAgain, onTryMode, onShare, onInstallPWA, onCloseIOSInstructions,
}) => {
  const [visibleStats, setVisibleStats] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const modeIsEndless = gameMode === GameMode.ENDLESS;
  const modeIsTimed = gameMode === GameMode.TIMED;

  const scorePercentage = useMemo(() =>
    currentModeHighScore > 0 ? Math.round((score / currentModeHighScore) * 100) : 0,
    [score, currentModeHighScore]);

  const progressPercentage = useMemo(() =>
    currentModeHighScore > 0 ? Math.min((score / currentModeHighScore) * 100, 100) : 0,
    [score, currentModeHighScore]);

  // Calculate game duration in MM:SS format
  const gameDuration = useMemo(() => {
    if (!timerStartTime || !timerExpectedEnd) return '0:00';
    const durationMs = Date.now() - timerStartTime;
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timerStartTime, timerExpectedEnd]);

  // Get personal best from stats
  const personalBest = useMemo(() => {
    if (gameMode === GameMode.TIMED) {
      return stats?.timedHighScore || 0;
    }
    return currentModeHighScore;
  }, [gameMode, stats, currentModeHighScore]);

  const recordDiff = useMemo(() => {
    if (!isNewRecord) return 0;
    return Math.max(0, newRecordDiff || score - currentModeHighScore);
  }, [currentModeHighScore, isNewRecord, newRecordDiff, score]);

  const recordGap = useMemo(() => {
    if (isNewRecord || currentModeHighScore <= 0) return 0;
    return Math.max(0, currentModeHighScore - score);
  }, [currentModeHighScore, isNewRecord, score]);

  const lossReason = useMemo(() => {
    if (modeIsTimed) return 'Son bölümde tempo düştü; süre ve alan baskısı oyunu bitirdi.';
    return 'Son yerleşimden sonra kalan parçalar için uygun alan kalmadı.';
  }, [modeIsTimed]);

  const retryTip = MODE_RETRY_TIPS[gameMode] ?? 'Tekrar dene: tahtayı açık tut, büyük parçalar için yer bırak.';
  const reachedTierLabel = modeIsEndless
    ? `T${difficultyTier} ${TIER_NAMES[difficultyTier] ?? `Tier ${difficultyTier}`}`
    : '';

  useEffect(() => {
    if (isGameOver) {
      if (isNewRecord) {
        setTimeout(() => setShowConfetti(true), 800);
        setTimeout(() => setShowConfetti(false), 3200);
      }
      const timers = [
        setTimeout(() => setVisibleStats(1), 500),
        setTimeout(() => setVisibleStats(2), 680),
        setTimeout(() => setVisibleStats(3), 860),
        setTimeout(() => setVisibleStats(4), 1040),
        setTimeout(() => setVisibleStats(5), 1220),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setVisibleStats(0);
    }
  }, [isGameOver, isNewRecord]);

  if (!isGameOver) return null;

  const suggestion = MODE_SUGGESTIONS[gameMode];

  /* accent color by mode */
  const accentColor = modeIsTimed ? '#f59e0b' : '#818cf8';
  const accentLight = modeIsTimed ? 'rgba(245,158,11,0.15)' : 'rgba(129,140,248,0.15)';

  return (
    <>
      {showConfetti && <Confetti />}

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
            maxWidth: 360,
            margin: '0 16px',
            borderRadius: 28,
            background: 'linear-gradient(160deg, #13102a 0%, #1a1535 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Top accent line */}
          <div style={{
            height: 3,
            background: isNewRecord
              ? 'linear-gradient(90deg, #f59e0b, #f472b6, #f59e0b)'
              : `linear-gradient(90deg, ${accentColor}88, ${accentColor}, ${accentColor}88)`,
            backgroundSize: isNewRecord ? '200% 100%' : '100% 100%',
          }} />

          {/* Background radial glow */}
          <div style={{
            position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 200,
            background: isNewRecord
              ? 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)'
              : `radial-gradient(ellipse, ${accentColor}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '20px 20px 24px', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: accentLight,
                  border: `1px solid ${accentColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}
                aria-hidden="true"
                >
                  {modeIsTimed ? 'T' : modeIsEndless ? '∞' : 'G'}
                </div>
                <div>
                  <div 
                    id="game-over-title"
                    style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}
                  >
                    OYUN BİTTİ
                  </div>
                  <div 
                    id="game-over-description"
                    style={{ fontSize: 11, fontWeight: 600, color: accentColor, lineHeight: 1.2 }}
                  >
                    {modeIsTimed ? 'Zamanlı Mod' : modeIsEndless ? 'Sonsuz Mod' : 'Oyun'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { playClick(); onClose(); }}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                }}
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </div>

            {/* Score section */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <AnimatePresence>
                {isNewRecord && showRecordBadge && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 20, marginBottom: 10,
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
                style={{
                  fontSize: 52, fontWeight: 900, lineHeight: 1,
                  letterSpacing: '-1px',
                  background: isNewRecord
                    ? 'linear-gradient(135deg, #fbbf24, #f472b6)'
                    : 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
                role="heading"
                aria-level={1}
                aria-label={`Final skor: ${displayScore}`}
              >
                <CountUp target={displayScore} color="inherit" />
              </motion.div>

              {/* Personal Best Display */}
              {personalBest > 0 && (
                <div 
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}
                  aria-label={`En iyi skor: ${personalBest.toLocaleString()}`}
                >
                  EN İYİ: {personalBest.toLocaleString()}
                </div>
              )}

              {modeIsTimed && isNewRecord && recordDiff > 0 && (
                <div
                  style={{ fontSize: 12, color: '#fbbf24', marginTop: 6, fontWeight: 800 }}
                  aria-label={`Yeni rekor farkı: +${recordDiff.toLocaleString()}`}
                >
                  Yeni rekor farkı +{recordDiff.toLocaleString()}
                </div>
              )}

              {!isNewRecord && currentModeHighScore > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>
                  En iyinin %{scorePercentage}'i
                </div>
              )}

              {/* Progress bar vs best */}
              {!isNewRecord && currentModeHighScore > 0 && score > 0 && (
                <div 
                  style={{ marginTop: 10, width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`En iyi skora göre ilerleme: %${Math.round(progressPercentage)}`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`,
                      borderRadius: 2,
                      boxShadow: `0 0 8px ${accentColor}66`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Motivational recap */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              style={{
                display: 'grid',
                gap: 6,
                marginBottom: 16,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              aria-label="Oyun sonu özeti"
            >
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.74)', lineHeight: 1.35 }}>
                {lossReason}
              </div>
              {modeIsEndless && (
                <div style={{ fontSize: 12, color: '#fb923c', fontWeight: 800, lineHeight: 1.3 }}>
                  {reachedTierLabel} seviyesinde {tierMovesSurvived} hamle dayandın.
                </div>
              )}
              {recordGap > 0 && (
                <div style={{ fontSize: 12, color: accentColor, fontWeight: 800, lineHeight: 1.3 }}>
                  Rekora {recordGap.toLocaleString('tr-TR')} kaldı.
                </div>
              )}
              {todayBestCombo > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', lineHeight: 1.3 }}>
                  Bugünün en iyi kombosu: {todayBestCombo}×
                </div>
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', lineHeight: 1.3 }}>
                {retryTip}
              </div>
            </motion.div>

            {/* Stat chips */}
            {stats && (
              <div 
                style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}
                role="list"
                aria-label="Oyun istatistikleri"
              >
                {modeIsTimed ? (
                  <>
                    <StatChip icon="▬" label="Satır" value={stats.linesCleared || 0} color="#a855f7" delay={0.12} show={visibleStats >= 1} />
                    <StatChip icon="×" label="MAX COMBO" value={maxCombo > 0 ? `×${maxCombo}` : '--'} color="#f59e0b" delay={0.22} show={visibleStats >= 2} />
                    <StatChip icon="⏱" label="Süre" value={gameDuration} color="#34d399" delay={0.32} show={visibleStats >= 3} />
                    <StatChip icon="+" label="FINAL SPRINT" value={`+${finalSprintBonus.toLocaleString()}`} color="#fb923c" delay={0.42} show={visibleStats >= 4} />
                  </>
                ) : modeIsEndless ? (
                  <>
                    <StatChip icon="×" label="MAX COMBO" value={maxCombo > 0 ? `×${maxCombo}` : '--'} color="#f59e0b" delay={0.12} show={visibleStats >= 1} />
                    <StatChip icon="▬" label="Satır" value={stats.linesCleared || 0} color="#a855f7" delay={0.22} show={visibleStats >= 2} />
                    <StatChip icon="▲" label="MAX TIER" value={reachedTierLabel} color="#fb923c" delay={0.32} show={visibleStats >= 3} />
                    <StatChip icon="T" label="TIER HAMLE" value={tierMovesSurvived} color="#34d399" delay={0.42} show={visibleStats >= 4} />
                  </>
                ) : (
                  <>
                    <StatChip icon="×" label="MAX COMBO" value={maxCombo > 0 ? `×${maxCombo}` : '--'} color="#60a5fa" delay={0.12} show={visibleStats >= 1} />
                    <StatChip icon="▬" label="Satır" value={stats.linesCleared || 0} color="#a855f7" delay={0.22} show={visibleStats >= 2} />
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showButtons ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Play Again primary */}
              <button
                onClick={() => { playClick(); onPlayAgain(); }}
                style={{
                  width: '100%', padding: '15px 0',
                  borderRadius: 16, border: 'none',
                  background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
                  boxShadow: `0 8px 28px ${accentColor}50`,
                  color: 'white', fontSize: 15, fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  letterSpacing: '0.02em',
                }}
                aria-label="Tekrar oyna"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Tekrar Oyna
              </button>

              {/* Share */}
              <button
                onClick={onShare}
                style={{
                  width: '100%', padding: '12px 0',
                  borderRadius: 16, border: `1px solid ${accentColor}35`,
                  background: `${accentColor}10`,
                  color: accentColor, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
                aria-label={shareStatus === 'copied' ? 'Sonuç kopyalandı' : shareStatus === 'shared' ? 'Sonuç paylaşıldı' : 'Sonucu paylaş'}
              >
                <Share2 size={14} aria-hidden="true" />
                {shareStatus === 'copied' ? '✓ Kopyalandı!' : shareStatus === 'shared' ? '✓ Paylaşıldı!' : 'Sonucu Paylaş'}
              </button>

              {/* Mode suggestion */}
              {suggestion && (
                <button
                  onClick={() => { playClick(); onTryMode(suggestion.mode); }}
                  style={{
                    width: '100%', padding: '11px 14px',
                    borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  aria-label={`${suggestion.label}: ${suggestion.desc}`}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${suggestion.color}18`,
                    border: `1px solid ${suggestion.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}
                  aria-hidden="true"
                  >
                    {suggestion.mode === GameMode.TIMED ? 'T' : '∞'}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{suggestion.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{suggestion.desc}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)' }} aria-hidden="true" />
                </button>
              )}

              {/* PWA Prompt */}
              {showPWAPrompt && (
                <button
                  onClick={async () => { playClick(); await onInstallPWA(); }}
                  style={{
                    width: '100%', padding: '11px 14px',
                    borderRadius: 14, border: '1px solid rgba(59,130,246,0.3)',
                    background: 'rgba(59,130,246,0.08)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  aria-label="Ana ekrana ekle: Hızlı erişim için"
                >
                  <span style={{ fontSize: 20 }} aria-hidden="true">+</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>Ana Ekrana Ekle</div>
                    <div style={{ fontSize: 10, color: 'rgba(96,165,250,0.6)', marginTop: 2 }}>Hızlı erişim için</div>
                  </div>
                </button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
});
