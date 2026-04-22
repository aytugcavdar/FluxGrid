/**
 * Quality Presets for Performance Adaptation
 */

import { QualityConfig, QualityPreset } from '../types/animationTypes';

export const QUALITY_PRESETS: Record<QualityPreset, QualityConfig> = {
  high: {
    name: 'high',
    particleMultiplier: 1.0,
    animationDurationMultiplier: 1.0,
    maxParticles: 200,
    enableTrailParticles: true,
    enableGlowEffects: true,
  },
  medium: {
    name: 'medium',
    particleMultiplier: 0.6,
    animationDurationMultiplier: 0.8,
    maxParticles: 120,
    enableTrailParticles: false,
    enableGlowEffects: true,
  },
  low: {
    name: 'low',
    particleMultiplier: 0.4,
    animationDurationMultiplier: 0.6,
    maxParticles: 60,
    enableTrailParticles: false,
    enableGlowEffects: false,
  },
};

export const PERFORMANCE_THRESHOLDS = {
  targetFPS: 60,
  lowFPSThreshold: 50,
  criticalFPSThreshold: 30,
  particleLimitMobile: 100,
  particleLimitDesktop: 200,
} as const;
