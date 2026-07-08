import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { usePerformanceStore } from '../../performance/store/performanceStore';

export const SCORE_IMPACT_EVENT = 'fluxgrid:score-impact';

export interface ScoreImpactDetail {
  score: number;
  delta: number;
  combo: number;
  color: string;
}

interface ScoreImpactValueProps {
  value: number;
  color: string;
  deferImpact?: boolean;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
}

export const ScoreImpactValue: React.FC<ScoreImpactValueProps> = React.memo(({
  value,
  color,
  deferImpact = false,
  style,
  wrapperStyle,
}) => {
  const deviceTier = usePerformanceStore(state => state.deviceTier);
  const [displayValue, setDisplayValue] = useState(value);
  const [impactActive, setImpactActive] = useState(false);
  const [impactColor, setImpactColor] = useState(color);
  const [impactScale, setImpactScale] = useState(1.07);
  const [impactGlow, setImpactGlow] = useState(14);
  const displayedValueRef = useRef(value);
  const latestValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const impactTimerRef = useRef<number | null>(null);
  const isNativeApp = Capacitor.isNativePlatform();
  const minimalMotion = deviceTier === 'low';
  const reducedMotion = minimalMotion || isNativeApp || deviceTier === 'low-mid' || deviceTier === 'mid-low' || deviceTier === 'mid';

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const animateTo = useCallback((targetValue: number, accentColor = color, comboLevel: number = 1) => {
    clearFallback();

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    if (impactTimerRef.current !== null) {
      window.clearTimeout(impactTimerRef.current);
    }

    const safeTarget = Math.max(0, Math.round(targetValue));
    const startValue = displayedValueRef.current;
    const startedAt = performance.now();
    const duration = minimalMotion ? 90 : reducedMotion ? 160 : 260;

    setImpactColor(accentColor);
    setImpactScale(reducedMotion ? 1.04 : Math.min(1.13, 1.07 + (Math.max(0, comboLevel - 1) * 0.008)));
    setImpactGlow(reducedMotion ? 8 : Math.min(22, 14 + (Math.max(0, comboLevel - 1) * 1.1)));
    setImpactActive(true);
    impactTimerRef.current = window.setTimeout(() => setImpactActive(false), reducedMotion ? 170 : 300);

    if (safeTarget <= startValue) {
      displayedValueRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(startValue + ((safeTarget - startValue) * eased));
      displayedValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
  }, [clearFallback, color, minimalMotion, reducedMotion]);

  useEffect(() => {
    latestValueRef.current = value;

    if (value <= displayedValueRef.current) {
      clearFallback();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      displayedValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    if (!deferImpact) {
      animateTo(value);
      return;
    }

    clearFallback();
    fallbackTimerRef.current = window.setTimeout(() => animateTo(value), 1800);
  }, [animateTo, clearFallback, deferImpact, value]);

  useEffect(() => {
    const handleScoreImpact = (event: Event) => {
      const detail = (event as CustomEvent<ScoreImpactDetail>).detail;
      if (!detail || detail.score > latestValueRef.current) return;
      if (detail.score <= displayedValueRef.current) return;
      animateTo(detail.score, detail.color, detail.combo);
    };

    window.addEventListener(SCORE_IMPACT_EVENT, handleScoreImpact);
    return () => window.removeEventListener(SCORE_IMPACT_EVENT, handleScoreImpact);
  }, [animateTo]);

  useEffect(() => () => {
    clearFallback();
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    if (impactTimerRef.current !== null) {
      window.clearTimeout(impactTimerRef.current);
    }
  }, [clearFallback]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        ...wrapperStyle,
      }}
    >
      <motion.span
        data-score-target
        animate={impactActive
          ? {
              scale: [1, impactScale, 1],
              y: [0, -1, 0],
              textShadow: [
                `0 0 0 ${impactColor}00`,
                `0 0 ${impactGlow}px ${impactColor}cc`,
                `0 0 0 ${impactColor}00`,
              ],
            }
          : { scale: 1, y: 0, textShadow: `0 0 0 ${impactColor}00` }}
        transition={{ duration: reducedMotion ? 0.16 : 0.3, ease: 'easeOut' }}
        style={{
          color,
          lineHeight: 1,
          display: 'block',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          transformOrigin: 'left center',
          ...style,
        }}
      >
        {displayValue.toLocaleString()}
      </motion.span>
    </div>
  );
});
