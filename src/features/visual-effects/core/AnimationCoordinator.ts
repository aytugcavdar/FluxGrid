import * as BABYLON from 'babylonjs';

/**
 * AnimationCoordinator - Central coordination layer for all game animations
 * 
 * Responsibilities:
 * - Coordinate animations between Babylon.js (3D) and Framer Motion (2D UI)
 * - Manage animation quality based on performance
 * - Support reduced motion accessibility
 * - Prioritize gameplay-critical animations
 */

export interface AnimationCoordinatorConfig {
  scene: BABYLON.Scene;
  qualityPreset: 'high' | 'medium' | 'low';
  prefersReducedMotion: boolean;
}

export interface PlacementImpactParams {
  cellIds: string[];
  meshMap: Map<string, BABYLON.Mesh>;
  dropHeight: number;
}

export interface ScorePopupParams {
  value: number;
  position: { x: number; y: number };
  combo: number;
}

export interface ComboMilestoneParams {
  level: number;
}

export interface LineClearParticleParams {
  position: BABYLON.Vector3;
  color: string;
  clearedLines: number;
  is4LineClear: boolean;
}

export class AnimationCoordinator {
  private scene: BABYLON.Scene;
  private qualityPreset: 'high' | 'medium' | 'low';
  private prefersReducedMotion: boolean;
  private activeAnimationCount: number = 0;
  
  // Animation systems (will be injected)
  private placementImpactSystem?: any;
  private comboMilestoneSystem?: any;
  private perfectClearCelebration?: any;
  private particlePoolManager?: any;
  private particleEmitter?: any;
  
  constructor(config: AnimationCoordinatorConfig) {
    this.scene = config.scene;
    this.qualityPreset = config.qualityPreset;
    this.prefersReducedMotion = config.prefersReducedMotion;
  }
  
  /**
   * Set animation systems (dependency injection)
   */
  setPlacementImpactSystem(system: any): void {
    this.placementImpactSystem = system;
  }
  
  setComboMilestoneSystem(system: any): void {
    this.comboMilestoneSystem = system;
  }
  
  setPerfectClearCelebration(system: any): void {
    this.perfectClearCelebration = system;
  }
  
  setParticlePoolManager(manager: any): void {
    this.particlePoolManager = manager;
  }
  
  setParticleEmitter(emitter: any): void {
    this.particleEmitter = emitter;
  }
  
  /**
   * Trigger placement impact animation
   * Requirements: 1.1-1.7
   */
  triggerPlacementImpact(params: PlacementImpactParams): void {
    if (this.placementImpactSystem) {
      this.activeAnimationCount++;
      this.placementImpactSystem.trigger(
        params.cellIds,
        params.meshMap,
        params.dropHeight
      );
      
      // Auto-decrement after animation duration (200ms)
      setTimeout(() => {
        this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
      }, 200);
    }
  }
  
  /**
   * Trigger score popup animation
   * Requirements: 2.1-2.8
   */
  triggerScorePopup(params: ScorePopupParams): void {
    // Score popups are handled by React/Framer Motion component
    // This method is here for API completeness and future coordination
    this.activeAnimationCount++;
    
    // Dispatch custom event for React component to listen
    window.dispatchEvent(new CustomEvent('score-popup', {
      detail: params
    }));
    
    // Auto-decrement after animation duration (800ms)
    setTimeout(() => {
      this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
    }, 800);
  }
  
  /**
   * Trigger combo milestone celebration
   * Requirements: 3.1-3.8
   */
  triggerComboMilestone(params: ComboMilestoneParams): void {
    if (this.comboMilestoneSystem) {
      this.activeAnimationCount++;
      this.comboMilestoneSystem.checkAndTrigger(params.level);
      
      // Auto-decrement after animation duration (500ms)
      setTimeout(() => {
        this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
      }, 500);
    }
  }
  
