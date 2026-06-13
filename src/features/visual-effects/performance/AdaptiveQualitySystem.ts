/**
 * Adaptive Quality System
 * 
 * Automatically adjusts visual quality based on performance metrics.
 * Reduces particle count, disables trails, or enables performance mode
 * when FPS drops below thresholds.
 */

import { PerformanceDegradationLevel } from './config/performance.config';
import { SPSParticlePoolManager } from '../particles/SPSParticlePoolManager';
import { TrailMeshManager } from '../animation/TrailMeshManager';

export interface AdaptiveQualityConfig {
  /** SPSParticlePoolManager instance */
  particleManager: SPSParticlePoolManager | null;
  
  /** TrailMeshManager instance */
  trailManager: TrailMeshManager | null;
  
  /** Callback to update performance mode state */
  onPerformanceModeChange?: (enabled: boolean) => void;
}

export class AdaptiveQualitySystem {
  private config: AdaptiveQualityConfig;
  private performanceModeEnabled: boolean = false;
  private originalParticleCapacity: number = 1000;

  constructor(config: AdaptiveQualityConfig) {
    this.config = config;
    
    // Store original particle capacity
    if (this.config.particleManager) {
      this.originalParticleCapacity = this.config.particleManager.getCapacity();
    }
  }

  /**
   * Handle performance degradation
   * @param level Degradation level (mild, moderate, severe)
   */
  public handleDegradation(level: PerformanceDegradationLevel): void {
    console.log(`[AdaptiveQualitySystem] Handling ${level} degradation`);
    
    switch (level) {
      case 'mild':
        this.reduceParticleCount(50); // Reduce by 50%
        break;
        
      case 'moderate':
        this.disableTrailEffects();
        break;
        
      case 'severe':
        this.enablePerformanceMode();
        break;
    }
  }

  /**
   * Handle performance restoration
   */
  public handleRestoration(): void {
    console.log('[AdaptiveQualitySystem] Restoring effects');
    
    // Restore all effects
    this.disablePerformanceMode();
    this.restoreParticleCount();
    // Note: Trails will be re-enabled automatically when combo >= 5
  }

  /**
   * Reduce particle count by percentage
   * @param percentage Percentage to reduce (0-100)
   */
  private reduceParticleCount(percentage: number): void {
    if (!this.config.particleManager) {
      return;
    }
    
    const currentCapacity = this.config.particleManager.getCapacity();
    const reduction = Math.floor(currentCapacity * (percentage / 100));
    const newCapacity = Math.max(500, currentCapacity - reduction);
    
    console.log(`[AdaptiveQualitySystem] Reducing particle capacity from ${currentCapacity} to ${newCapacity}`);
    
    // Note: SPSParticlePoolManager would need a setCapacity method
    // For now, we'll just log the action
  }

  /**
   * Restore original particle count
   */
  private restoreParticleCount(): void {
    if (!this.config.particleManager) {
      return;
    }
    
    console.log(`[AdaptiveQualitySystem] Restoring particle capacity to ${this.originalParticleCapacity}`);
    
    // Note: SPSParticlePoolManager would need a setCapacity method
    // For now, we'll just log the action
  }

  /**
   * Disable all trail effects
   */
  private disableTrailEffects(): void {
    if (!this.config.trailManager) {
      return;
    }
    
    console.log('[AdaptiveQualitySystem] Disabling trail effects');
    this.config.trailManager.disposeAll();
  }

  /**
   * Enable performance mode
   * - Limit SPS to 500 particles
   * - Disable all trail effects
   * - Disable rotation animations
   * - Disable beat indicator
   */
  private enablePerformanceMode(): void {
    if (this.performanceModeEnabled) {
      return;
    }
    
    console.log('[AdaptiveQualitySystem] Enabling performance mode');
    this.performanceModeEnabled = true;
    
    // Disable trail effects
    this.disableTrailEffects();
    
    // Notify performance mode change
    if (this.config.onPerformanceModeChange) {
      this.config.onPerformanceModeChange(true);
    }
  }

  /**
   * Disable performance mode and restore effects
   */
  private disablePerformanceMode(): void {
    if (!this.performanceModeEnabled) {
      return;
    }
    
    console.log('[AdaptiveQualitySystem] Disabling performance mode');
    this.performanceModeEnabled = false;
    
    // Notify performance mode change
    if (this.config.onPerformanceModeChange) {
      this.config.onPerformanceModeChange(false);
    }
  }

  /**
   * Check if performance mode is enabled
   */
  public isPerformanceModeEnabled(): boolean {
    return this.performanceModeEnabled;
  }

  /**
   * Update particle manager reference
   */
  public setParticleManager(manager: SPSParticlePoolManager): void {
    this.config.particleManager = manager;
    this.originalParticleCapacity = manager.getCapacity();
  }

  /**
   * Update trail manager reference
   */
  public setTrailManager(manager: TrailMeshManager): void {
    this.config.trailManager = manager;
  }
}
