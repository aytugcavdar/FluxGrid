/**
 * Line Clear Animation System
 * 
 * Coordinates flash effects, cascade animations, and special effects for line clears
 */

import * as BABYLON from 'babylonjs';
import { detectReducedMotion } from '../utils/reducedMotionDetector';
import { SPSParticlePoolManager } from '../particles/SPSParticlePoolManager';
import { EmissionConfig } from '../particles/config/particles.config';

export interface LineClearParams {
  clearedLines: number[];
  cellPositions: BABYLON.Vector3[];
  hasColorBonus: boolean;
  isPerfectClear: boolean;
  iceBlockPositions?: BABYLON.Vector3[]; // Positions of ice blocks that were cleared
}

interface LineClearAnimation {
  type: 'flash' | 'cascade' | 'rainbow' | 'confetti';
  startTime: number;
  duration: number;
  intensity: number;
  lineIndices: number[];
}

export class LineClearAnimationSystem {
  private scene: BABYLON.Scene;
  private activeAnimations: Map<string, LineClearAnimation> = new Map();
  private prefersReducedMotion: boolean;
  private flashMeshes: Map<number, BABYLON.Mesh> = new Map();
  private particleManager: SPSParticlePoolManager;
  private juiceEffectsManager: any = null;
  private deviceTier: string = 'mid'; // Default to mid tier
  
  constructor(scene: BABYLON.Scene, particleManager: SPSParticlePoolManager) {
    this.scene = scene;
    this.particleManager = particleManager;
    this.prefersReducedMotion = detectReducedMotion();
  }
  
  /**
   * Set device tier for particle optimization
   */
  public setDeviceTier(tier: string): void {
    this.deviceTier = tier;
    console.log('[LineClearAnimationSystem] Device tier set to:', tier);
  }

  /**
   * Trigger line clear animation sequence
   */
  public triggerLineClear(params: LineClearParams): void {
    const now = Date.now();
    const lineCount = params.clearedLines.length;
    
    // Calculate flash intensity (20% boost for 3+ lines)
    const baseIntensity = this.prefersReducedMotion ? 1.2 : 1.5; // 120% for reduced motion, 150% normal
    const intensityBoost = lineCount >= 3 ? 1.2 : 1.0;
    const flashIntensity = baseIntensity * intensityBoost;
    
    // 🎯 PARTICLE OPTIMIZATION: Reduce particle count for large line clears
    // Calculate particle multiplier based on line count and device tier
    let particleMultiplier = 1.0;
    
    // For 5+ line clears, reduce particles significantly
    if (lineCount >= 5) {
      // Tier-based reduction for large clears
      if (this.deviceTier === 'low' || this.deviceTier === 'low-mid') {
        particleMultiplier = 0.2; // 80% reduction
      } else if (this.deviceTier === 'mid-low' || this.deviceTier === 'mid') {
        particleMultiplier = 0.4; // 60% reduction
      } else if (this.deviceTier === 'mid-high') {
        particleMultiplier = 0.6; // 40% reduction
      } else {
        particleMultiplier = 0.8; // 20% reduction for HIGH tier
      }
    } else if (lineCount >= 3) {
      // For 3-4 line clears, moderate reduction
      if (this.deviceTier === 'low' || this.deviceTier === 'low-mid') {
        particleMultiplier = 0.4; // 60% reduction
      } else if (this.deviceTier === 'mid-low' || this.deviceTier === 'mid') {
        particleMultiplier = 0.6; // 40% reduction
      } else if (this.deviceTier === 'mid-high') {
        particleMultiplier = 0.8; // 20% reduction
      } else {
        particleMultiplier = 1.0; // No reduction for HIGH tier
      }
    }
    
    console.log(`[LineClearAnimationSystem] Line clear: ${lineCount} lines, tier: ${this.deviceTier}, particle multiplier: ${particleMultiplier}`);
    
    // Emit juice effects with particle multiplier
    if (this.juiceEffectsManager && params.cellPositions.length > 0) {
      // Single clears get a small centered snap; multi clears burst from sampled cells.
      if (lineCount === 1) {
        const center = params.cellPositions
          .reduce((sum, position) => sum.add(position), BABYLON.Vector3.Zero())
          .scale(1 / params.cellPositions.length);

        this.juiceEffectsManager.emitExplosionParticles(
          [center],
          [new BABYLON.Color3(1, 1, 1)],
          lineCount,
          { particleMultiplier: 0.8 }
        );
      } else if (lineCount >= 2) {
        const colors = params.cellPositions.map(() => new BABYLON.Color3(1, 1, 1));
        const sampleCount = Math.ceil(params.cellPositions.length * particleMultiplier);
        const reducedPositions = params.cellPositions.slice(0, sampleCount);
        const reducedColors = colors.slice(0, sampleCount);

        this.juiceEffectsManager.emitExplosionParticles(
          reducedPositions,
          reducedColors,
          lineCount,
          { particleMultiplier }
        );
      }
      
      // Icy particles for ice blocks
      if (params.iceBlockPositions && params.iceBlockPositions.length > 0) {
        // Apply particle multiplier to ice particles
        const reducedIcePositions = params.iceBlockPositions.slice(0, Math.ceil(params.iceBlockPositions.length * particleMultiplier));
        this.juiceEffectsManager.emitIcyParticles(reducedIcePositions);
      }
      
      // Implode animation for cleared cells
      // Note: This requires actual mesh references, not just positions
      // For now, we'll skip this until we have mesh references
      // this.juiceEffectsManager.triggerImplodeAnimation(clearedMeshes, params.clearedLines);
    }
    
    // Sequence: Rainbow (if color bonus) → Flash → Cascade
    let currentDelay = 0;
    
    // 1. Rainbow effect (if color bonus)
    if (params.hasColorBonus) {
      this.triggerRainbowEffect(params.clearedLines, now);
      currentDelay = 600; // Rainbow duration
    }
    
    // 2. Flash effect
    setTimeout(() => {
      this.triggerFlashEffect(params.clearedLines, flashIntensity, now + currentDelay);
    }, currentDelay);
    
    // 3. Cascade animation (starts with flash)
    setTimeout(() => {
      this.triggerCascadeAnimation(params.clearedLines, now + currentDelay);
    }, currentDelay);
    
    // 4. Perfect clear celebration
    if (params.isPerfectClear) {
      setTimeout(() => {
        this.triggerPerfectClear();
      }, currentDelay + 400); // After flash completes
    }
  }