  /**
   * Trigger perfect clear celebration
   * Requirements: 7.1-7.8
   */
  triggerPerfectClear(): void {
    if (this.perfectClearCelebration) {
      this.activeAnimationCount++;
      this.perfectClearCelebration.trigger();
      
      // Auto-decrement after animation duration (2000ms)
      setTimeout(() => {
        this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
      }, 2000);
    }
  }
  
  /**
   * Set quality preset for all animations
   * Requirements: 13.1-13.6, 14.1-14.6
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
    
    // Propagate to animation systems
    if (this.placementImpactSystem?.setQualityPreset) {
      this.placementImpactSystem.setQualityPreset(preset);
    }
    if (this.comboMilestoneSystem?.setQualityPreset) {
      this.comboMilestoneSystem.setQualityPreset(preset);
    }
    if (this.perfectClearCelebration?.setQualityPreset) {
      this.perfectClearCelebration.setQualityPreset(preset);
    }
  }
  
  /**
   * Get current active animation count
   */
  getActiveAnimationCount(): number {
    return this.activeAnimationCount;
  }
  
  /**
   * Set reduced motion preference
   * Requirements: 15.1-15.7
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
    
    // Propagate to animation systems
    if (this.placementImpactSystem?.setReducedMotion) {
      this.placementImpactSystem.setReducedMotion(enabled);
    }
    if (this.comboMilestoneSystem?.setReducedMotion) {
      this.comboMilestoneSystem.setReducedMotion(enabled);
    }
    if (this.perfectClearCelebration?.setReducedMotion) {
      this.perfectClearCelebration.setReducedMotion(enabled);
    }
  }
  
  /**
   * Update all animation systems (called in render loop)
   */
  update(currentTime: number): void {
    if (this.placementImpactSystem?.update) {
      this.placementImpactSystem.update(currentTime);
    }
    
    // Task 20.5: Update particle pool manager for gravity physics
    if (this.particlePoolManager?.update) {
      const deltaTime = 16; // Approximate 60 FPS
      this.particlePoolManager.update(deltaTime);
    }
  }
  
  /**
   * Emit line clear particles
   * Task 20: Enhanced line clear particle system
   * Requirements: 4.1-4.8
   */
  emitLineClearParticles(params: LineClearParticleParams): void {
    if (!this.particleEmitter || !this.particlePoolManager) return;
    
    // Task 20.1: Calculate particle count based on cleared lines
    // Requirements: 4.1, 4.7
    let particlesPerCell = params.clearedLines * 15;
    
    // Task 20.8: Optimize for low-end devices
    if (this.qualityPreset === 'low') {
      particlesPerCell = params.clearedLines * 8;
    }
    
    // Task 20.9: Reduced motion support
    if (this.prefersReducedMotion) {
      particlesPerCell = 5; // Only 5 particles per line
    }
    
    // Task 20.3: Emit particles with velocity (200-400 px/s)
    // Task 20.5: Set lifetime to 1200ms
    // Task 20.7: Use trail particle type for 4-line clears
    const particleType = params.is4LineClear && !this.prefersReducedMotion && this.qualityPreset !== 'low' 
      ? 'trail' 
      : 'lineClear';
    
    // Convert hex color to BABYLON.Color3
    const color = BABYLON.Color3.FromHexString(params.color);
    
    // Emit particles
    this.particleEmitter.emitOutward(particleType, {
      position: params.position,
      count: particlesPerCell,
      velocityMin: 200,
      velocityMax: 400,
      lifetime: 1200, // Task 20.5: 1200ms lifetime
      color: color,
      applyGravity: !this.prefersReducedMotion, // Task 20.5: Apply gravity
      gravityDelay: 100 // Task 20.5: 100ms delay before gravity
    });
  }
  
  /**
   * Pause all animations
   */
  pauseAll(): void {
    // Implementation for context loss recovery
    this.activeAnimationCount = 0;
  }
  
  /**
   * Resume all animations
   */
  resumeAll(): void {
    // Implementation for context restoration
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.activeAnimationCount = 0;
    this.placementImpactSystem = undefined;
    this.comboMilestoneSystem = undefined;
    this.perfectClearCelebration = undefined;
  }
}
