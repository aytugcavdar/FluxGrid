import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { TIER_NAMES, TIER_THRESHOLDS } from '../../game/constants';
import { getTierProgress } from '../../game/store/helpers/progressionSystem';
import { calculateEndlessLoop } from '../../game/store/helpers/tierSystem';
import { usePerformanceStore } from '../../performance/store/performanceStore';
import { SCORE_IMPACT_EVENT, type ScoreImpactDetail } from './ScoreImpactValue';
import { useTranslation } from 'react-i18next';

const TIER_COLORS = [
  '#94a3b8',
  '#60a5fa',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#c084fc',
  '#f59e0b',
] as const;

export interface TierVisualState {
  tier: number;
  progress: number;
  scoreNeeded: number;
  isMaxTier: boolean;
  loop: number;
}

export const getTierVisualState = (score: number): TierVisualState => {
  const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
  const tier = Math.max(0, TIER_THRESHOLDS.filter(threshold => safeScore >= threshold).length - 1);
  const isMaxTier = tier >= TIER_THRESHOLDS.length - 1;
  const nextThreshold = TIER_THRESHOLDS[tier + 1] ?? safeScore;

  return {
    tier,
    progress: isMaxTier ? 100 : getTierProgress(safeScore, tier),
    scoreNeeded: isMaxTier ? 0 : Math.max(0, nextThreshold - safeScore),
    isMaxTier,
    loop: isMaxTier ? calculateEndlessLoop(safeScore) : 0,
  };
};

interface TierProgressInlineProps {
  score: number;
  deferImpact: boolean;
  gravityCharge?: number;
  gravityTriggered?: boolean;
}

