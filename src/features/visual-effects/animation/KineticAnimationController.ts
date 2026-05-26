/**
 * Kinetic Animation Controller
 * 
 * Applies animation principles (squash & stretch, trails) to 3D blocks.
 * Makes pieces feel "alive" and responsive through kinetic feedback.
 * 
 * Key features:
 * - Squash & stretch animations on landing
 * - Stretch during falls proportional to speed
 * - Trail effects at high combos
 * - Rotation animations with overshoot
 */

import * as BABYLON from 'babylonjs';
import {
  ANIMATION_CONFIG,
  EASING_FUNCTIONS,
  KineticAnimationConfig,
  AnimationState,
  TrailConfig,
} from './config/animation.config';
import { TrailMeshManager } from './TrailMeshManager';
import type { JuiceEffectsManager } from '../juice/JuiceEffectsManager';

export class KineticAnimationController {
  private config: KineticAnimationConfig;
  private animationStates: Map<string, AnimationState>;
  private trailManager: TrailMeshManager | null = null;
  private juiceEffectsManager: JuiceEffectsManager | null = null;
  
  constructor(config?: Partial<KineticAnimationConfig>) {
    // Initialize configuration with defaults
    this.config = {
      stretchScale: config?.stretchScale ?? ANIMATION_CONFIG.stretch.scale,
      squashScale: config?.squashScale ?? ANIMATION_CONFIG.squash.scale,
      springDuration: config?.springDuration ?? ANIMATION_CONFIG.squash.duration,
      easingFunction: config?.easingFunction ?? ANIMATION_CONFIG.squash.easing,
      trailEnabled: config?.trailEnabled ?? true,
      trailMinCombo: config?.trailMinCombo ?? ANIMATION_CONFIG.trail.minCombo,
    };
    
    this.animationStates = new Map();
  }
  
  /**
   * Set trail manager instance
   * @param trailManager TrailMeshManager instance
   */
  public setTrailManager(trailManager: TrailMeshManager): void {
    this.trailManager = trailManager;
  }

  public setJuiceEffectsManager(manager: JuiceEffectsManager): void {
    this.juiceEffectsManager = manager;
  }
  

  
  /**
   * Apply squash animation on landing
   * @param pieceId Piece identifier
   */
  public applySquash(pieceId: string): void {
    const now = Date.now();
    
    // Create animation state
    const state: AnimationState = {
      isAnimating: true,
      startTime: now,
      startScale: [...this.config.squashScale],
      targetScale: [1, 1, 1],
      duration: this.config.springDuration,
      easingFn: EASING_FUNCTIONS[this.config.easingFunction] || EASING_FUNCTIONS.easeOutElastic,
    };
    
    this.animationStates.set(pieceId, state);
  }
  
  /**
   * Enable trail for a piece
   * @param pieceId Piece identifier
   * @param generator The mesh to generate trail from
   * @param color Trail color
   * @param comboLevel Current combo level
   * @param performanceMode Whether performance mode is enabled
   */
  public enableTrail(
    pieceId: string,
    generator: any, // BABYLON.Mesh
    color: { r: number; g: number; b: number },
    comboLevel: number,
    performanceMode: boolean = false
  ): void {
    if (!this.config.trailEnabled || comboLevel < this.config.trailMinCombo || performanceMode) {
      return;
    }
    
    if (!this.trailManager) {
      console.warn('[KineticAnimationController] TrailManager not set');
      return;
    }
    
    // Determine trail config based on combo level
    let trailConfig: TrailConfig;
    
    if (comboLevel >= 11) {
      trailConfig = {
        color,
        alpha: ANIMATION_CONFIG.trail.configs.high.alpha,
        segmentCount: ANIMATION_CONFIG.trail.configs.high.segments,
        width: 0.5,
        emissiveIntensity: ANIMATION_CONFIG.trail.configs.high.emissive,
      };
    } else if (comboLevel >= 8) {
      trailConfig = {
        color,
        alpha: ANIMATION_CONFIG.trail.configs.medium.alpha,
        segmentCount: ANIMATION_CONFIG.trail.configs.medium.segments,
        width: 0.4,
        emissiveIntensity: ANIMATION_CONFIG.trail.configs.medium.emissive,
      };
    } else {
      trailConfig = {
        color,
        alpha: ANIMATION_CONFIG.trail.configs.low.alpha,
        segmentCount: ANIMATION_CONFIG.trail.configs.low.segments,
        width: 0.3,
        emissiveIntensity: ANIMATION_CONFIG.trail.configs.low.emissive,
      };
    }
    
    // Create trail
    this.trailManager.createTrail(pieceId, generator, trailConfig);
  }
  
  /**
   * Disable trail for a piece
   * @param pieceId Piece identifier
   */
  public disableTrail(pieceId: string): void {
    if (!this.trailManager) return;
    setTimeout(() => {
      this.trailManager?.disposeTrail(pieceId);
    }, 100);
  }
  
  /**
   * Update all animations (called each frame)
   * @param deltaTime Time since last frame in milliseconds
   * @returns Map of piece IDs to their current scales
   */
  public update(deltaTime: number): Map<string, [number, number, number]> {
    const scales = new Map<string, [number, number, number]>();
    const now = Date.now();
    
    // Update each animation
    for (const [pieceId, state] of this.animationStates.entries()) {
      if (!state.isAnimating) {
        continue;
      }
      
      // Calculate animation progress
      const elapsed = now - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);
      
      if (progress >= 1) {
        // Animation complete
        scales.set(pieceId, state.targetScale);
        state.isAnimating = false;
        this.animationStates.delete(pieceId);
        continue;
      }
      
      // Apply easing function
      const easedProgress = state.easingFn(progress);
      
      // Interpolate scale
      const scale: [number, number, number] = [
        this.lerp(state.startScale[0], state.targetScale[0], easedProgress),
        this.lerp(state.startScale[1], state.targetScale[1], easedProgress),
        this.lerp(state.startScale[2], state.targetScale[2], easedProgress),
      ];
      
      scales.set(pieceId, scale);
    }
    
    return scales;
  }
  
  /**
   * Get current scale for a piece
   * @param pieceId Piece identifier
   * @returns Current scale [x, y, z] or null if no animation
   */
  public getScale(pieceId: string): [number, number, number] | null {
    const state = this.animationStates.get(pieceId);
    if (!state || !state.isAnimating) {
      return null;
    }
    
    const now = Date.now();
    const elapsed = now - state.startTime;
    const progress = Math.min(elapsed / state.duration, 1);
    const easedProgress = state.easingFn(progress);
    
    return [
      this.lerp(state.startScale[0], state.targetScale[0], easedProgress),
      this.lerp(state.startScale[1], state.targetScale[1], easedProgress),
      this.lerp(state.startScale[2], state.targetScale[2], easedProgress),
    ];
  }
  
  /**
   * Check if piece is currently animating
   * @param pieceId Piece identifier
   * @returns True if animating
   */
  public isAnimating(pieceId: string): boolean {
    const state = this.animationStates.get(pieceId);
    return state?.isAnimating ?? false;
  }
  
  /**
   * Linear interpolation
   * @param start Start value
   * @param end End value
   * @param t Progress (0-1)
   * @returns Interpolated value
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  /**
   * Dispose animation controller
   */
  public dispose(): void {
    this.animationStates.clear();
    
    if (this.trailManager && this.trailManager.disposeAll) {
      this.trailManager.disposeAll();
    }
  }
}
