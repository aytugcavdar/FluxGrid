import * as BABYLON from 'babylonjs';
import { ParticlePoolManager } from '../particles/ParticlePoolManager';
import { ParticleEmitter } from '../particles/ParticleEmitter';
import type { HapticManager } from '../../../utils/audio/haptics';

/**
 * PlacementImpactSystem - Handles placement impact animations
 * 
 * Requirements: 1.1-1.7
 * 
 * Features:
 * - Scale animation: 1.0x → 1.15x (80ms) → 1.0x (120ms)
 * - Impact particle emission (8-12 particles)
 * - Haptic feedback (40ms medium pulse)
 * - Audio feedback (volume based on drop height)
 */

export interface PlacementImpactConfig {
  scaleFrom: number;        // 1.0
  scalePeak: number;        // 1.15 (or 1.05 for reduced motion)
  scaleTo: number;          // 1.0
  peakDuration: number;     // 80ms
  returnDuration: number;   // 120ms
  particleCount: number;    // 8-12
  particleSpeed: number;    // 200-400 px/s
  hapticIntensity: number;  // 0.5 (medium)
}

interface PlacementAnimation {
  cellId: string;
  startTime: number;
  phase: 'grow' | 'shrink';
  originalScale: BABYLON.Vector3;
  mesh: BABYLON.Mesh;
}

export class PlacementImpactSystem {
  private scene: BABYLON.Scene;
  private particlePool: ParticlePoolManager;
  private particleEmitter: ParticleEmitter;
  private config: PlacementImpactConfig;
  private activeAnimations: Map<string, PlacementAnimation>;
  private prefersReducedMotion: boolean = false;
  private qualityPreset: 'high' | 'medium' | 'low' = 'high';
  private juiceEffectsManager: any = null;
  
  constructor(
    scene: BABYLON.Scene,
    particlePool: ParticlePoolManager,
    _hapticManager: HapticManager
  ) {
    this.scene = scene;
    this.particlePool = particlePool;
    this.particleEmitter = new ParticleEmitter(particlePool);
    this.activeAnimations = new Map();
    
    // Default config
    this.config = {
      scaleFrom: 1.0,
      scalePeak: 1.12,
      scaleTo: 1.0,
      peakDuration: 58,
      returnDuration: 96,
      particleCount: 6,
      particleSpeed: 300,
      hapticIntensity: 0.5
    };
  }
  
  /**
   * Trigger placement impact animation
   * Requirements: 1.1-1.7
   */
  trigger(cellIds: string[], meshMap: Map<string, BABYLON.Mesh>, dropHeight: number): void {
    // 1. Scale animation
    this.animateScale(cellIds, meshMap);
    
    // 2. Particle emission (skip if reduced motion)
    if (!this.prefersReducedMotion) {
      this.emitImpactParticles(cellIds, meshMap);
    }
    
    // 3. Juice Effects - Dust particles
    if (this.juiceEffectsManager && !this.prefersReducedMotion) {
      const positions: BABYLON.Vector3[] = [];
      cellIds.forEach(id => {
        const mesh = meshMap.get(id);
        if (mesh) {
          positions.push(mesh.position.clone());
        }
      });

      if (positions.length > 0) {
        this.juiceEffectsManager.emitDustParticles(positions, dropHeight);
      }
    }
    
    // 4. Audio and haptic feedback are handled by the game action router.
    // Volume calculation: min(0.8, dropHeight / 12 * 0.8)
  }
  
  /**
   * Animate scale for placed pieces
   * Requirements: 1.1, 1.6
   */
  private animateScale(cellIds: string[], meshMap: Map<string, BABYLON.Mesh>): void {
    const startTime = Date.now();
    
    cellIds.forEach(id => {
      const mesh = meshMap.get(id);
      if (!mesh) return;
      
      // Store animation state
      this.activeAnimations.set(id, {
        cellId: id,
        mesh,
        startTime,
        originalScale: mesh.scaling.clone(),
        phase: 'grow'
      });
    });
  }
  
  /**
   * Emit impact particles
   * Requirements: 1.2
   */
  private emitImpactParticles(cellIds: string[], meshMap: Map<string, BABYLON.Mesh>): void {
    const maxImpactCells = this.qualityPreset === 'low' ? 2 : 4;
    const impactCellIds = cellIds.slice(0, maxImpactCells);
    const particlesPerCell = Math.max(2, Math.ceil(this.config.particleCount / Math.max(1, impactCellIds.length)));

    impactCellIds.forEach(id => {
      const mesh = meshMap.get(id);
      if (!mesh) return;

      // Emit radial particles
      this.particleEmitter.emitRadial('impact', {
        position: mesh.position.clone(),
        count: particlesPerCell,
        velocityMin: 140,
        velocityMax: 260,
        lifetime: 240,
        applyGravity: false
      });
    });
  }
  
  /**
   * Update all active scale animations
   * Requirements: 1.1, 1.6
   */
  update(currentTime: number): void {
    this.activeAnimations.forEach((anim, id) => {
      const elapsed = currentTime - anim.startTime;
      
      if (anim.phase === 'grow') {
        if (elapsed < this.config.peakDuration) {
          // Growing phase
          const t = elapsed / this.config.peakDuration;
          const scale = BABYLON.Scalar.Lerp(
            this.config.scaleFrom,
            this.config.scalePeak,
            this.easeOutQuad(t)
          );
          anim.mesh.scaling.setAll(scale);
        } else {
          // Switch to shrink phase
          anim.phase = 'shrink';
          anim.startTime = currentTime;
        }
      } else if (anim.phase === 'shrink') {
        if (elapsed < this.config.returnDuration) {
          // Shrinking phase
          const t = elapsed / this.config.returnDuration;
          const scale = BABYLON.Scalar.Lerp(
            this.config.scalePeak,
            this.config.scaleTo,
            this.easeInQuad(t)
          );
          anim.mesh.scaling.setAll(scale);
        } else {
          // Animation complete
          anim.mesh.scaling.copyFrom(anim.originalScale);
          this.activeAnimations.delete(id);
        }
      }
    });
  }
  
  /**
   * Ease out quad timing function
   */
  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }
  
  /**
   * Ease in quad timing function
   */
  private easeInQuad(t: number): number {
    return t * t;
  }
  
  /**
   * Set reduced motion preference
   * Requirements: 1.5
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
    
    // Adjust config for reduced motion
    if (enabled) {
      this.config.scalePeak = 1.05; // Reduced magnitude
    } else {
      this.config.scalePeak = 1.15; // Normal magnitude
    }
  }
  
  /**
   * Set quality preset
   * Requirements: 13.1-13.6
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
    
    // Adjust particle count based on quality
    switch (preset) {
      case 'high':
        this.config.particleCount = 6;
        break;
      case 'medium':
        this.config.particleCount = 4;
        break;
      case 'low':
        this.config.particleCount = 2;
        break;
    }
  }
  
  /**
   * Set juice effects manager
   */
  setJuiceEffectsManager(manager: any): void {
    this.juiceEffectsManager = manager;
  }
  
  /**
   * Get current config
   */
  getConfig(): PlacementImpactConfig {
    return this.config;
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.activeAnimations.clear();
  }
}
