import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Volume2, VolumeX, Flame, Zap } from 'lucide-react';
import { useGameStore } from '../../game/store/gameStore';
import { AppState } from '@shared/types';
import { TIMED_MODE } from '../../game/constants';
import { getMuted, toggleMute, playClick } from '../../../utils/audio';
import { ScoreImpactValue } from './ScoreImpactValue';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

/* Evaluated once at module load — avoids repeated media query lookups per render */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const useReducedGameplayMotion = prefersReducedMotion ||
  Capacitor.isNativePlatform();

/* ─── Dairesel Timer ─── */
const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL_TIME = TIMED_MODE.DURATION_SECONDS;
const HIGH_PRECISION_TIMER_SECONDS = 5;

const CircularTimer: React.FC<{
  timeLeft: number;
  expectedEnd: number | null;
  totalTime?: number;
  timedEvent?: {
    id: number;
    type: string;
    seconds?: number;
  } | null;
}> = ({ timeLeft, expectedEnd, totalTime = TOTAL_TIME, timedEvent }) => {
  const { t } = useTranslation();
  const criticalSpanRef = useRef<HTMLSpanElement>(null);
  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && timeLeft > 0;
  const isWarning  = timeLeft <= TIMED_MODE.WARNING_THRESHOLD && timeLeft > 0;
  const useHighPrecisionTimer = timeLeft <= HIGH_PRECISION_TIMER_SECONDS;
  const bonusSeconds = timedEvent?.seconds ?? 0;

  /* Critical mode: interval yazıyor, JSX children YOK → React overwrite etmez */
  useEffect(() => {
    if (!expectedEnd || !useHighPrecisionTimer || timeLeft <= 0) return;
    const update = () => {
      if (!criticalSpanRef.current) return;
      const remaining = Math.max(0, expectedEnd - Date.now());
      criticalSpanRef.current.textContent = remaining <= 0
        ? '0.0'
        : (remaining / 1000).toFixed(1);
    };
    update();
    const id = setInterval(update, useReducedGameplayMotion ? 1000 : 500);
    return () => clearInterval(id);
  }, [expectedEnd, timeLeft, useHighPrecisionTimer]);

  const progress  = Math.max(0, Math.min(1, timeLeft / totalTime));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ringColor  = isCritical ? '#f59e0b' : isWarning ? '#fb923c' : '#818cf8';
  const glowColor  = useReducedGameplayMotion
    ? 'rgba(129,140,248,0.12)'
    : isCritical ? 'rgba(245,158,11,0.55)' : isWarning ? 'rgba(251,146,60,0.55)' : 'rgba(129,140,248,0.45)';
  const trackColor = isCritical ? 'rgba(245,158,11,0.12)' : isWarning ? 'rgba(251,146,60,0.11)' : 'rgba(129,140,248,0.11)';

  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>

      {/* Ambient glow */}
      <motion.div
        animate={useHighPrecisionTimer && !useReducedGameplayMotion ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.55 }}
        transition={useHighPrecisionTimer && !useReducedGameplayMotion ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
        style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 68%)`,
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence>
        {bonusSeconds > 0 && (
          <motion.div
            key={timedEvent?.id}
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            exit={{ opacity: 0, y: -22, scale: 0.96 }}
            transition={{ duration: useReducedGameplayMotion ? 0.18 : 0.42, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 2,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(20,184,166,0.16)',
              border: '1px solid rgba(45,212,191,0.58)',
              color: '#99f6e4',
              fontSize: 10,
              fontWeight: 950,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              boxShadow: useReducedGameplayMotion ? 'none' : '0 0 10px rgba(45,212,191,0.28)',
              pointerEvents: 'none',
            }}
          >
            +{bonusSeconds}s
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG ring */}
      <svg width="48" height="48" viewBox="0 0 48 48"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        {/* Koyu merkez dolgusu — sayı okunabilirliği için */}
        <circle cx="24" cy="24" r={RADIUS - 3} fill="rgba(8,8,18,0.75)" />
        {/* Track */}
        <circle cx="24" cy="24" r={RADIUS}
          fill="none" stroke={trackColor} strokeWidth="4" />
        {/* Arc */}
        <motion.circle
          cx="24" cy="24" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{ filter: useReducedGameplayMotion ? 'none' : `drop-shadow(0 0 6px ${ringColor})` }}
        />
      </svg>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
      }}>
        {/* Kritik mod: sadece ref, JSX children yok */}
        {useHighPrecisionTimer && expectedEnd && timeLeft > 0 ? (
          <motion.span
            ref={criticalSpanRef}
            animate={useReducedGameplayMotion ? { scale: 1 } : { scale: [1, 1.1, 1] }}
            transition={useReducedGameplayMotion ? { duration: 0 } : { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontSize: 13, fontWeight: 900,
              letterSpacing: '-0.05em', color: ringColor,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              textShadow: useReducedGameplayMotion ? 'none' : `0 0 8px ${ringColor}88`,
            }}
          />
        ) : (
          <span style={{
            fontSize: timeLeft >= 100 ? 11 : 13,
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
            animate={useReducedGameplayMotion || !useHighPrecisionTimer ? { opacity: 1 } : { opacity: [1, 0.25, 1] }}
            transition={useReducedGameplayMotion || !useHighPrecisionTimer ? { duration: 0 } : { duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 3, height: 3, borderRadius: '50%',
              background: ringColor,
              boxShadow: useReducedGameplayMotion ? 'none' : `0 0 5px ${ringColor}`,
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {isCritical && (
          <motion.div
            key="final-window"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute',
              left: 4,
              right: 4,
              bottom: -11,
              padding: '1px 5px',
              borderRadius: 999,
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fef3c7',
              fontSize: 6.5,
              fontWeight: 900,
              letterSpacing: '0.1em',
              lineHeight: 1,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {t('timedHud.final')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Animated Score ─── */
const AnimatedScore: React.FC<{ value: number; color: string; deferImpact: boolean }> = ({ value, color, deferImpact }) => {
  const digitCount = String(Math.max(0, Math.floor(value))).length;
  const fontSize = digitCount >= 9 ? 18 : digitCount >= 8 ? 20 : digitCount >= 7 ? 22 : 24;

  return (
    <ScoreImpactValue
      value={value}
      color={color}
      deferImpact={deferImpact}
      wrapperStyle={{ maxWidth: '100%', overflow: 'hidden' }}
      style={{
        fontSize,
        fontWeight: 900,
        letterSpacing: digitCount >= 8 ? '-0.05em' : '-0.04em',
        maxWidth: '100%',
      }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════
   ANA TIMED HUD
   ═══════════════════════════════════════════════════════════════ */
export const TimedHUD: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const {
    score, combo,
    timeLeft, timerExpectedEnd, setAppState,
    timedBoostMovesLeft, isGameOver,
    lastMilestoneShown,
    timedMomentum, timedLastChanceAvailable, timedLastChanceActive,
    timedFinalRushLocked,
    lastTimedEvent,
    stats,
    lastAction,
  } = useGameStore();

  const [muted, setMuted] = useState(getMuted);

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

  useEffect(() => {
    if (!lastTimedEvent || timedLastChanceActive) return;
    const eventId = lastTimedEvent.id;
    const timer = window.setTimeout(() => {
      const current = useGameStore.getState();
      if (current.lastTimedEvent?.id === eventId) {
        current.setState({ lastTimedEvent: null });
      }
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [lastTimedEvent, timedLastChanceActive]);

  const isCritical = timeLeft <= TIMED_MODE.FINAL_SECONDS_THRESHOLD && timeLeft > 0;
  const useUrgentTimerMotion = timeLeft <= HIGH_PRECISION_TIMER_SECONDS && timeLeft > 0;

  const scoreColor = combo >= 8 ? '#f472b6'
    : combo >= 5 ? '#fbbf24'
    : isCritical ? '#f59e0b'
    : '#f1f5f9';

  const handleMute = () => { const v = toggleMute(); setMuted(v); };

  /* Combo pulse color */
  const comboGlow = combo >= 8 ? '#f472b6' : combo >= 5 ? '#f59e0b' : '#34d399';
  const isFinalRush = timedFinalRushLocked || isCritical;
  const timedInfoLabel = timedLastChanceActive
    ? t('timedHud.clearSeconds', { seconds: TIMED_MODE.LAST_CHANCE_SECONDS })
    : isFinalRush
      ? t('timedHud.timeEqualsScore')
      : timedLastChanceAvailable ? t('timedHud.lastChance') : t('timedHud.used');
  const boostLabel = timedLastChanceActive
    ? t('timedHud.lastMove')
    : isFinalRush
      ? timedInfoLabel
      : timedMomentum >= 80 ? t('timedHud.boostReady') : t('timedHud.clearBoost');
  const timedEventLabel = (() => {
    if (!lastTimedEvent) return '';
    if (lastTimedEvent.type === 'LAST_CHANCE') {
      return t('timedHud.events.lastChance', { seconds: lastTimedEvent.seconds || TIMED_MODE.LAST_CHANCE_SECONDS });
    }
    if (lastTimedEvent.type === 'TARGET') {
      const parts = [t('timedHud.events.target', { count: lastTimedEvent.targetCount || 1 })];
      if ((lastTimedEvent.seconds || 0) > 0) {
        parts.push(t('timedHud.events.secondsReward', { seconds: lastTimedEvent.seconds }));
      }
      if ((lastTimedEvent.score || 0) > 0) {
        parts.push(t('timedHud.events.scoreReward', { score: lastTimedEvent.score }));
      }
      return parts.join(' · ');
    }
    if (lastTimedEvent.type === 'FREEZE') {
      return t('timedHud.events.freeze', { seconds: lastTimedEvent.seconds || 0 });
    }
    if (lastTimedEvent.type === 'CLEAR_TIME') {
      return t('timedHud.events.clearTime', { seconds: lastTimedEvent.seconds || 0 });
    }
    return t('timedHud.events.finalRush', { score: lastTimedEvent.score || 0 });
  })();

  return (
    <>
      {/* ══════ MOBILE HUD ══════ */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-area-top, 0px) + 76px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 38,
          width: 'min(250px, calc(100vw - 32px))',
          height: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '3px 8px',
          borderRadius: 999,
          background: 'rgba(8,12,20,0.9)',
          border: `1px solid ${timedLastChanceActive ? 'rgba(251,191,36,0.52)' : 'rgba(251,191,36,0.28)'}`,
          pointerEvents: 'none',
        }}
        aria-label={t('timedHud.boostAria', {
          progress: timedMomentum,
          status: timedLastChanceAvailable ? t('timedHud.ready') : t('timedHud.used'),
        })}
      >
        <Zap size={11} color="#fbbf24" />
        <span style={{ fontSize: 7.5, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.08em' }}>
          {t('timedHud.boost')}
        </span>
        <div style={{
          flex: 1,
          height: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.13)',
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${timedMomentum}%` }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #f59e0b, #fde68a)',
              boxShadow: useReducedGameplayMotion ? 'none' : '0 0 8px rgba(251,191,36,0.28)',
            }}
          />
        </div>
        <span style={{
          fontSize: 7,
          fontWeight: 900,
          color: timedLastChanceActive
            ? '#fecaca'
            : isFinalRush ? '#fef3c7'
            : timedLastChanceAvailable ? '#86efac' : 'rgba(255,255,255,0.3)',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          display: 'inline',
        }}>
          {boostLabel}
        </span>
      </div>

      <AnimatePresence>
        {lastTimedEvent && lastTimedEvent.type !== 'CLEAR_TIME' && (
          <motion.div
            key={lastTimedEvent.id}
            initial={{ opacity: 0, y: -6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.96 }}
            transition={{ duration: useReducedGameplayMotion ? 0.12 : 0.22, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 'calc(var(--safe-area-top, 0px) + 104px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              padding: '7px 12px',
              borderRadius: 10,
              background: 'rgba(30,22,8,0.94)',
              border: `1px solid #fbbf24`,
              color: '#fef3c7',
              fontSize: 10,
              fontWeight: 950,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 6px 18px rgba(0,0,0,0.32)',
            }}
            role="status"
            aria-live="assertive"
          >
            {timedEventLabel}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="md:hidden w-full h-full" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── ROW 1 ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 6, padding: '0 8px', height: 50,
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
              width: 34, height: 34, minWidth: 34, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: useReducedGameplayMotion ? 'none' : 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', flexShrink: 0, cursor: 'pointer',
              boxShadow: useReducedGameplayMotion ? '0 1px 3px rgba(0,0,0,0.16)' : '0 2px 10px rgba(0,0,0,0.25)',
            }}
          >
            <Home size={16} />
          </button>

          {/* ── Score Card ── */}
          <motion.div
            className="combo-display"
            animate={useReducedGameplayMotion ? {
              borderColor: combo >= 5 ? `${comboGlow}55` : isCritical ? 'rgba(245,158,11,0.32)' : 'rgba(255,255,255,0.07)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.16)',
            } : {
              borderColor: combo >= 5
                ? [`${comboGlow}30`, `${comboGlow}70`, `${comboGlow}30`]
                : useUrgentTimerMotion
                  ? ['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.42)', 'rgba(245,158,11,0.18)']
                  : 'rgba(255,255,255,0.07)',
              boxShadow: combo >= 5
                ? [`0 0 0px ${comboGlow}00`, `0 0 10px ${comboGlow}24`, `0 0 0px ${comboGlow}00`]
                : useUrgentTimerMotion
                  ? ['0 0 0px #f59e0b00', '0 0 9px rgba(245,158,11,0.14)', '0 0 0px #f59e0b00']
                  : '0 0 0px transparent',
            }}
            transition={useReducedGameplayMotion
              ? { duration: 0.15 }
              : { duration: 1.2, repeat: combo >= 5 || useUrgentTimerMotion ? Infinity : 0, ease: 'easeInOut' }}
            style={{
              flex: 1, minWidth: 0,
              padding: '6px 9px 5px 9px',
              background: combo >= 5
                ? `rgba(${combo >= 8 ? '244,114,182' : '245,158,11'},0.06)`
                : isCritical
                  ? 'rgba(245,158,11,0.055)'
                  : 'rgba(255,255,255,0.04)',
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: useReducedGameplayMotion ? 'none' : 'blur(12px)',
              position: 'relative',
              overflow: 'hidden',
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
              aria-label={t('timedHud.personalBestAria', { score: stats.timedHighScore || 0 })}
            >
              <span style={{
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#22c55e',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                {t('hud.best')}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#22c55e',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                textShadow: useReducedGameplayMotion ? 'none' : '0 0 8px rgba(34,197,94,0.3)',
              }}>
                {(stats.timedHighScore || 0).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, overflow: 'hidden' }}>
              <AnimatedScore
                value={score}
                color={scoreColor}
                deferImpact={lastAction?.type === 'CLEAR'}
              />

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
                      boxShadow: combo >= 5 && !useReducedGameplayMotion ? `0 0 7px ${comboGlow}28` : 'none',
                    }}
                  >
                    {combo >= 3 && (
                      <motion.div
                        animate={useReducedGameplayMotion ? { scale: 1 } : { scale: [1, 1.3, 1] }}
                        transition={useReducedGameplayMotion ? { duration: 0 } : { duration: 0.6, repeat: Infinity }}
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
            timedEvent={lastTimedEvent}
          />

          {/* Mute */}
          <button
            id="hud-mute-btn-timed"
            onClick={handleMute}
            style={{
              width: 34, height: 34, minWidth: 34, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: useReducedGameplayMotion ? 'none' : 'blur(8px)',
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
                background: 'rgba(251,191,36,0.075)',
                border: '1px solid rgba(251,191,36,0.22)',
                borderRadius: 10,
                backdropFilter: useReducedGameplayMotion ? 'none' : 'blur(10px)',
              }}>
                <motion.div
                  animate={useReducedGameplayMotion ? { rotate: 0, scale: 1 } : { rotate: [0, -8, 8, 0], scale: [1, 1.2, 1] }}
                  transition={useReducedGameplayMotion ? { duration: 0 } : { duration: 0.6, repeat: Infinity }}
                >
                  <Zap size={10} color="#fbbf24" fill="#fbbf24" />
                </motion.div>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#fef3c7', letterSpacing: '0.07em' }}>
                  {t('timedHud.finalSprintActive')}
                </span>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {Array.from({ length: timedBoostMovesLeft }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={useReducedGameplayMotion ? { scale: 1, opacity: 1 } : { scale: 1, opacity: [0.7, 1, 0.7] }}
                      transition={useReducedGameplayMotion
                        ? { duration: 0.12, delay: i * 0.05 }
                        : { delay: i * 0.05, opacity: { duration: 0.8, repeat: Infinity } }}
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: '#fbbf24',
                        boxShadow: useReducedGameplayMotion ? 'none' : '0 0 6px rgba(251,191,36,0.42)',
                      }}
                    />
                  ))}
                </div>
              </div>
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
                  boxShadow: useReducedGameplayMotion
                    ? '0 2px 8px rgba(0,0,0,0.18)'
                    : [
                        '0 0 24px rgba(168,85,247,0.5)',
                        '0 0 36px rgba(168,85,247,0.7)',
                        '0 0 24px rgba(168,85,247,0.5)',
                      ],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: useReducedGameplayMotion ? 0 : Infinity,
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
                  backdropFilter: useReducedGameplayMotion ? 'none' : 'blur(12px)',
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#c084fc',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textShadow: useReducedGameplayMotion ? 'none' : '0 0 12px rgba(192,132,252,0.6)',
                  }}
                >
                  {t(`timedHud.milestones.${lastMilestoneShown.id}`, lastMilestoneShown.label)}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </>
  );
});
