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
  qualityPreset: AnimationQualityPreset;
  prefersReducedMotion: boolean;
}

export type AnimationQualityPreset = 'high' | 'medium' | 'low';

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

export interface QualityAwareAnimationSystem {
  setQualityPreset?: (preset: AnimationQualityPreset) => void;
  setReducedMotion?: (enabled: boolean) => void;
}

export interface PlacementImpactSystemLike extends QualityAwareAnimationSystem {
  trigger: (
    cellIds: string[],
    meshMap: Map<string, BABYLON.Mesh>,
    dropHeight: number
  ) => void;
  update?: (currentTime: number) => void;
}

export interface ComboMilestoneSystemLike extends QualityAwareAnimationSystem {
  checkAndTrigger: (level: number) => void;
}

export interface PerfectClearCelebrationLike extends QualityAwareAnimationSystem {
  trigger: () => void;
}

export interface ParticlePoolManagerLike {
  update: (deltaTime: number) => void;
  getTotalActiveCount?: () => number;
}

export interface ParticleEmitterLike {
  emitOutward: (
    type: 'lineClear',
    config: {
      position: BABYLON.Vector3;
      count: number;
      velocityMin: number;
      velocityMax: number;
      lifetime: number;
      color?: BABYLON.Color3;
      applyGravity?: boolean;
      gravityDelay?: number;
    }
  ) => number;
}

export interface JuiceEffectsManagerLike extends QualityAwareAnimationSystem {
  update: (deltaTimeSeconds: number) => void;
}

export class AnimationCoordinator {
  private qualityPreset: AnimationQualityPreset;
  private prefersReducedMotion: boolean;
  private activeAnimationCount: number = 0;
  
  // Animation systems (will be injected)
  private placementImpactSystem?: PlacementImpactSystemLike;
  private comboMilestoneSystem?: ComboMilestoneSystemLike;
  private perfectClearCelebration?: PerfectClearCelebrationLike;
  private particlePoolManager?: ParticlePoolManagerLike;
  private particleEmitter?: ParticleEmitterLike;
  private juiceEffectsManager?: JuiceEffectsManagerLike;
  
  constructor(config: AnimationCoordinatorConfig) {
    this.qualityPreset = config.qualityPreset;
    this.prefersReducedMotion = config.prefersReducedMotion;
  }
  
  /**
   * Set animation systems (dependency injection)
   */
  setPlacementImpactSystem(system: PlacementImpactSystemLike): void {
    this.placementImpactSystem = system;
  }
  
  setComboMilestoneSystem(system: ComboMilestoneSystemLike): void {
    this.comboMilestoneSystem = system;
  }
  
  setPerfectClearCelebration(system: PerfectClearCelebrationLike): void {
    this.perfectClearCelebration = system;
  }
  
  setParticlePoolManager(manager: ParticlePoolManagerLike): void {
    this.particlePoolManager = manager;
  }
  
  setParticleEmitter(emitter: ParticleEmitterLike): void {
    this.particleEmitter = emitter;
  }
  
  setJuiceEffectsManager(manager: JuiceEffectsManagerLike): void {
    this.juiceEffectsManager = manager;
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
   * Trigger combo milestone celebration
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
   * Emit lightweight particles for cleared lines through the shared pool.
   */
  emitLineClearParticles(params: LineClearParticleParams): void {
    if (this.prefersReducedMotion || !this.particleEmitter || this.qualityPreset === 'low') {
      return;
    }

    const clearedLines = Math.max(1, params.clearedLines || 1);
    const isLargeClear = params.is4LineClear || clearedLines >= 4;
    const count = this.qualityPreset === 'high'
      ? (isLargeClear ? 8 : 5)
      : (isLargeClear ? 5 : 3);
    const lifetime = isLargeClear ? 650 : 450;

    this.activeAnimationCount++;
    this.particleEmitter.emitOutward('lineClear', {
      position: params.position,
      count,
      velocityMin: isLargeClear ? 450 : 300,
      velocityMax: isLargeClear ? 700 : 520,
      lifetime,
      color: BABYLON.Color3.FromHexString(params.color || '#ffffff'),
      applyGravity: true,
      gravityDelay: 120,
    });

    setTimeout(() => {
      this.activeAnimationCount = Math.max(0, this.activeAnimationCount - 1);
    }, lifetime);
  }
  
  /**
   * Set quality preset for all animations
   * Requirements: 13.1-13.6, 14.1-14.6
   */
  setQualityPreset(preset: AnimationQualityPreset): void {
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
    if (this.juiceEffectsManager?.setQualityPreset) {
      this.juiceEffectsManager.setQualityPreset(preset);
    }
  }
  
  /**
   * Get current active animation count
   */
  getActiveAnimationCount(): number {
    return this.activeAnimationCount;
  }

  hasActiveWork(): boolean {
    return this.activeAnimationCount > 0
      || (this.particlePoolManager?.getTotalActiveCount?.() ?? 0) > 0;
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
    if (this.juiceEffectsManager?.setReducedMotion) {
      this.juiceEffectsManager.setReducedMotion(enabled);
    }
  }
  
  /**
   * Update all animation systems (called in render loop)
   * @param deltaTime Real elapsed time in ms from Babylon engine
   */
  update(deltaTime: number): void {
    if (this.placementImpactSystem?.update) {
      this.placementImpactSystem.update(Date.now());
    }
    
    if (this.particlePoolManager?.update) {
      this.particlePoolManager.update(deltaTime);
    }
    
    // Juice effects are updated centrally by Grid to avoid duplicate work.
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
    this.particlePoolManager = undefined;
    this.particleEmitter = undefined;
    this.juiceEffectsManager = undefined;
  }
}
