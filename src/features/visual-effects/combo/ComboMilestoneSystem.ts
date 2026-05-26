import * as BABYLON from 'babylonjs';
import { ParticleEmitter } from '../particles/ParticleEmitter';
import type { HapticManager } from '../../../utils/audio/haptics';

/**
 * ComboMilestoneSystem - Handles combo milestone celebrations
 * 
 * Requirements: 3.1-3.8
 * 
 * Milestones:
 * - 5x: White flash (0.15 opacity, 150ms)
 * - 10x: Gold flash (0.25 opacity, 200ms) + 20 particles
 * - 15x: Purple flash (0.35 opacity, 250ms) + 35 particles
 * - 20x: Rainbow flash (0.45 opacity, 300ms) + 50 particles
 */

export interface MilestoneConfig {
  level: number;
  flashOpacity: number;
  flashColor: string;
  flashDuration: number;
  particleCount: number;
}

const MILESTONE_CONFIGS: Record<number, MilestoneConfig> = {
  5: {
    level: 5,
    flashOpacity: 0.15,
    flashColor: '#ffffff',
    flashDuration: 150,
    particleCount: 0
  },
  10: {
    level: 10,
    flashOpacity: 0.25,
    flashColor: '#f59e0b',
    flashDuration: 200,
    particleCount: 20
  },
  15: {
    level: 15,
    flashOpacity: 0.35,
    flashColor: '#a78bfa',
    flashDuration: 250,
    particleCount: 35
  },
  20: {
    level: 20,
    flashOpacity: 0.45,
    flashColor: 'linear-gradient(135deg, #f59e0b, #ef4444, #a78bfa)',
    flashDuration: 300,
    particleCount: 50
  }
};

const CELEBRATION_COLORS = [
  new BABYLON.Color3(0.94, 0.62, 0.04), // Gold
  new BABYLON.Color3(0.94, 0.27, 0.27), // Red
  new BABYLON.Color3(0.66, 0.55, 0.98), // Purple
  new BABYLON.Color3(0.06, 0.73, 0.51), // Green
  new BABYLON.Color3(0.23, 0.51, 0.96)  // Blue
];

export class ComboMilestoneSystem {
  private particleEmitter: ParticleEmitter;
  private lastMilestone: number = 0;
  private prefersReducedMotion: boolean = false;
  private qualityPreset: 'high' | 'medium' | 'low' = 'high';
  private juiceEffectsManager: any = null;
  private meshMap: Map<string, any> | null = null;
  
  constructor(
    particleEmitter: ParticleEmitter,
    _hapticManager: HapticManager
  ) {
    this.particleEmitter = particleEmitter;
  }
  
  /**
   * Set juice effects manager
   * @param manager JuiceEffectsManager instance
   */
  public setJuiceEffectsManager(manager: any): void {
    this.juiceEffectsManager = manager;
  }
  
  /**
   * Set mesh map for grid pulse
   * @param meshMap Map of cell IDs to meshes
   */
  public setMeshMap(meshMap: Map<string, any>): void {
    this.meshMap = meshMap;
  }
  
  /**
   * Check and trigger milestone if reached
   * Requirements: 3.1-3.4
   */
  checkAndTrigger(currentCombo: number): void {
    const milestones = [5, 10, 15, 20];
    
    for (const milestone of milestones) {
      if (currentCombo >= milestone && this.lastMilestone < milestone) {
        this.triggerMilestone(milestone);
        this.lastMilestone = milestone;
        
        // Start grid pulse for high milestones (10+)
        if (milestone >= 10 && this.juiceEffectsManager && this.meshMap) {
          this.juiceEffectsManager.startGridPulse(this.meshMap, currentCombo);
        }
      }
    }
    
    // Reset when combo breaks
    if (currentCombo === 0) {
      this.lastMilestone = 0;
      
      // Stop grid pulse
      if (this.juiceEffectsManager) {
        this.juiceEffectsManager.stopGridPulse();
      }
    }
  }
  
  /**
   * Trigger milestone celebration
   * Requirements: 3.1-3.8
   */
  private triggerMilestone(level: number): void {
    const config = MILESTONE_CONFIGS[level];
    if (!config) return;
    
    // 1. Screen flash (or border pulse for reduced motion)
    if (this.prefersReducedMotion) {
      this.triggerBorderPulse(config);
    } else {
      this.triggerScreenFlash(config);
    }
    
    // 2. Particles (if count > 0 and not reduced motion)
    if (config.particleCount > 0 && !this.prefersReducedMotion) {
      this.emitCelebrationParticles(config.particleCount);
    }
    
    // 3. Audio and haptic feedback are handled by the game action router.
  }
  
  /**
   * Trigger screen flash effect
   * Requirements: 3.1-3.4
   */
  private triggerScreenFlash(config: MilestoneConfig): void {
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${config.flashColor};
      opacity: ${config.flashOpacity};
      pointer-events: none;
      z-index: 9999;
      transition: opacity ${config.flashDuration}ms ease-out;
    `;
    
    document.body.appendChild(overlay);
    
    // Fade out
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, config.flashDuration);
    });
  }
  
  /**
   * Trigger border pulse effect (reduced motion alternative)
   * Requirements: 3.7
   */
  private triggerBorderPulse(config: MilestoneConfig): void {
    // Create border element
    const border = document.createElement('div');
    border.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 4px solid ${config.flashColor};
      pointer-events: none;
      z-index: 9999;
      opacity: 0.8;
      transition: opacity ${config.flashDuration}ms ease-out;
    `;
    
    document.body.appendChild(border);
    
    // Fade out
    requestAnimationFrame(() => {
      border.style.opacity = '0';
      setTimeout(() => {
        border.remove();
      }, config.flashDuration);
    });
  }
  
  /**
   * Emit celebration particles
   * Requirements: 3.2-3.4
   */
  private emitCelebrationParticles(count: number): void {
    // Adjust count based on quality
    let adjustedCount = count;
    if (this.qualityPreset === 'medium') {
      adjustedCount = Math.floor(count * 0.6);
    } else if (this.qualityPreset === 'low') {
      adjustedCount = Math.floor(count * 0.4);
    }
    
    this.particleEmitter.emitCelebration(adjustedCount, CELEBRATION_COLORS);
  }
  
  /**
   * Set reduced motion preference
   * Requirements: 3.7
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
  }
  
  /**
   * Set quality preset
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
  }
  
  /**
   * Reset milestone tracking
   */
  reset(): void {
    this.lastMilestone = 0;
  }
}
