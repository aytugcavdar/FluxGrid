import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Volume2, VolumeX, Flame, Zap, Shield } from 'lucide-react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useStreakStore } from '@shared/store/streakStore';
import { AppState } from '@shared/types';
import { TIMED_MODE } from '../../game/constants';
import { getMuted, toggleMute, playClick } from '../../../utils/audio';
import { StreakShieldModal } from '../../../app/components/StreakShieldModal';
import { AdManager } from '../../../core/services/ads/AdManager';

/* Evaluated once at module load — avoids repeated media query lookups per render */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Dairesel Timer ─── */
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL_TIME = TIMED_MODE.DURATION_SECONDS;

const CircularTimer: React.FC<{
  timeLeft: number;
  expectedEnd: number | null;
  totalTime?: number;
}> = ({ timeLeft, expectedEnd, totalTime = TOTAL_TIME }) => {
  const criticalSpanRef = useRef<HTMLSpanElement>(null);
  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD;
  const isWarning  = timeLeft <= TIMED_MODE.WARNING_THRESHOLD;

  /* Critical mode: interval yazıyor, JSX children YOK → React overwrite etmez */
  useEffect(() => {
    if (!expectedEnd || !isCritical || timeLeft <= 0) return;
    const update = () => {
      if (!criticalSpanRef.current) return;
      const remaining = Math.max(0, expectedEnd - Date.now());
      criticalSpanRef.current.textContent = remaining <= 0
        ? '0.0'
        : (remaining / 1000).toFixed(1);
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [expectedEnd, isCritical, timeLeft]);

  const progress  = Math.max(0, Math.min(1, timeLeft / totalTime));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ringColor  = isCritical ? '#f87171' : isWarning ? '#fb923c' : '#818cf8';
  const glowColor  = isCritical ? 'rgba(248,113,113,0.65)' : isWarning ? 'rgba(251,146,60,0.55)' : 'rgba(129,140,248,0.45)';
  const trackColor = isCritical ? 'rgba(248,113,113,0.13)' : isWarning ? 'rgba(251,146,60,0.11)' : 'rgba(129,140,248,0.11)';

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>

      {/* Ambient glow */}
      <motion.div
        animate={isCritical ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.55 }}
        transition={isCritical ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      {/* SVG ring */}
      <svg width="72" height="72" viewBox="0 0 72 72"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        {/* Koyu merkez dolgusu — sayı okunabilirliği için */}
        <circle cx="36" cy="36" r={RADIUS - 4} fill="rgba(8,8,18,0.75)" />
        {/* Track */}
        <circle cx="36" cy="36" r={RADIUS}
          fill="none" stroke={trackColor} strokeWidth="5" />
        {/* Arc */}
        <motion.circle
          cx="36" cy="36" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
        />
      </svg>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
        {/* Kritik mod: sadece ref, JSX children yok */}
        {isCritical && expectedEnd && timeLeft > 0 ? (
          <motion.span
            ref={criticalSpanRef}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: 17, fontWeight: 900,
              letterSpacing: '-0.05em', color: ringColor,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 8px ${ringColor}88`,
            }}
          />
        ) : (
          <span style={{
            fontSize: timeLeft >= 100 ? 14 : 16,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            color: ringColor,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {timeLeft}
          </span>
        )}

        {/* Uyarı pulse dot — 6px label yerine */}
        {isWarning && (
          <motion.div
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 4, height: 4, borderRadius: '50%',
              background: ringColor,
              boxShadow: `0 0 5px ${ringColor}`,
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Animated Score ─── */
const AnimatedScore: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const prevRef = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (value > prevRef.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 250);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);
  return (
    <motion.span
      animate={bump ? { scale: [1, 1.08, 1], y: [0, -2, 0] } : { scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        fontSize: 24,
        fontWeight: 900,
        color,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ANA TIMED HUD
   ═══════════════════════════════════════════════════════════════ */
export const TimedHUD: React.FC = React.memo(() => {
  const {
    score, combo,
    timeLeft, timerExpectedEnd, setAppState,
    timedBoostMovesLeft, isGameOver,
    showNewRecordNotification, newRecordDiff,
    lastMilestoneShown,
    stats,
  } = useGameStore();

  const colors = useThemeStore(state => state.getThemeColors());
  const [muted, setMuted] = useState(getMuted);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const { currentStreak, streakShields, addStreakShield } = useStreakStore();

  const handleShieldAd = async () => {
    const result = await AdManager.showRewardedStreakShield();
    if (result.success) addStreakShield();
    setShowShieldModal(false);
  };

  // New record notification auto-hide
  useEffect(() => {
    if (showNewRecordNotification) {
      const timer = setTimeout(() => {
        useGameStore.getState().setState({
          showNewRecordNotification: false,
          newRecordDiff: 0,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNewRecordNotification]);

  // Milestone popup auto-hide
  useEffect(() => {
    if (lastMilestoneShown) {
      const timer = setTimeout(() => {
        useGameStore.getState().setState({
          lastMilestoneShown: null,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastMilestoneShown]);

  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && timeLeft > 0;
  const isWarning  = timeLeft <= TIMED_MODE.WARNING_THRESHOLD;

  const scoreColor = combo >= 8 ? '#f472b6'
    : combo >= 5 ? '#fbbf24'
    : isCritical ? '#f87171'
    : '#f1f5f9';

  const handleMute = () => { const v = toggleMute(); setMuted(v); };

  /* Combo pulse color */
  const comboGlow = combo >= 8 ? '#f472b6' : combo >= 5 ? '#f59e0b' : '#34d399';

  return (
    <>
      {/* ── Critical vignette - slower animation for performance ── */}
      {isCritical && (
        <motion.div
          animate={{ opacity: [0.06, 0.3, 0.06] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, transparent 30%, rgba(239,68,68,0.4) 100%)',
            pointerEvents: 'none', zIndex: 5,
          }}
        />
      )}

      {/* ══════ MOBILE HUD ══════ */}
      <div className="md:hidden w-full h-full" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── ROW 1 ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 5, padding: '0 6px', height: 60,
        }}>

          {/* Home btn */}
          <button
            id="hud-home-btn-timed"
            onClick={() => {
              playClick();
              document.body.classList.remove('dragging');
              useGameStore.getState().setDraggedPiece(null);
              if (!isGameOver) useGameStore.getState().saveCurrentGame();
              setAppState(AppState.HOME);
            }}
            style={{
              width: 36, height: 36, minWidth: 36, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', flexShrink: 0, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            }}
          >
            <Home size={16} />
          </button>

          {/* ── Score Card ── */}
          <motion.div
            className="combo-display"
            animate={{
              borderColor: combo >= 5
                ? [`${comboGlow}30`, `${comboGlow}70`, `${comboGlow}30`]
                : isCritical
                  ? ['rgba(248,113,113,0.2)', 'rgba(248,113,113,0.5)', 'rgba(248,113,113,0.2)']
                  : 'rgba(255,255,255,0.07)',
              boxShadow: combo >= 5
                ? [`0 0 0px ${comboGlow}00`, `0 0 16px ${comboGlow}30`, `0 0 0px ${comboGlow}00`]
                : isCritical
                  ? ['0 0 0px #f8717100', '0 0 14px rgba(248,113,113,0.2)', '0 0 0px #f8717100']
                  : '0 0 0px transparent',
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              flex: 1, minWidth: 0,
              padding: '8px 10px 5px 10px',
              background: combo >= 5
                ? `rgba(${combo >= 8 ? '244,114,182' : '245,158,11'},0.06)`
                : isCritical
                  ? 'rgba(248,113,113,0.06)'
                  : 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Personal Best Display */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 3,
              }}
              aria-label={`Personal best: ${stats.timedHighScore || 0}`}
            >
              <span style={{
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#22c55e',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                EN İYİ
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#22c55e',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textShadow: '0 0 8px rgba(34,197,94,0.3)',
              }}>
                {(stats.timedHighScore || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AnimatedScore value={score} color={scoreColor} />

              {/* Combo badge */}
              <AnimatePresence>
                {combo >= 2 && (
                  <motion.div
                    key={combo}
                    initial={{ scale: 0.4, opacity: 0, y: -6 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      padding: '2px 6px', borderRadius: 6,
                      background: `${comboGlow}18`,
                      border: `1px solid ${comboGlow}55`,
                      boxShadow: combo >= 5 ? `0 0 10px ${comboGlow}35` : 'none',
                    }}
                  >
                    {combo >= 3 && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      >
                        <Flame size={8} color={comboGlow} strokeWidth={2.5} />
                      </motion.div>
                    )}
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: comboGlow, lineHeight: 1,
                    }}>
                      {combo}×
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>


            </div>
          </motion.div>

          {/* ── Circular Timer ── */}
          <CircularTimer
            timeLeft={timeLeft}
            expectedEnd={timerExpectedEnd}
          />

          {/* Shield butonu */}
          <button
            id="hud-shield-btn-timed"
            onClick={() => setShowShieldModal(true)}
            style={{
              width: 36, height: 36, minWidth: 36, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer', position: 'relative',
            }}
          >
            <Shield size={15} style={{ color: streakShields > 0 ? '#60a5fa' : 'rgba(255,255,255,0.3)' }} />
            {streakShields > 0 && (
              <div style={{
                position: 'absolute', top: 5, right: 5,
                width: 5, height: 5, borderRadius: '50%',
                background: '#60a5fa',
                boxShadow: '0 0 4px #60a5fa',
              }} />
            )}
          </button>

          {/* Mute */}
          <button
            id="hud-mute-btn-timed"
            onClick={handleMute}
            style={{
              width: 36, height: 36, minWidth: 36, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            {muted
              ? <VolumeX size={15} style={{ color: 'rgba(255,255,255,0.25)' }} />
              : <Volume2 size={15} style={{ color: 'rgba(255,255,255,0.55)' }} />
            }
          </button>
        </div>

        {/* ── ROW 2: Boost bar (aktifse) ── */}
        <AnimatePresence>
          {timedBoostMovesLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden', padding: '0 6px' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 7, padding: '4px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 10,
                backdropFilter: 'blur(10px)',
              }}>
                <motion.div
                  animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <Zap size={10} color="#ef4444" fill="#ef4444" />
                </motion.div>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#ef4444', letterSpacing: '0.07em' }}>
                  FINAL SPRINT — ×1.5 AKTİF
                </span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {Array.from({ length: timedBoostMovesLeft }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, opacity: [0.7, 1, 0.7] }}
                      transition={{ delay: i * 0.05, opacity: { duration: 0.8, repeat: Infinity } }}
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#ef4444',
                        boxShadow: '0 0 6px rgba(239,68,68,0.9)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROW 3: New Record Notification ── */}
        <AnimatePresence>
          {showNewRecordNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ 
                duration: prefersReducedMotion ? 0.01 : 0.3, 
                ease: 'easeOut',
              }}
              style={{ 
                overflow: 'hidden', 
                padding: '0 6px',
              }}
              aria-live="polite"
              role="status"
            >
              <motion.div
                animate={{
                  boxShadow: prefersReducedMotion
                    ? '0 0 20px rgba(34,197,94,0.4)'
                    : [
                        '0 0 20px rgba(34,197,94,0.4)',
                        '0 0 30px rgba(34,197,94,0.6)',
                        '0 0 20px rgba(34,197,94,0.4)',
                      ],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: prefersReducedMotion ? 0 : Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: 'rgba(34,197,94,0.12)',
                  border: '2px solid rgba(34,197,94,0.5)',
                  borderRadius: 12,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <motion.span
                  animate={prefersReducedMotion ? { scale: 1 } : { scale: [1, 1.2, 1] }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: prefersReducedMotion ? 0 : Infinity,
                  }}
                  style={{ fontSize: 18, lineHeight: 1 }}
                >
                  🏆
                </motion.span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#22c55e',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                      textShadow: '0 0 10px rgba(34,197,94,0.5)',
                    }}
                  >
                    YENİ REKOR!
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#86efac',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    +{newRecordDiff.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ROW 4: Milestone Popup ── */}
        <AnimatePresence>
          {lastMilestoneShown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ 
                duration: prefersReducedMotion ? 0.01 : 0.3, 
                ease: 'easeOut',
              }}
              style={{ 
                overflow: 'hidden', 
                padding: '0 6px',
              }}
              aria-live="assertive"
              role="alert"
            >
              <motion.div
                animate={{
                  boxShadow: prefersReducedMotion
                    ? '0 0 24px rgba(168,85,247,0.5)'
                    : [
                        '0 0 24px rgba(168,85,247,0.5)',
                        '0 0 36px rgba(168,85,247,0.7)',
                        '0 0 24px rgba(168,85,247,0.5)',
                      ],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: prefersReducedMotion ? 0 : Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '12px 20px',
                  background: 'rgba(168,85,247,0.15)',
                  border: '2px solid rgba(168,85,247,0.6)',
                  borderRadius: 14,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#c084fc',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textShadow: '0 0 12px rgba(192,132,252,0.6)',
                  }}
                >
                  {lastMilestoneShown.label}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Streak Shield Modal */}
      <StreakShieldModal
        isVisible={showShieldModal}
        currentStreak={currentStreak}
        streakBroken={false}
        onWatchAd={handleShieldAd}
        onClose={() => setShowShieldModal(false)}
        shieldsAvailable={streakShields}
      />

    </>
  );
});
