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
  
  constructor(scene: BABYLON.Scene, particleManager: SPSParticlePoolManager) {
    this.scene = scene;
    this.particleManager = particleManager;
    this.prefersReducedMotion = detectReducedMotion();
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
    
    // Emit juice effects
    if (this.juiceEffectsManager && params.cellPositions.length > 0) {
      // Explosion particles for multi-line clears
      if (lineCount >= 2) {
        // Create colors array (use white for now, can be customized later)
        const colors = params.cellPositions.map(() => new BABYLON.Color3(1, 1, 1));
        this.juiceEffectsManager.emitExplosionParticles(params.cellPositions, colors, lineCount);
      }
      
      // Icy particles for ice blocks
      if (params.iceBlockPositions && params.iceBlockPositions.length > 0) {
        this.juiceEffectsManager.emitIcyParticles(params.iceBlockPositions);
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
    const confettiCount = this.prefersReducedMotion ? 15 : 50;
    
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