  /**
   * Trigger flash effect for cleared lines
   */
  private triggerFlashEffect(lineIndices: number[], intensity: number, startTime: number): void {
    const animation: LineClearAnimation = {
      type: 'flash',
      startTime,
      duration: this.prefersReducedMotion ? 200 : 400, // 50% duration for reduced motion
      intensity,
      lineIndices,
    };
    
    this.activeAnimations.set('flash', animation);
    
    // Create flash meshes for each line
    lineIndices.forEach((lineIndex) => {
      const flashMesh = this.createFlashMesh(lineIndex, intensity);
      this.flashMeshes.set(lineIndex, flashMesh);
    });
    
    // Animate flash: peak brightness for 100ms, then fade over 300ms
    const peakDuration = this.prefersReducedMotion ? 50 : 100;
    const fadeDuration = this.prefersReducedMotion ? 150 : 300;
    
    setTimeout(() => {
      // Peak brightness
      this.flashMeshes.forEach((mesh) => {
        if (mesh.material) {
          (mesh.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(intensity, intensity, intensity);
        }
      });
      
      // Start fade
      setTimeout(() => {
        this.fadeFlashMeshes(fadeDuration);
      }, peakDuration);
    }, 0);
  }

  /**
   * Create flash mesh for a line
   */
  private createFlashMesh(lineIndex: number, intensity: number): BABYLON.Mesh {
    const mesh = BABYLON.MeshBuilder.CreatePlane(`flash-${lineIndex}`, {
      width: 10,
      height: 1,
    }, this.scene);
    
    mesh.position.y = 0;
    mesh.position.z = lineIndex - 4.5; // Center on grid
    mesh.rotation.x = Math.PI / 2;
    
    const material = new BABYLON.StandardMaterial(`flash-mat-${lineIndex}`, this.scene);
    material.diffuseColor = BABYLON.Color3.White();
    material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Start at 0
    material.alpha = 0.8;
    material.disableLighting = true;
    
    mesh.material = material;
    
    return mesh;
  }

  /**
   * Fade flash meshes over duration
   */
  private fadeFlashMeshes(duration: number): void {
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const brightness = 1 - progress; // Fade from 1 to 0
      
      this.flashMeshes.forEach((mesh) => {
        if (mesh.material) {
          (mesh.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(brightness, brightness, brightness);
        }
      });
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        // Dispose flash meshes
        this.flashMeshes.forEach((mesh) => {
          mesh.dispose();
        });
        this.flashMeshes.clear();
        this.activeAnimations.delete('flash');
      }
    }, 16); // ~60fps
  }

  /**
   * Trigger cascade animation (sequential line animation)
   */
  private triggerCascadeAnimation(lineIndices: number[], startTime: number): void {
    // Sort lines from top to bottom (lowest index to highest)
    const sortedLines = [...lineIndices].sort((a, b) => a - b);
    
    // Animate each line with 50ms delay
    sortedLines.forEach((lineIndex, i) => {
      setTimeout(() => {
        // Trigger line-specific animation (handled by flash effect)
      }, i * 50);
    });
    
    const animation: LineClearAnimation = {
      type: 'cascade',
      startTime,
      duration: sortedLines.length * 50,
      intensity: 1.0,
      lineIndices: sortedLines,
    };
    
    this.activeAnimations.set('cascade', animation);
  }

  /**
   * Trigger rainbow effect for color bonus
   */
  private triggerRainbowEffect(lineIndices: number[], startTime: number): void {
    const animation: LineClearAnimation = {
      type: 'rainbow',
      startTime,
      duration: 600,
      intensity: 1.0,
      lineIndices,
    };
    
    this.activeAnimations.set('rainbow', animation);
    
    // Rainbow colors: red, orange, yellow, green, blue, purple
    const rainbowColors = [
      new BABYLON.Color3(1, 0, 0),     // Red
      new BABYLON.Color3(1, 0.5, 0),   // Orange
      new BABYLON.Color3(1, 1, 0),     // Yellow
      new BABYLON.Color3(0, 1, 0),     // Green
      new BABYLON.Color3(0, 0, 1),     // Blue
      new BABYLON.Color3(0.5, 0, 1),   // Purple
    ];
    
    // Cycle through colors over 600ms
    const colorDuration = 600 / rainbowColors.length;
    let colorIndex = 0;
    
    const rainbowInterval = setInterval(() => {
      if (colorIndex >= rainbowColors.length) {
        clearInterval(rainbowInterval);
        this.activeAnimations.delete('rainbow');
        return;
      }
      
      const color = rainbowColors[colorIndex];
      
      // Apply color to flash meshes (if they exist)
      this.flashMeshes.forEach((mesh) => {
        if (mesh.material) {
          (mesh.material as BABYLON.StandardMaterial).emissiveColor = color;
        }
      });
      
      colorIndex++;
    }, colorDuration);
  }

  /**
   * Trigger perfect clear celebration
   */
  public triggerPerfectClear(): void {
    // 🎯 PARTICLE OPTIMIZATION: Tier-based confetti count
    let confettiCount: number;
    
    if (this.prefersReducedMotion) {
      // Reduced motion: minimal particles
      confettiCount = 10;
    } else {
      // Tier-based confetti count
      if (this.deviceTier === 'low' || this.deviceTier === 'low-mid') {
        confettiCount = 15; // Minimal
      } else if (this.deviceTier === 'mid-low' || this.deviceTier === 'mid') {
        confettiCount = 25; // Moderate
      } else if (this.deviceTier === 'mid-high') {
        confettiCount = 35; // Good
      } else {
        confettiCount = 50; // Full effect for HIGH tier
      }
    }
    
    console.log(`[LineClearAnimationSystem] Perfect clear: ${confettiCount} confetti particles (tier: ${this.deviceTier})`);
    
    // Emit confetti particles from grid center using SPS
    const centerPosition = new BABYLON.Vector3(0, 0, 0);
    
    // Rainbow colors for confetti
    const colors = [
      new BABYLON.Color4(1, 0, 0, 1),      // Red
      new BABYLON.Color4(1, 0.5, 0, 1),    // Orange
      new BABYLON.Color4(1, 1, 0, 1),      // Yellow
      new BABYLON.Color4(0, 1, 0, 1),      // Green
      new BABYLON.Color4(0, 0, 1, 1),      // Blue
      new BABYLON.Color4(0.5, 0, 1, 1),    // Purple
    ];
    
    // Emit confetti in batches with different colors
    const batchSize = Math.ceil(confettiCount / colors.length);
    
    colors.forEach((color) => {
      const config: EmissionConfig = {
        color,
        lifetime: 2000, // 2 seconds
        speed: 8, // Outward speed
        gravityDelay: 0, // Apply gravity immediately
        applyColorVariation: true, // Add visual richness
      };
      
      this.particleManager.emitRadial(centerPosition, batchSize, config);
    });
    
    // Display "PERFECT CLEAR!" text (handled by HUD component)
    // This will be triggered via event system
  }

  /**
   * Create a single confetti particle (DEPRECATED - now using SPS)
   * @deprecated Use SPSParticlePoolManager.emitRadial instead
   */
  private createConfettiParticle(origin: BABYLON.Vector3): void {
    // This method is deprecated and replaced by SPS particle emission
    // Keeping for reference during migration
    console.warn('createConfettiParticle is deprecated. Use SPSParticlePoolManager instead.');
  }

  /**
   * Update animation system (called every frame)
   */
  public update(deltaTime: number): void {
    // Update active animations
    // (Most animations are self-contained with timeouts/intervals)
  }

  /**
   * Set quality preset
   */
  public setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    // Adjust animation quality based on preset
    // (Can be extended for performance optimization)
  }

  /**
   * Set juice effects manager
   */
  public setJuiceEffectsManager(manager: any): void {
    this.juiceEffectsManager = manager;
  }
  
  /**
   * Set reduced motion preference
   */
  public setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
  }

  /**
   * Dispose system
   */
  public dispose(): void {
    this.flashMeshes.forEach((mesh) => mesh.dispose());
    this.flashMeshes.clear();
    this.activeAnimations.clear();
  }
}
