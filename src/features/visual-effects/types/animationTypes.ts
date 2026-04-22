/**
 * Animation Types for Enhanced Visual Feedback System
 * 
 * Core TypeScript interfaces for animation tiers, states, and configurations
 */

// Animation Tier Levels
export type AnimationTierLevel = 'light' | 'medium' | 'epic';

// Combo Animation Tier
export interface ComboAnimationTier {
  level: AnimationTierLevel;
  scale: number;
  color: string;
  pulseFrequency: number; // Hz
  particlesPerSecond: number;
}

// Quality Presets
export type QualityPreset = 'high' | 'medium' | 'low';

export interface QualityConfig {
  name: QualityPreset;
  particleMultiplier: number;
  animationDurationMultiplier: number;
  maxParticles: number;
  enableTrailParticles: boolean;
  enableGlowEffects: boolean;
}

// Performance Thresholds
export interface PerformanceThresholds {
  targetFPS: number;
  lowFPSThreshold: number;
  criticalFPSThreshold: number;
  particleLimitMobile: number;
  particleLimitDesktop: number;
}

// Animation State
export interface AnimationState {
  activeAnimations: Map<string, ActiveAnimation>;
  animationQueue: QueuedAnimation[];
  currentFPS: number;
  particleCount: number;
  qualityPreset: QualityPreset;
  prefersReducedMotion: boolean;
  lastUpdateTime: number;
  deltaTime: number;
}

export interface ActiveAnimation {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  priority: number;
  onComplete?: () => void;
}

export interface QueuedAnimation {
  type: string;
  priority: number;
  execute: () => void;
  duration: number;
  waitFor?: string[];
}

// Combo Display State
export interface ComboState {
  level: number;
  tier: AnimationTierLevel;
  timeRemaining: number;
  timerColor: 'green' | 'yellow' | 'red';
  isAnimating: boolean;
  isBreaking: boolean;
  breakFinalValue: number;
  particleEmissionRate: number;
  activeParticles: number;
}

// Score Source Types
export type ScoreSourceType = 'combo' | 'colorBonus' | 'tierMultiplier';

export interface ScoreSource {
  type: ScoreSourceType;
  icon: string;
  color: string;
}

export interface MultiplierBreakdown {
  combo?: number;
  colorBonus?: number;
  tier?: number;
  total: number;
}
