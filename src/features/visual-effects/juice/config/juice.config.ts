/**
 * Juice Effects Configuration
 * 
 * Configuration for all particle effects and mesh deformations.
 * Includes quality multipliers and reduced motion support.
 */

import * as BABYLON from 'babylonjs';

/**
 * Dust Particle Configuration
 * Requirements: 1.1-1.10
 * OPTIMIZED: Reduced particle counts for better performance
 */
export const DUST_PARTICLE_CONFIG = {
  baseCount: 4,            // Reduced from 8 to 4
  minCount: 2,             // Reduced from 4 to 2
  maxCount: 6,             // Reduced from 12 to 6
  velocityMin: 150,        // units per second
  velocityMax: 300,        // units per second
  color: new BABYLON.Color3(0.7, 0.7, 0.7),
  colorVariation: 0.2,     // 20% variation
  lifetime: 300,           // Reduced from 400ms to 300ms
  gravityDelay: 100,       // milliseconds
  fadeStartPercent: 0.8,   // Start fading at 80% of lifetime
} as const;

/**
 * Trail Particle Configuration
 * Requirements: 2.1-2.11
 * OPTIMIZED: Reduced emission rate for better performance
 */
export const TRAIL_PARTICLE_CONFIG = {
  emissionRate: 2,         // Reduced from 3 to 2 particles per 100ms
  lifetime: 400,           // Reduced from 600ms to 400ms
  configs: {
    low: {                 // Combo 5-7
      alpha: 0.5,
      segments: 8,         // Reduced from 10 to 8
      emissive: 0.33,
    },
    medium: {              // Combo 8-10
      alpha: 0.7,
      segments: 12,        // Reduced from 15 to 12
      emissive: 0.67,
    },
    high: {                // Combo 11+
      alpha: 0.9,
      segments: 15,        // Reduced from 20 to 15
      emissive: 1.0,
    },
  },
} as const;

/**
 * Explosion Particle Configuration
 * Requirements: 3.1-3.10
 * OPTIMIZED: Reduced particle counts and disabled secondary burst
 * FURTHER OPTIMIZED: Reduced counts for large line clears (5+ lines)
 */
export const EXPLOSION_PARTICLE_CONFIG = {
  globalMultiplier: 0.7,  // 30% fewer clear particles on every quality tier
  countPerLine: {
    single: 4,             // Reduced from 8 to 4
    double: 6,             // Reduced from 12 to 6
    triple: 8,             // Reduced from 16 to 8
    large: 6,              // NEW: For 5+ line clears (reduced from triple)
  },
  velocityMin: 400,        // units per second
  velocityMax: 600,        // units per second
  emissiveBoost: 1.5,      // 150% emissive intensity
  lifetime: 600,           // Reduced from 800ms to 600ms
  gravityDelay: 200,       // milliseconds
  secondaryBurst: {
    enabled: false,        // One clear event gets one readable particle response
    delay: 150,            // milliseconds
    countPercent: 0.45,    // 45% of primary count
  },
} as const;

/**
 * Icy Particle Configuration
 * Requirements: 4.1-4.11
 * OPTIMIZED: Reduced particle count per block
 */
export const ICY_PARTICLE_CONFIG = {
  countPerBlock: 5,        // Reduced from 10 to 5
  color: new BABYLON.Color3(0.6, 0.8, 1.0),           // Light blue
  highlightColor: new BABYLON.Color3(1.0, 1.0, 1.0), // White
  highlightChance: 0.3,    // 30% chance for white highlight
  velocityMin: 300,        // units per second
  velocityMax: 500,        // units per second
  emissiveIntensity: 0.8,
  lifetime: 500,           // Reduced from 600ms to 500ms
  gravityDelay: 150,       // milliseconds
} as const;

/**
 * Ripple Effect Configuration
 * Requirements: 5.1-5.10
 * OPTIMIZED: Reduced amplitude for subtler effect
 */
