/**
 * Juice Effects Manager
 * 
 * Central manager for all juice effects (particles and mesh deformations).
 * Coordinates particle emissions and mesh animations across the game.
 * Requirements: 1.1-7.11, 8.1-8.10, 9.1-9.10, 10.1-10.10
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
  TRAIL_PARTICLE_CONFIG,
} from './config/juice.config';
import type {
  JuiceEffectsConfig,
  TrailParticleState,
  DustEmissionConfig,
  TrailEmissionConfig,
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
  private activeTrails: Map<string, TrailParticleState>;
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
    this.activeTrails = new Map();
  }
  
  /**
   * Emit dust particles
   * Requirements: 1.1-1.10
   */
  emitDustParticles(positions: BABYLON.Vector3[], dropHeight: number): void {
    // Skip if reduced motion enabled
    if (this.prefersReducedMotion) {
      return;
    }
    
    // Skip dust particles on low quality (causes stuttering on weak devices)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    // Get quality multiplier
    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
    
    // Emit dust at each position
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
   * Enable trail particles
   * Requirements: 2.1-2.11
   */
  enableTrailParticles(
    pieceId: string,
    mesh: BABYLON.Mesh,
    color: BABYLON.Color3,
    comboLevel: number
  ): void {
    // Check combo threshold
    if (comboLevel < 5) {
      return;
    }
    
    // Skip if reduced motion enabled
    if (this.prefersReducedMotion) {
      return;
    }
    
    // Skip trail particles on low quality (too expensive for weak devices)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    // Create trail state
    const trailState: TrailParticleState = {
      pieceId,
      mesh,
      color,
      comboLevel,
      lastEmissionTime: Date.now(),
      isActive: true,
    };
    
    this.activeTrails.set(pieceId, trailState);
  }
  
  /**
   * Disable trail particles
   * Requirements: 2.1-2.11
   */
  disableTrailParticles(pieceId: string): void {
    const trailState = this.activeTrails.get(pieceId);
    if (!trailState) {
      return;
    }
    
    // Mark as inactive
    trailState.isActive = false;
    
    // Schedule removal after 100ms
    setTimeout(() => {
      this.activeTrails.delete(pieceId);
    }, 100);
  }
  
  /**
   * Update trail particles (called in render loop)
   * Requirements: 2.1-2.11
   */
  private updateTrailParticles(deltaTime: number): void {
    const currentTime = Date.now();
    
    this.activeTrails.forEach((trailState) => {
      if (!trailState.isActive || trailState.mesh.isDisposed()) {
        return;
      }
      
      // Check if it's time to emit
      const emissionInterval = 100; // 100ms between emissions
      if (currentTime - trailState.lastEmissionTime >= emissionInterval) {
        // Get quality multiplier
        const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
        const emissionRate = TRAIL_PARTICLE_CONFIG.emissionRate * qualityMult.emissionRate;
        
        // Emit trail particles
        const config: TrailEmissionConfig = {
          position: trailState.mesh.position.clone(),
          color: trailState.color,
          comboLevel: trailState.comboLevel,
          emissionRate,
        };
        
        this.particleEmitter.emitTrail(config);
        trailState.lastEmissionTime = currentTime;
      }
    });
  }
  
  /**
   * Emit explosion particles
   * Requirements: 3.1-3.10
   */
  emitExplosionParticles(
    positions: BABYLON.Vector3[],
    colors: BABYLON.Color3[],
    lineCount: number
  ): void {
    // Skip explosion particles on low quality (too expensive)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    // Get quality multiplier
    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
    
    // Apply reduced motion multiplier
    const reducedMotionMult = this.prefersReducedMotion
      ? REDUCED_MOTION_MULTIPLIERS.explosionParticles
      : 1.0;
    
    // Emit explosion at each position
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
   * Emit icy particles
   * Requirements: 4.1-4.11
   */
  emitIcyParticles(positions: BABYLON.Vector3[]): void {
    // Skip icy particles on low quality (too expensive)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    // Get quality multiplier
    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
    
    // Apply reduced motion multiplier
    const reducedMotionMult = this.prefersReducedMotion
      ? REDUCED_MOTION_MULTIPLIERS.icyParticles
      : 1.0;
    
    // Calculate particle count
    const baseCount = 10; // per ice block
    const count = Math.round(baseCount * qualityMult.particleCount * reducedMotionMult);
    
    // Emit icy particles at each position
    positions.forEach(position => {
      const config: IcyEmissionConfig = {
        position,
        count,
      };
      
      this.particleEmitter.emitIcy(config);
    });
  }
  
  /**
   * Trigger ripple effect
   * Requirements: 5.1-5.10
   */
  triggerRippleEffect(
    epicenter: BABYLON.Vector3,
    meshMap: Map<string, BABYLON.Mesh>,
    dropHeight: number
  ): void {
    // Skip ripple on low quality (disabled via rippleDistance: 0)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    this.meshDeformationManager.triggerRipple(epicenter, meshMap, dropHeight);
  }
  
  /**
   * Trigger implode animation
   * Requirements: 6.1-6.10
   */
  triggerImplodeAnimation(meshes: BABYLON.Mesh[], lineIndices: number[]): void {
    // Skip implode animation on low quality (too expensive)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    this.meshDeformationManager.triggerImplode(meshes, lineIndices);
  }
  
  /**
   * Start grid pulse
   * Requirements: 7.1-7.11
   */
  startGridPulse(meshMap: Map<string, BABYLON.Mesh>, comboLevel: number): void {
    // Skip if reduced motion enabled
    if (this.prefersReducedMotion) {
      return;
    }
    
    // Skip grid pulse on low quality (too expensive for weak devices)
    if (this.qualityPreset === 'low') {
      return;
    }
    
    this.meshDeformationManager.startPulse(meshMap, comboLevel);
  }
  
  /**
   * Stop grid pulse
   * Requirements: 7.1-7.11
   */
  stopGridPulse(): void {
    this.meshDeformationManager.stopPulse();
  }
  
  /**
   * Set quality preset
   * Requirements: 8.6, 13.4
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
    this.meshDeformationManager.setQualityPreset(preset);
    
    // Update particle pool limits
    const limits = {
      high: 200,
      medium: 120,
      low: 80,
    };
    
    // Note: ParticlePoolManager.setQualityPreset() would be called here
    // if it exists in the implementation
  }
  
  /**
   * Set reduced motion preference
   * Requirements: 10.1-10.10
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
    this.meshDeformationManager.setReducedMotion(enabled);
    
    // Disable active trails if reduced motion enabled
    if (enabled) {
      this.activeTrails.forEach((_, pieceId) => {
        this.disableTrailParticles(pieceId);
      });
    }
  }
  
  /**
   * Update all juice effects (called in render loop)
   * Requirements: 8.1-8.10
   */
  update(deltaTime: number, camera?: BABYLON.Camera): void {
    // Update performance monitor
    if (this.autoQualityEnabled) {
      this.performanceMonitor.update();
    }
    
    // Update mesh deformations
    this.meshDeformationManager.update(camera);
    
    // Update trail particles
    this.updateTrailParticles(deltaTime);
    
    // Note: ParticlePoolManager.update() handles gravity physics
    // and is called separately in the main render loop
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
   * Requirements: 8.10
   */
  dispose(): void {
    this.meshDeformationManager.dispose();
    this.activeTrails.clear();
  }
}
