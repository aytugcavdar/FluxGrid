/**
 * Juice Effects Type Definitions
 * 
 * TypeScript interfaces for all juice effects components.
 */

import * as BABYLON from 'babylonjs';
import type { ParticlePoolManager } from '../particles/ParticlePoolManager';

/**
 * Juice Effects Manager Configuration
 */
export interface JuiceEffectsConfig {
  scene: BABYLON.Scene;
  particlePoolManager: ParticlePoolManager;
  qualityPreset: 'high' | 'medium' | 'low';
  prefersReducedMotion: boolean;
}

/**
 * Dust Particle Emission Configuration
 * Requirements: 1.1-1.10
 */
export interface DustEmissionConfig {
  position: BABYLON.Vector3;
  dropHeight: number;
  qualityMultiplier: number;
}

/**
 * Trail Particle Emission Configuration
 * Requirements: 2.1-2.11
 */
export interface TrailEmissionConfig {
  position: BABYLON.Vector3;
  color: BABYLON.Color3;
  comboLevel: number;
  emissionRate: number;  // particles per 100ms
}

/**
 * Explosion Particle Emission Configuration
 * Requirements: 3.1-3.10
 */
export interface ExplosionEmissionConfig {
  position: BABYLON.Vector3;
  color: BABYLON.Color3;
  lineCount: number;
  isSecondaryBurst: boolean;
  particleMultiplier?: number;
}

/**
 * Icy Particle Emission Configuration
 * Requirements: 4.1-4.11
 */
export interface IcyEmissionConfig {
  position: BABYLON.Vector3;
  count: number;  // 10 per ice block
}

/**
 * Ripple Animation State
 * Requirements: 5.1-5.10
 */
export interface RippleAnimation {
  epicenter: BABYLON.Vector3;
  affectedMeshes: Map<string, {
    mesh: BABYLON.Mesh;
    distance: number;
    originalScale: BABYLON.Vector3;
    targetAmplitude: number;
  }>;
  startTime: number;
  duration: number;
  isActive: boolean;
}

/**
 * Implode Animation State
 * Requirements: 6.1-6.10
 */
export interface ImplodeAnimation {
  mesh: BABYLON.Mesh;
  startTime: number;
  duration: number;  // Can be 300, 200, or 150 based on quality/reduced motion
  originalScale: BABYLON.Vector3;
  originalRotation: BABYLON.Vector3;
  originalEmissive: BABYLON.Color3;
  staggerDelay: number;
  rotationDegrees: number;  // Can be 180, 90, or 0 based on quality/reduced motion
  isActive: boolean;
}

/**
 * Grid Pulse State
 * Requirements: 7.1-7.11
 */
export interface GridPulseState {
  affectedMeshes: Map<string, {
    mesh: BABYLON.Mesh;
    originalScale: BABYLON.Vector3;
  }>;
  frequency: number;        // pulses per second
  lastPulseTime: number;
  isActive: boolean;
  comboLevel: number;
}

/**
 * Trail Particle State
 * Requirements: 2.1-2.11
 */
export interface TrailParticleState {
  pieceId: string;
  mesh: BABYLON.Mesh;
  color: BABYLON.Color3;
  comboLevel: number;
  lastEmissionTime: number;
  isActive: boolean;
}

/**
 * Mesh Deformation Manager Configuration
 */
export interface MeshDeformationConfig {
  scene: BABYLON.Scene;
  qualityPreset: 'high' | 'medium' | 'low';
  prefersReducedMotion: boolean;
}

/**
 * Ripple Effect Parameters
 */
export interface RippleEffectParams {
  epicenter: BABYLON.Vector3;
  meshMap: Map<string, BABYLON.Mesh>;
  dropHeight: number;
}

/**
 * Implode Animation Parameters
 */
export interface ImplodeAnimationParams {
  meshes: BABYLON.Mesh[];
  lineIndices: number[];
}

/**
 * Grid Pulse Parameters
 */
export interface GridPulseParams {
  meshMap: Map<string, BABYLON.Mesh>;
  comboLevel: number;
}
