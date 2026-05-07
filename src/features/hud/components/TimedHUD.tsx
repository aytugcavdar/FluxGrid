import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Volume2, VolumeX, Flame, Zap } from 'lucide-react';
import { useGameStore } from '../../game/store/gameStore';
import { useThemeStore } from '@shared/store/themeStore';
import { useStreakStore } from '@shared/store/streakStore';
import { AppState } from '@shared/types';
import { TIMED_MODE } from '../../game/constants';
import { getMuted, toggleMute, playClick } from '../../../utils/audio';
import { StreakBadge } from '@shared/components/StreakBadge';
import { StreakShieldModal } from '../../../app/components/StreakShieldModal';
import { AdManager } from '../../../utils/managers/adManager';

/* ─── Dairesel Timer ─── */
const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL_TIME = 120;

const CircularTimer: React.FC<{
  timeLeft: number;
  expectedEnd: number | null;
  totalTime?: number;
}> = ({ timeLeft, expectedEnd, totalTime = TOTAL_TIME }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD;
  const isWarning  = timeLeft <= TIMED_MODE.WARNING_THRESHOLD;

  useEffect(() => {
    if (!expectedEnd || !isCritical || timeLeft <= 0) return;
    let frameId: number;
    const update = () => {
      if (!spanRef.current) return;
      const remaining = Math.max(0, expectedEnd - Date.now());
      if (remaining <= 0) { spanRef.current.textContent = '0.0'; return; }
      spanRef.current.textContent = (remaining / 1000).toFixed(1);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [expectedEnd, isCritical, timeLeft]);

  const progress = Math.max(0, Math.min(1, timeLeft / totalTime));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ringColor = isCritical ? '#f87171' : isWarning ? '#fb923c' : '#818cf8';
  const glowColor = isCritical ? 'rgba(248,113,113,0.6)' : isWarning ? 'rgba(251,146,60,0.5)' : 'rgba(129,140,248,0.4)';
  const trackColor = isCritical ? 'rgba(248,113,113,0.12)' : isWarning ? 'rgba(251,146,60,0.1)' : 'rgba(129,140,248,0.1)';

  return (
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
      {/* Ambient glow */}
      <motion.div
        animate={isCritical
          ? { opacity: [0.4, 1, 0.4] }
          : { opacity: 0.6 }}
        transition={isCritical ? { duration: 0.7, repeat: Infinity } : {}}
        style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* SVG ring */}
      <svg width="68" height="68" viewBox="0 0 68 68"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle cx="34" cy="34" r={RADIUS}
          fill="none"
          stroke={trackColor}
          strokeWidth="4.5"
        />
        {/* Colored arc */}
        <motion.circle
          cx="34" cy="34" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 5px ${ringColor})` }}
        />
      </svg>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.span
          ref={spanRef}
          animate={isCritical ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={isCritical ? { duration: 0.5, repeat: Infinity } : {}}
          style={{
            fontSize: isCritical ? 18 : 15,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: ringColor,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isCritical && expectedEnd && timeLeft > 0
            ? (Math.max(0, expectedEnd - Date.now()) / 1000).toFixed(1)
            : timeLeft}
        </motion.span>
        <span style={{
          fontSize: 6, fontWeight: 700, letterSpacing: '0.1em',
          color: `${ringColor}99`, textTransform: 'uppercase', lineHeight: 1, marginTop: 2,
        }}>
          {isCritical ? '⚠ ALARM' : isWarning ? 'UYARI' : 'SÜRE'}
        </span>
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
    score, highScore, combo,
    timeLeft, timerExpectedEnd, setAppState,
    timedBoostMovesLeft, isGameOver,
  } = useGameStore();

  const { currentStreak, todayPlayed, streakShields, addStreakShield } = useStreakStore();
  const colors = useThemeStore(state => state.getThemeColors());
  const [muted, setMuted]     = useState(getMuted);
  const [showShieldModal, setShowShieldModal] = useState(false);



  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && timeLeft > 0;
  const isWarning  = timeLeft <= TIMED_MODE.WARNING_THRESHOLD;

  const scoreColor = combo >= 8 ? '#f472b6'
    : combo >= 5 ? '#fbbf24'
    : isCritical ? '#f87171'
    : '#f1f5f9';

  const handleMute        = () => { const v = toggleMute(); setMuted(v); };
  const handleShieldPress = () => { playClick(); setShowShieldModal(true); };
  const handleWatchAd     = async () => {
    const result = await AdManager.showRewardedStreakShield();
    if (result.success) addStreakShield();
    setShowShieldModal(false);
  };

  /* Combo pulse color */
  const comboGlow = combo >= 8 ? '#f472b6' : combo >= 5 ? '#f59e0b' : '#34d399';

  return (
    <>
      {/* ── Critical vignette ── */}
      {isCritical && (
        <motion.div
          animate={{ opacity: [0.06, 0.3, 0.06] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
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
              padding: '5px 10px 5px 10px',
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
            {/* Best score chip */}
            <div style={{
              position: 'absolute', top: -1, right: 9,
              fontSize: 6.5, fontWeight: 700, letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.28)',
              lineHeight: 1,
            }}>
              EN İYİ {highScore.toLocaleString()}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
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

          {/* Streak */}
          <div style={{ flexShrink: 0 }}>
            <StreakBadge
              streak={currentStreak}
              todayPlayed={todayPlayed}
              shields={streakShields}
              onShieldPress={handleShieldPress}
            />
          </div>

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
      </div>

      {/* ── Modals ── */}
      <StreakShieldModal
        isVisible={showShieldModal}
        currentStreak={currentStreak}
        streakBroken={false}
        onWatchAd={handleWatchAd}
        onClose={() => setShowShieldModal(false)}
        shieldsAvailable={streakShields}
      />
    </>
  );
});