export const TierProgressInline: React.FC<TierProgressInlineProps> = React.memo(({
  score,
  deferImpact,
  gravityCharge = 0,
  gravityTriggered = false,
}) => {
  const { t, i18n } = useTranslation();
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const initial = getTierVisualState(score);
  const [visual, setVisual] = useState(initial);
  const [tierUp, setTierUp] = useState(false);
  const [impactActive, setImpactActive] = useState(false);
  const [showTriggeredCharge, setShowTriggeredCharge] = useState(false);
  const latestScoreRef = useRef(score);
  const displayedScoreRef = useRef(score);
  const visualTierRef = useRef(initial.tier);
  const fallbackTimerRef = useRef<number | null>(null);
  const arrivalTimerRef = useRef<number | null>(null);
  const tierTimerRef = useRef<number | null>(null);
  const impactTimerRef = useRef<number | null>(null);
  const gravityTriggerTimerRef = useRef<number | null>(null);
  const useReducedGameplayMotion = Capacitor.isNativePlatform() ||
    deviceTier === 'low' ||
    deviceTier === 'low-mid' ||
    deviceTier === 'mid-low' ||
    deviceTier === 'mid';

  const clearTimers = useCallback(() => {
    [fallbackTimerRef, arrivalTimerRef, tierTimerRef, impactTimerRef].forEach(timerRef => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });
  }, []);

  const applyScore = useCallback((targetScore: number) => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (tierTimerRef.current !== null) {
      window.clearTimeout(tierTimerRef.current);
      tierTimerRef.current = null;
    }

    const next = getTierVisualState(targetScore);
    const currentTier = visualTierRef.current;
    displayedScoreRef.current = targetScore;
    setImpactActive(true);
    if (impactTimerRef.current !== null) window.clearTimeout(impactTimerRef.current);
    impactTimerRef.current = window.setTimeout(() => setImpactActive(false), useReducedGameplayMotion ? 220 : 420);

    if (next.tier > currentTier) {
      setTierUp(true);
      setVisual(previous => ({ ...previous, progress: 100, scoreNeeded: 0 }));
      tierTimerRef.current = window.setTimeout(() => {
        visualTierRef.current = next.tier;
        setVisual(next);
        setTierUp(false);
      }, useReducedGameplayMotion ? 150 : 240);
      return;
    }

    visualTierRef.current = next.tier;
    setVisual(next);
    setTierUp(false);
  }, [useReducedGameplayMotion]);

  useEffect(() => {
    latestScoreRef.current = score;

    if (score <= displayedScoreRef.current) {
      clearTimers();
      const next = getTierVisualState(score);
      displayedScoreRef.current = score;
      visualTierRef.current = next.tier;
      setVisual(next);
      setTierUp(false);
      setImpactActive(false);
      return;
    }

    if (!deferImpact) {
      applyScore(score);
      return;
    }

    if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = window.setTimeout(() => applyScore(score), useReducedGameplayMotion ? 900 : 1900);
  }, [applyScore, clearTimers, deferImpact, score, useReducedGameplayMotion]);

  useEffect(() => {
    const handleScoreImpact = (event: Event) => {
      const detail = (event as CustomEvent<ScoreImpactDetail>).detail;
      if (!detail || detail.score > latestScoreRef.current) return;
      if (detail.score <= displayedScoreRef.current) return;

      if (arrivalTimerRef.current !== null) window.clearTimeout(arrivalTimerRef.current);
      arrivalTimerRef.current = window.setTimeout(() => applyScore(detail.score), 60);
    };

    window.addEventListener(SCORE_IMPACT_EVENT, handleScoreImpact);
    return () => window.removeEventListener(SCORE_IMPACT_EVENT, handleScoreImpact);
  }, [applyScore]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!gravityTriggered) return;

    setShowTriggeredCharge(true);
    if (gravityTriggerTimerRef.current !== null) {
      window.clearTimeout(gravityTriggerTimerRef.current);
    }
    gravityTriggerTimerRef.current = window.setTimeout(() => {
      setShowTriggeredCharge(false);
      gravityTriggerTimerRef.current = null;
    }, useReducedGameplayMotion ? 320 : 520);

    return () => {
      if (gravityTriggerTimerRef.current !== null) {
        window.clearTimeout(gravityTriggerTimerRef.current);
        gravityTriggerTimerRef.current = null;
      }
    };
  }, [gravityTriggered, score, useReducedGameplayMotion]);

  const color = TIER_COLORS[visual.tier] ?? TIER_COLORS[0];
  const isGravityChargeMode = visual.isMaxTier;
  const safeGravityCharge = Math.max(0, Math.min(2, Math.floor(gravityCharge)));
  const displayedGravityCharge = showTriggeredCharge ? 3 : safeGravityCharge;
  const numberLocale = i18n.resolvedLanguage === 'tr' ? 'tr-TR' : 'en-US';
  const rightLabel = tierUp
    ? t('tier.tierUp')
    : isGravityChargeMode
      ? t('tier.gravityCharge', { current: displayedGravityCharge, total: 3 })
      : t('tier.scoreRemaining', { score: visual.scoreNeeded.toLocaleString(numberLocale) });
  const tierLabel = visual.loop > 0
    ? t('tier.loop', { tier: visual.tier, loop: visual.loop })
    : `T${visual.tier} ${t(`tier.names.${visual.tier}`, TIER_NAMES[visual.tier] ?? '')}`.trim();

  return (
    <div
      role="progressbar"
      aria-label={isGravityChargeMode
        ? t('tier.gravityAria', { tier: visual.tier, current: displayedGravityCharge, total: 3 })
        : t('tier.progressAria', { tier: visual.tier, progress: Math.round(visual.progress) })}
      aria-valuemin={0}
      aria-valuemax={isGravityChargeMode ? 3 : 100}
      aria-valuenow={isGravityChargeMode ? displayedGravityCharge : Math.round(visual.progress)}
      style={{ width: '100%', minWidth: 0 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 3,
        fontSize: 7.5,
        fontWeight: 850,
        lineHeight: 1,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}>
        <motion.span
          key={visual.tier}
          initial={{ opacity: 0.45, y: 2 }}
          animate={{ opacity: 0.9, y: 0 }}
          style={{ color }}
        >
          {tierLabel}
        </motion.span>
        <span style={{ color: tierUp ? color : 'rgba(255,255,255,0.48)' }}>
          {rightLabel}
        </span>
      </div>

      {isGravityChargeMode ? (
        <div style={{
          height: 3,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 2,
        }}>
          {[0, 1, 2].map(index => {
            const filled = index < displayedGravityCharge;
            return (
              <motion.span
                key={index}
                data-gravity-charge-segment={index}
                data-filled={filled ? 'true' : 'false'}
                animate={{
                  backgroundColor: filled ? color : 'rgba(255,255,255,0.09)',
                  boxShadow: filled && !useReducedGameplayMotion ? `0 0 5px ${color}88` : `0 0 0 ${color}00`,
                }}
          transition={{ duration: useReducedGameplayMotion ? 0.1 : 0.18, ease: 'easeOut' }}
                style={{ borderRadius: 999 }}
              />
            );
          })}
        </div>
      ) : (
        <div style={{
          position: 'relative',
          height: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.09)',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.035)',
        }}>
          <motion.div
            animate={{
              width: `${visual.progress}%`,
              boxShadow: useReducedGameplayMotion
                ? 'none'
                : impactActive ? `0 0 9px ${color}` : `0 0 3px ${color}55`,
            }}
            transition={{
              width: { duration: useReducedGameplayMotion ? 0.14 : tierUp ? 0.22 : 0.32, ease: 'easeOut' },
              boxShadow: { duration: useReducedGameplayMotion ? 0.1 : 0.18 },
            }}
            style={{
              position: 'absolute',
              inset: '0 auto 0 0',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${color}99, ${color})`,
            }}
          >
            {impactActive && (
              <span style={{
                position: 'absolute',
                top: -1,
                right: -1,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: useReducedGameplayMotion ? 'none' : `0 0 7px ${color}`,
              }} />
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
});
