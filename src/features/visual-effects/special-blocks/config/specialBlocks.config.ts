/**
 * Special Blocks Configuration
 * 
 * Configuration for special block types and their effects
 */

import * as BABYLON from 'babylonjs';

/**
 * Special block types
 */
export enum SpecialBlockType {
  Bomb = 'bomb',
  Ice = 'ice',
  Fire = 'fire',
  Lightning = 'lightning',
}

/**
 * Special block configuration
 */
export const SPECIAL_BLOCK_CONFIG = {
  /** Bomb block settings */
  bomb: {
    /** Explosion radius (grid cells) */
    explosionRadius: 2,
    
    /** Shockwave duration (ms) */
    shockwaveDuration: 500,
    
    /** Shockwave max radius */
    shockwaveRadius: 3.0,
    
    /** Particle count */
    particleCount: 100,
    
    /** Base color */
    color: new BABYLON.Color4(1, 0.3, 0, 1), // Orange-red
  },
  
  /** Ice block settings */
  ice: {
    /** Freeze duration (ms) */
    freezeDuration: 3000,
    
    /** Frost spread radius (grid cells) */
    frostRadius: 1,
    
    /** Particle count */
    particleCount: 50,
    
    /** Base color */
    color: new BABYLON.Color4(0.5, 0.8, 1, 1), // Light blue
    
    /** Frost alpha */
    frostAlpha: 0.6,
  },
  
  /** Fire block settings */
  fire: {
    /** Burn duration (ms) */
    burnDuration: 2000,
    
    /** Fire spread chance (0-1) */
    spreadChance: 0.3,
    
    /** Particle count */
    particleCount: 60,
    
    /** Base color */
    color: new BABYLON.Color4(1, 0.5, 0, 1), // Orange
  },
  
  /** Lightning block settings */
  lightning: {
    /** Chain count (how many blocks to chain) */
    chainCount: 3,
    
    /** Chain delay (ms between chains) */
    chainDelay: 100,
    
    /** Particle count per chain */
    particleCount: 40,
    
    /** Base color */
    color: new BABYLON.Color4(0.8, 0.8, 1, 1), // Electric blue
  },
} as const;

/**
 * Interface for special block instance
 */
export interface SpecialBlockInstance {
  type: SpecialBlockType;
  position: BABYLON.Vector3;
  gridX: number;
  gridY: number;
  isActive: boolean;
  activationTime?: number;
}

/**
 * Interface for bomb explosion effect
 */
export interface BombExplosionEffect {
  position: BABYLON.Vector3;
  startTime: number;
  duration: number;
  shockwaveMesh: BABYLON.Mesh;
  isActive: boolean;
}

/**
 * Interface for ice frost effect
 */
export interface IceFrostEffect {
  targetBlocks: Array<{ x: number; y: number }>;
  frostMeshes: BABYLON.Mesh[];
  startTime: number;
  duration: number;
  isActive: boolean;
}

/**
 * Interface for fire burn effect
 */
export interface FireBurnEffect {
  position: BABYLON.Vector3;
  gridX: number;
  gridY: number;
  startTime: number;
  duration: number;
  flameMesh: BABYLON.Mesh;
  isActive: boolean;
}

/**
 * Interface for lightning chain effect
 */
export interface LightningChainEffect {
  chainPositions: BABYLON.Vector3[];
  currentChain: number;
  lastChainTime: number;
  chainDelay: number;
  isActive: boolean;
}
