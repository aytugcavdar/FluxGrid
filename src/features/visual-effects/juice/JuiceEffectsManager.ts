/**
 * Juice Effects Manager
 *
 * Central manager for all juice effects (particles and mesh deformations).
 * Coordinates particle emissions and mesh animations across the game.
 */

import * as BABYLON from 'babylonjs';
import { MeshDeformationManager } from './MeshDeformationManager';
import { ParticleEmitter } from '../particles/ParticleEmitter';
import { PerformanceMonitor } from './PerformanceMonitor';
import type { ParticlePoolManager } from '../particles/ParticlePoolManager';
import type { SPSParticlePoolManager } from '../particles/SPSParticlePoolManager';
import {
  QUALITY_MULTIPLIERS,
  REDUCED_MOTION_MULTIPLIERS,
} from './config/juice.config';
import type {
  JuiceEffectsConfig,
  DustEmissionConfig,
  ExplosionEmissionConfig,
  IcyEmissionConfig,
} from './types';

export class JuiceEffectsManager {
  private scene: BABYLON.Scene;
  private particlePoolManager: ParticlePoolManager;
  private spsParticleManager: SPSParticlePoolManager;
  private meshDeformationManager: MeshDeformationManager;
  private particleEmitter: ParticleEmitter;
  private performanceMonitor: PerformanceMonitor;
  private qualityPreset: 'high' | 'medium' | 'low';
  private prefersReducedMotion: boolean;
  private autoQualityEnabled: boolean = true;

  constructor(config: JuiceEffectsConfig) {
    this.scene = config.scene;
    this.particlePoolManager = config.particlePoolManager;
    this.spsParticleManager = config.spsParticleManager;
    this.qualityPreset = config.qualityPreset;
    this.prefersReducedMotion = config.prefersReducedMotion;

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor();
    this.performanceMonitor.onQualityChange((quality) => {
      if (this.autoQualityEnabled) {
        console.log(`[JuiceEffects] Auto quality change: ${this.qualityPreset} → ${quality}`);
        this.setQualityPreset(quality);
      }
    });

    // Initialize subsystems
    this.meshDeformationManager = new MeshDeformationManager({
      scene: config.scene,
      qualityPreset: config.qualityPreset,
      prefersReducedMotion: config.prefersReducedMotion,
    });

    this.particleEmitter = new ParticleEmitter(config.particlePoolManager);
  }

  /**
   * Emit dust particles on piece placement
   */
  emitDustParticles(positions: BABYLON.Vector3[], dropHeight: number): void {
    if (this.prefersReducedMotion) return;
    if (this.qualityPreset === 'low') return;

    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];

    positions.forEach(position => {
      const config: DustEmissionConfig = {
        position,
        dropHeight,
        qualityMultiplier: qualityMult.particleCount,
      };
      this.particleEmitter.emitDust(config);
    });
  }

  /**
   * Emit explosion particles on line clear
   */
  emitExplosionParticles(
    positions: BABYLON.Vector3[],
    colors: BABYLON.Color3[],
    lineCount: number
  ): void {
    if (this.qualityPreset === 'low') return;

    const reducedMotionMult = this.prefersReducedMotion
      ? REDUCED_MOTION_MULTIPLIERS.explosionParticles
      : 1.0;

    positions.forEach((position, index) => {
      const color = colors[index] || colors[0];

      const config: ExplosionEmissionConfig = {
        position,
        color,
        lineCount,
        isSecondaryBurst: false,
      };

      this.particleEmitter.emitExplosion(config);

      // Secondary burst for 3+ lines
      if (lineCount >= 3 && !this.prefersReducedMotion) {
        setTimeout(() => {
          const secondaryConfig: ExplosionEmissionConfig = {
            position,
            color,
            lineCount,
            isSecondaryBurst: true,
          };
          this.particleEmitter.emitExplosion(secondaryConfig);
        }, 150);
      }
    });
  }

  /**
   * Emit icy particles on ice block clear
   */
  emitIcyParticles(positions: BABYLON.Vector3[]): void {
    if (this.qualityPreset === 'low') return;

    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
    const reducedMotionMult = this.prefersReducedMotion
      ? REDUCED_MOTION_MULTIPLIERS.icyParticles
      : 1.0;

    const baseCount = 10; // per ice block
    const count = Math.round(baseCount * qualityMult.particleCount * reducedMotionMult);

    positions.forEach(position => {
      const config: IcyEmissionConfig = {
        position,
        count,
      };
      this.particleEmitter.emitIcy(config);
    });
  }

  /**
   * Trigger implode animation on line clear
   */
  triggerImplodeAnimation(meshes: BABYLON.Mesh[], lineIndices: number[]): void {
    if (this.qualityPreset === 'low') return;
    this.meshDeformationManager.triggerImplode(meshes, lineIndices);
  }

  /**
   * Start grid pulse on high combo
   */
  startGridPulse(meshMap: Map<string, BABYLON.Mesh>, comboLevel: number): void {
    if (this.prefersReducedMotion) return;
    if (this.qualityPreset === 'low') return;
    this.meshDeformationManager.startPulse(meshMap, comboLevel);
  }

  /**
   * Stop grid pulse
   */
  stopGridPulse(): void {
    this.meshDeformationManager.stopPulse();
  }

  /**
   * Set quality preset
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
    this.meshDeformationManager.setQualityPreset(preset);
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
    this.meshDeformationManager.setReducedMotion(enabled);
  }

  /**
   * Update all juice effects (called in render loop)
   */
  update(deltaTime: number, camera?: BABYLON.Camera): void {
    if (this.autoQualityEnabled) {
      this.performanceMonitor.update();
    }
    this.meshDeformationManager.update(camera);
  }

  /**
   * Enable/disable automatic quality adjustment
   */
  setAutoQuality(enabled: boolean): void {
    this.autoQualityEnabled = enabled;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.meshDeformationManager.dispose();
  }
}
