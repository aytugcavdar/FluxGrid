/**
 * Particle System Configuration
 * 
 * Configuration constants for the SPS (Solid Particle System) particle system.
 * This system replaces individual mesh-based particles with a single mesh for
 * optimal performance (single draw call for all particles).
 */

import * as BABYLON from 'babylonjs';

/**
 * Main particle system configuration
 */
export const PARTICLE_CONFIG = {
  /** Maximum number of particles in the SPS pool */
  spsCapacity: 2000,
  
  /** Size of each particle cube (world units) */
  particleSize: 0.1,
  
  /** Gravity acceleration (pixels/second²) */
  gravity: 800,
  
  /** Percentage of lifetime when fade starts (0.8 = last 20%) */
  fadeStartPercent: 0.8,
  
  /** Particle count threshold for enabling frustum culling */
  frustumCullingThreshold: 500,
  
  /** Maximum culling overhead time before disabling (milliseconds) */
  maxCullingOverhead: 2,
  
  /** Color variation settings */
  colorVariation: {
    /** Hue variation in degrees (±15°) */
    hue: 15,
    
    /** Brightness variation (0-1 range, ±20%) */
    brightness: 0.2,
  },
} as const;

/**
 * Interface for a single particle in the SPS
 */
export interface SPSParticle {
  /** Index in the SPS (0 to capacity-1) */
  idx: number;
  
  /** Current world position */
  position: BABYLON.Vector3;
  
  /** Current velocity vector (units/second) */
  velocity: BABYLON.Vector3;
  
  /** RGBA color (0-1 range) */
  color: BABYLON.Color4;
  
  /** Total lifetime in milliseconds */
  lifetime: number;
  
  /** Current age in milliseconds */
  age: number;
  
  /** Delay before gravity applies (milliseconds) */
  gravityDelay: number;
  
  /** Whether particle is dead (available for reuse) */
  isDead: boolean;
}

/**
 * Configuration for initializing the SPS particle pool
 */
export interface SPSParticlePoolConfig {
  /** Babylon.js scene reference */
  scene: any; // BABYLON.Scene
  
  /** Maximum particle capacity (default: 2000) */
  capacity?: number;
  
  /** Size of each particle (default: 0.1) */
  particleSize?: number;
}

/**
 * Configuration for particle emission
 */
export interface EmissionConfig {
  /** Base color for particles */
  color: BABYLON.Color4;
  
  /** Particle lifetime in milliseconds */
  lifetime: number;
  
  /** Initial speed (units/second) */
  speed: number;
  
  /** Delay before gravity applies (milliseconds) */
  gravityDelay: number;
  
  /** Hue variation amount (0-1, multiplied by config.colorVariation.hue) */
  colorVariation?: number;
  
  /** Brightness variation amount (0-1, multiplied by config.colorVariation.brightness) */
  brightnessVariation?: number;
  
  /** Whether to apply color variation (default: true for confetti, false for line clear) */
  applyColorVariation?: boolean;
}

/**
 * Particle emission pattern types
 */
export enum EmissionPattern {
  /** Radial explosion pattern */
  Radial = 'radial',
  
  /** Downward rain pattern */
  Downward = 'downward',
  
  /** Upward fountain pattern */
  Upward = 'upward',
  
  /** Fire effect pattern */
  Fire = 'fire',
  
  /** Smoke effect pattern */
  Smoke = 'smoke',
  
  /** Star burst pattern */
  Stars = 'stars',
  
  /** Spiral pattern */
  Spiral = 'spiral',
  
  /** Lightning zigzag pattern */
  Lightning = 'lightning',
}

/**
 * Preset configurations for enhanced particle effects
 */
export const ENHANCED_PARTICLE_PRESETS = {
  /** Fire effect preset */
  fire: {
    lifetime: 1000,
    speed: 3.0,
    gravityDelay: 500,
    particleCount: 50,
    description: 'Red/orange/yellow fire effect with upward movement',
  },
  
  /** Smoke effect preset */
  smoke: {
    lifetime: 2000,
    speed: 1.5,
    gravityDelay: 999999,
    particleCount: 30,
    description: 'Gray smoke with slow upward drift',
  },
  
  /** Star burst preset */
  stars: {
    lifetime: 1500,
    speed: 4.0,
    gravityDelay: 800,
    particleCount: 100,
    description: 'Bright colored stars in radial burst',
  },
  
  /** Spiral preset */
  spiral: {
    lifetime: 2000,
    speed: 2.5,
    gravityDelay: 1000,
    particleCount: 60,
    description: 'Rainbow spiral pattern',
  },
  
  /** Lightning preset */
  lightning: {
    lifetime: 300,
    speed: 8.0,
    gravityDelay: 999999,
    particleCount: 40,
    description: 'Fast white/blue lightning zigzag',
  },
} as const;