export const RIPPLE_EFFECT_CONFIG = {
  maxDistance: 1,          // Reduced from 2 to 1 grid unit for performance
  propagationSpeed: 8,     // grid units per second
  amplitudes: {
    distance1: 1.04,       // Reduced from 1.08 to 1.04
    distance2: 1.02,       // Reduced from 1.04 to 1.02
  },
  duration: 150,           // Reduced from 200ms to 150ms
  easingFunction: 'easeOutSine',
  dropHeightBoost: {
    threshold: 5,          // units
    multiplier: 1.1,       // Reduced from 1.2 to 1.1
  },
} as const;

/**
 * Implode Animation Configuration
 * Requirements: 6.1-6.10
 */
export const IMPLODE_ANIMATION_CONFIG = {
  scaleStart: 1.0,
  scaleEnd: 0.0,
  duration: 300,           // milliseconds
  rotationDegrees: 180,
  emissiveStart: 1.0,
  emissiveEnd: 2.5,
  emissiveDuration: 150,   // milliseconds (first half)
  staggerPerBlock: 30,     // milliseconds
  staggerPerLine: 50,      // milliseconds
  easingFunction: 'easeInBack',
  overshootFactor: 1.7,
} as const;

/**
 * Grid Pulse Configuration
 * Requirements: 7.1-7.11
 */
export const GRID_PULSE_CONFIG = {
  scaleMin: 1.0,
  scaleMax: 1.02,          // Reduced from 1.05 to 1.02 for subtler effect
  duration: 400,           // milliseconds
  easingFunction: 'easeInOutSine',
  frequencies: {
    low: 1.0,              // pulses per second (combo 5-7)
    medium: 1.5,           // pulses per second (combo 8-10)
    high: 2.0,             // pulses per second (combo 11+)
  },
  synchronize: true,       // All cells pulse together
} as const;

/**
 * Quality Preset Multipliers
 * Requirements: 8.6, 13.4
 * OPTIMIZED: Ultra-aggressive - ALL effects disabled for low quality (weak devices)
 */
export const QUALITY_MULTIPLIERS = {
  high: {
    particleCount: 1.0,
    emissionRate: 1.0,
    rippleAmplitude: 1.0,
    pulseAmplitude: 1.0,
    rippleDistance: 1,     // Reduced from 2 to 1 for performance
  },
  medium: {
    particleCount: 0.5,    // Reduced from 0.6 to 0.5
    emissionRate: 0.5,     // Reduced from 0.6 to 0.5
    rippleAmplitude: 0.6,  // Reduced from 0.7 to 0.6
    pulseAmplitude: 0.5,   // Reduced from 0.6 to 0.5
    rippleDistance: 1,     // grid units
  },
  low: {
    particleCount: 0.0,    // DISABLED: All particles off
    emissionRate: 0.0,     // DISABLED: No emissions
    rippleAmplitude: 0.0,  // DISABLED: No ripple
    pulseAmplitude: 0.0,   // DISABLED: No pulse
    rippleDistance: 0,     // DISABLED: No propagation
  },
} as const;

/**
 * Reduced Motion Multipliers
 * Requirements: 10.1-10.10
 */
export const REDUCED_MOTION_MULTIPLIERS = {
  dustParticles: 0,        // Disabled
  trailParticles: 0,       // Disabled
  explosionParticles: 0.3, // 70% reduction
  icyParticles: 0.3,       // 70% reduction
  rippleAmplitude: 0.4,    // 60% reduction
  implodeDuration: 0.5,    // 50% reduction (to 150ms)
  gridPulse: 0,            // Disabled
  maxAnimationDuration: 200, // milliseconds
} as const;

/**
 * Particle Pool Limits
 * Requirements: 8.6
 * OPTIMIZED: Reduced pool sizes for better memory usage
 */
export const PARTICLE_POOL_LIMITS = {
  high: 100,               // Reduced from 200 to 100
  medium: 60,              // Reduced from 120 to 60
  low: 40,                 // Reduced from 80 to 40
} as const;

/**
 * Audio Synchronization
 * Requirements: 12.1-12.7
 */
export const AUDIO_SYNC_CONFIG = {
  defaultLatency: 30,      // milliseconds
  minLatency: 10,          // milliseconds
  maxLatency: 100,         // milliseconds
} as const;
