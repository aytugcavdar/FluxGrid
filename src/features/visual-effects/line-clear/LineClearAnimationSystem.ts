/**
 * Line Clear Animation System
 * 
 * Coordinates flash effects, cascade animations, and special effects for line clears
 */

import * as BABYLON from 'babylonjs';
import { detectReducedMotion } from '../utils/reducedMotionDetector';

export interface LineClearParams {
  clearedLines: number[];
  cellPositions: BABYLON.Vector3[];
  hasColorBonus: boolean;
  isPerfectClear: boolean;
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
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
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
    
    // Emit confetti particles from grid center
    const centerPosition = new BABYLON.Vector3(0, 0, 0);
    
    for (let i = 0; i < confettiCount; i++) {
      this.createConfettiParticle(centerPosition);
    }
    
    // Display "PERFECT CLEAR!" text (handled by HUD component)
    // This will be triggered via event system
  }

  /**
   * Create a single confetti particle
   */
  private createConfettiParticle(origin: BABYLON.Vector3): void {
    const particle = BABYLON.MeshBuilder.CreateBox(`confetti-${Date.now()}-${Math.random()}`, {
      size: 0.2,
    }, this.scene);
    
    particle.position = origin.clone();
    
    // Random color
    const colors = [
      new BABYLON.Color3(1, 0, 0),
      new BABYLON.Color3(1, 0.5, 0),
      new BABYLON.Color3(1, 1, 0),
      new BABYLON.Color3(0, 1, 0),
      new BABYLON.Color3(0, 0, 1),
      new BABYLON.Color3(0.5, 0, 1),
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const material = new BABYLON.StandardMaterial(`confetti-mat-${Date.now()}`, this.scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.5);
    particle.material = material;
    
    // Random outward velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 5;
    const velocity = new BABYLON.Vector3(
      Math.cos(angle) * speed,
      10 + Math.random() * 5, // Upward
      Math.sin(angle) * speed
    );
    
    // Random rotation velocity
    const rotationVelocity = new BABYLON.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );
    
    // Animate particle
    const startTime = Date.now();
    const lifetime = 2000; // 2 seconds
    const gravity = -15;
    
    const animateParticle = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed >= lifetime / 1000) {
        particle.dispose();
        return;
      }
      
      // Apply physics
      const deltaTime = 0.016; // ~60fps
      velocity.y += gravity * deltaTime;
      
      particle.position.addInPlace(velocity.clone().scale(deltaTime));
      particle.rotation.addInPlace(rotationVelocity);
      
      // Fade out
      const fadeProgress = elapsed / (lifetime / 1000);
      if (particle.material) {
        (particle.material as BABYLON.StandardMaterial).alpha = 1 - fadeProgress;
      }
      
      requestAnimationFrame(animateParticle);
    };
    
    animateParticle();
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
