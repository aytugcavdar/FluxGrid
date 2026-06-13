/**
 * Mesh Deformation Manager
 * 
 * Manages all mesh deformation effects (ripple, implode, grid pulse).
 * Requirements: 5.1-5.10, 6.1-6.10, 7.1-7.11
 */

import * as BABYLON from 'babylonjs';
import {
  RIPPLE_EFFECT_CONFIG,
  IMPLODE_ANIMATION_CONFIG,
  GRID_PULSE_CONFIG,
  QUALITY_MULTIPLIERS,
  REDUCED_MOTION_MULTIPLIERS,
} from './config/juice.config';
import {
  easeOutSine,
  easeInBack,
  easeInOutSine,
  linear,
} from './utils/easingFunctions';
import type {
  RippleAnimation,
  ImplodeAnimation,
  GridPulseState,
  MeshDeformationConfig,
} from './types';

export class MeshDeformationManager {
  private activeRipples: Map<string, RippleAnimation>;
  private activeImplodes: Map<string, ImplodeAnimation>;
  private gridPulseState: GridPulseState | null;
  private qualityPreset: 'high' | 'medium' | 'low';
  private prefersReducedMotion: boolean;
  
  constructor(config: MeshDeformationConfig) {
    this.qualityPreset = config.qualityPreset;
    this.prefersReducedMotion = config.prefersReducedMotion;
    this.activeRipples = new Map();
    this.activeImplodes = new Map();
    this.gridPulseState = null;
  }
  
  /**
   * Trigger ripple effect
   * Requirements: 5.1-5.10
   */
  triggerRipple(
    epicenter: BABYLON.Vector3,
    meshMap: Map<string, BABYLON.Mesh>,
    dropHeight: number
  ): void {
    // Calculate amplitude boost from drop height
    let amplitudeBoost = dropHeight > RIPPLE_EFFECT_CONFIG.dropHeightBoost.threshold
      ? RIPPLE_EFFECT_CONFIG.dropHeightBoost.multiplier
      : 1.0;
    
    // Apply quality multiplier
    const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
    amplitudeBoost *= qualityMult.rippleAmplitude;
    
    // Apply reduced motion multiplier
    if (this.prefersReducedMotion) {
      amplitudeBoost *= REDUCED_MOTION_MULTIPLIERS.rippleAmplitude;
    }
    
    // Determine max distance based on quality
    const maxDistance = qualityMult.rippleDistance;
    
    // Find affected meshes within range
    const affectedMeshes = new Map<string, {
      mesh: BABYLON.Mesh;
      distance: number;
      originalScale: BABYLON.Vector3;
      targetAmplitude: number;
    }>();
    
    meshMap.forEach((mesh, cellId) => {
      // Skip if mesh is currently animating
      if (this.isMeshAnimating(mesh)) {
        return;
      }
      
      // Calculate grid distance (Manhattan distance)
      const distance = this.calculateGridDistance(mesh.position, epicenter);
      
      // Check if within ripple range
      if (distance > 0 && distance <= maxDistance) {
        // Calculate amplitude based on distance
        let amplitude: number;
        if (distance === 1) {
          amplitude = RIPPLE_EFFECT_CONFIG.amplitudes.distance1;
        } else if (distance === 2) {
          amplitude = RIPPLE_EFFECT_CONFIG.amplitudes.distance2;
        } else {
          return; // Beyond configured distances
        }
        
        // Apply amplitude boost
        amplitude = 1.0 + (amplitude - 1.0) * amplitudeBoost;
        
        affectedMeshes.set(cellId, {
          mesh,
          distance,
          originalScale: mesh.scaling.clone(),
          targetAmplitude: amplitude,
        });
      }
    });
    
    // Create ripple animation
    const rippleId = `ripple-${Date.now()}-${Math.random()}`;
    const ripple: RippleAnimation = {
      epicenter,
      affectedMeshes,
      startTime: Date.now(),
      duration: RIPPLE_EFFECT_CONFIG.duration,
      isActive: true,
    };
    
    this.activeRipples.set(rippleId, ripple);
    
    // Schedule ripple propagation
    const propagationSpeed = RIPPLE_EFFECT_CONFIG.propagationSpeed;
    affectedMeshes.forEach((data) => {
      const delay = (data.distance / propagationSpeed) * 1000; // Convert to ms
      
      setTimeout(() => {
        this.animateRippleWave(
          data.mesh,
          data.originalScale,
          data.targetAmplitude,
          RIPPLE_EFFECT_CONFIG.duration
        );
      }, delay);
    });
  }
  
  /**
   * Animate single ripple wave
   */
  private animateRippleWave(
    mesh: BABYLON.Mesh,
    originalScale: BABYLON.Vector3,
    amplitude: number,
    duration: number
  ): void {
    const startTime = Date.now();
    
    const updateRipple = () => {
      if (mesh.isDisposed()) {
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Ease-out-sine timing function
      const easedProgress = easeOutSine(progress);
      
      // Scale up then down (0 → 1 → 0)
      let scale: number;
      if (progress < 0.5) {
        // Growing phase
        scale = 1.0 + (amplitude - 1.0) * (easedProgress * 2);
      } else {
        // Shrinking phase
        scale = 1.0 + (amplitude - 1.0) * (2 - easedProgress * 2);
      }
      
      mesh.scaling = originalScale.scale(scale);
      
      if (progress < 1.0) {
        requestAnimationFrame(updateRipple);
      } else {
        // Restore original scale
        mesh.scaling = originalScale;
      }
    };
    
    requestAnimationFrame(updateRipple);
  }
  
  /**
   * Trigger implode animation
   * Requirements: 6.1-6.10
   */
  triggerImplode(meshes: BABYLON.Mesh[], lineIndices: number[]): void {
    // Sort lines from top to bottom
    const sortedLines = [...lineIndices].sort((a, b) => a - b);
    
    // Determine animation parameters based on quality
    let duration: number = IMPLODE_ANIMATION_CONFIG.duration;
    let rotationDegrees: number = IMPLODE_ANIMATION_CONFIG.rotationDegrees;
    
    if (this.qualityPreset === 'medium') {
      rotationDegrees = 90;
    } else if (this.qualityPreset === 'low') {
      rotationDegrees = 0;
      duration = 200;
    }
    
    // Apply reduced motion overrides
    if (this.prefersReducedMotion) {
      rotationDegrees = 0;
      duration = 150;
    }
    
    // Group meshes by line
    const meshesByLine = new Map<number, BABYLON.Mesh[]>();
    meshes.forEach((mesh) => {
      // Extract line index from mesh (assuming mesh has metadata or position)
      const lineIndex = this.getMeshLineIndex(mesh);
      if (!meshesByLine.has(lineIndex)) {
        meshesByLine.set(lineIndex, []);
      }
      meshesByLine.get(lineIndex)!.push(mesh);
    });
    
    // Schedule implode animations with stagger
    sortedLines.forEach((lineIndex, lineIdx) => {
      const lineDelay = lineIdx * IMPLODE_ANIMATION_CONFIG.staggerPerLine;
      const lineMeshes = meshesByLine.get(lineIndex) || [];
      
      // Sort meshes left to right
      const sortedMeshes = lineMeshes.sort((a, b) => a.position.x - b.position.x);
      
      sortedMeshes.forEach((mesh, meshIdx) => {
        const blockDelay = meshIdx * IMPLODE_ANIMATION_CONFIG.staggerPerBlock;
        const totalDelay = lineDelay + blockDelay;
        
        setTimeout(() => {
          this.animateImplode(mesh, duration, rotationDegrees);
        }, totalDelay);
      });
    });
  }
  
  /**
   * Animate single implode
   */
  private animateImplode(
    mesh: BABYLON.Mesh,
    duration: number,
    rotationDegrees: number
  ): void {
    if (mesh.isDisposed()) {
      return;
    }
    
    const startTime = Date.now();
    const originalScale = mesh.scaling.clone();
    const originalRotation = mesh.rotation.clone();
    const originalEmissive = mesh.material
      ? (mesh.material as BABYLON.StandardMaterial).emissiveColor.clone()
      : new BABYLON.Color3(0, 0, 0);
    
    const updateImplode = () => {
      if (mesh.isDisposed()) {
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Easing function
      const easedProgress = this.prefersReducedMotion
        ? linear(progress)
        : easeInBack(progress, IMPLODE_ANIMATION_CONFIG.overshootFactor);
      
      // Scale from 1.0 to 0.0
      const scale = 1.0 - easedProgress;
      mesh.scaling = originalScale.scale(scale);
      
      // Rotate
      if (rotationDegrees > 0) {
        const rotation = (rotationDegrees * Math.PI / 180) * easedProgress;
        mesh.rotation.y = originalRotation.y + rotation;
      }
      
      // Increase emissive intensity (first half only)
      if (progress < 0.5 && mesh.material) {
        const emissiveProgress = progress * 2; // 0 to 1 over first half
        const emissiveIntensity = BABYLON.Scalar.Lerp(
          IMPLODE_ANIMATION_CONFIG.emissiveStart,
          IMPLODE_ANIMATION_CONFIG.emissiveEnd,
          emissiveProgress
        );
        (mesh.material as BABYLON.StandardMaterial).emissiveColor =
          originalEmissive.scale(emissiveIntensity);
      }
      
      if (progress < 1.0) {
        requestAnimationFrame(updateImplode);
      } else {
        // Dispose mesh
        mesh.dispose();
      }
    };
    
    requestAnimationFrame(updateImplode);
  }
  
  /**
   * Start grid pulse
   * Requirements: 7.1-7.11
   */
  startPulse(meshMap: Map<string, BABYLON.Mesh>, comboLevel: number): void {
    // Skip if reduced motion
    if (this.prefersReducedMotion) {
      return;
    }
    
    // Determine frequency based on combo level
    let frequency: number;
    if (comboLevel >= 11) {
      frequency = GRID_PULSE_CONFIG.frequencies.high;
    } else if (comboLevel >= 8) {
      frequency = GRID_PULSE_CONFIG.frequencies.medium;
    } else {
      frequency = GRID_PULSE_CONFIG.frequencies.low;
    }
    
    // Apply 50% frequency reduction for low quality
    if (this.qualityPreset === 'low') {
      frequency *= 0.5;
    }
    
    // Collect all filled grid cells
    const affectedMeshes = new Map<string, {
      mesh: BABYLON.Mesh;
      originalScale: BABYLON.Vector3;
    }>();
    
    meshMap.forEach((mesh, cellId) => {
      if (mesh.isVisible) {
        affectedMeshes.set(cellId, {
          mesh,
          originalScale: mesh.scaling.clone(),
        });
      }
    });
    
    // Create pulse state
    this.gridPulseState = {
      affectedMeshes,
      frequency,
      lastPulseTime: Date.now(),
      isActive: true,
      comboLevel,
    };
  }
  
  /**
   * Stop grid pulse
   */
  stopPulse(): void {
    if (!this.gridPulseState) {
      return;
    }
    
    // Allow current pulse to complete, then stop
    this.gridPulseState.isActive = false;
    
    // Restore all meshes to original scale after current pulse
    setTimeout(() => {
      if (this.gridPulseState) {
        this.gridPulseState.affectedMeshes.forEach((data) => {
          if (!data.mesh.isDisposed()) {
            data.mesh.scaling = data.originalScale;
          }
        });
        this.gridPulseState = null;
      }
    }, GRID_PULSE_CONFIG.duration);
  }
  
  /**
   * Update all mesh deformations (called in render loop)
   */
  update(camera?: BABYLON.Camera): void {
    if (
      !this.gridPulseState
      && this.activeRipples.size === 0
      && this.activeImplodes.size === 0
    ) {
      return;
    }

    // Update grid pulse
    this.updateGridPulse();
    
    // Clean up completed ripples
    this.activeRipples.forEach((ripple, id) => {
      const elapsed = Date.now() - ripple.startTime;
      if (elapsed > ripple.duration * 2) { // Allow time for all waves
        this.activeRipples.delete(id);
      }
    });
    
    // Apply frustum culling if camera provided
    if (camera) {
      this.applyFrustumCulling(camera);
    }
  }

  hasActiveEffects(): boolean {
    return Boolean(this.gridPulseState?.isActive)
      || this.activeRipples.size > 0
      || this.activeImplodes.size > 0;
  }
  
  /**
   * Apply frustum culling to skip off-screen mesh updates
   * Requirements: 8.9
   */
  private applyFrustumCulling(camera: BABYLON.Camera): void {
    // Skip ripple updates for off-screen meshes
    this.activeRipples.forEach((ripple) => {
      ripple.affectedMeshes.forEach((data, cellId) => {
        if (!this.isInFrustum(data.mesh, camera)) {
          // Remove from affected meshes to skip updates
          ripple.affectedMeshes.delete(cellId);
        }
      });
    });
    
    // Skip implode updates for off-screen meshes
    this.activeImplodes.forEach((implode, id) => {
      if (!this.isInFrustum(implode.mesh, camera)) {
        // Mark as inactive to skip updates
        implode.isActive = false;
      }
    });
  }
  
  /**
   * Check if mesh is in camera frustum using bounding sphere test
   * Requirements: 8.9
   */
  private isInFrustum(mesh: BABYLON.Mesh, camera: BABYLON.Camera): boolean {
    if (mesh.isDisposed()) {
      return false;
    }
    
    // Get frustum planes from camera
    const frustumPlanes = BABYLON.Frustum.GetPlanes(
      camera.getTransformationMatrix()
    );
    
    // Use mesh's built-in frustum culling check
    return mesh.isInFrustum(frustumPlanes);
  }
  
  /**
   * Update grid pulse
   */
  private updateGridPulse(): void {
    if (!this.gridPulseState || !this.gridPulseState.isActive) {
      return;
    }
    
    const currentTime = Date.now();
    const pulseInterval = 1000 / this.gridPulseState.frequency; // ms
    
    // Check if it's time for next pulse
    if (currentTime - this.gridPulseState.lastPulseTime >= pulseInterval) {
      // Determine scaleMax based on quality
      const baseScaleMax = GRID_PULSE_CONFIG.scaleMax;
      const qualityMult = QUALITY_MULTIPLIERS[this.qualityPreset];
      const scaleMax = 1.0 + (baseScaleMax - 1.0) * qualityMult.pulseAmplitude;
      
      // Trigger synchronized pulse
      this.gridPulseState.affectedMeshes.forEach((data) => {
        this.animatePulse(
          data.mesh,
          data.originalScale,
          scaleMax,
          GRID_PULSE_CONFIG.duration
        );
      });
      
      this.gridPulseState.lastPulseTime = currentTime;
    }
  }
  
  /**
   * Animate single pulse
   */
  private animatePulse(
    mesh: BABYLON.Mesh,
    originalScale: BABYLON.Vector3,
    scaleMax: number,
    duration: number
  ): void {
    if (mesh.isDisposed()) {
      return;
    }
    
    const startTime = Date.now();
    
    const updatePulse = () => {
      if (mesh.isDisposed()) {
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Ease-in-out-sine timing function
      const easedProgress = easeInOutSine(progress);
      
      // Scale up then down (1.0 → scaleMax → 1.0)
      let scale: number;
      if (progress < 0.5) {
        // Growing phase
        scale = 1.0 + (scaleMax - 1.0) * (easedProgress * 2);
      } else {
        // Shrinking phase
        scale = 1.0 + (scaleMax - 1.0) * (2 - easedProgress * 2);
      }
      
      mesh.scaling = originalScale.scale(scale);
      
      if (progress < 1.0) {
        requestAnimationFrame(updatePulse);
      } else {
        // Restore original scale
        mesh.scaling = originalScale;
      }
    };
    
    requestAnimationFrame(updatePulse);
  }
  
  /**
   * Set quality preset
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
  }
  
  /**
   * Set reduced motion preference
   */
  setReducedMotion(enabled: boolean): void {
    this.prefersReducedMotion = enabled;
    
    // Stop grid pulse if reduced motion enabled
    if (enabled && this.gridPulseState) {
      this.stopPulse();
    }
  }
  
  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.activeRipples.clear();
    this.activeImplodes.clear();
    if (this.gridPulseState) {
      this.stopPulse();
    }
  }
  
  // Helper methods
  
  private isMeshAnimating(mesh: BABYLON.Mesh): boolean {
    // Check if mesh is part of any active animation
    for (const ripple of this.activeRipples.values()) {
      for (const data of ripple.affectedMeshes.values()) {
        if (data.mesh === mesh) {
          return true;
        }
      }
    }
    return false;
  }
  
  private calculateGridDistance(pos1: BABYLON.Vector3, pos2: BABYLON.Vector3): number {
    // Manhattan distance in grid units
    const dx = Math.abs(Math.round(pos1.x) - Math.round(pos2.x));
    const dz = Math.abs(Math.round(pos1.z) - Math.round(pos2.z));
    return Math.max(dx, dz); // Chebyshev distance for grid
  }
  
  private getMeshLineIndex(mesh: BABYLON.Mesh): number {
    // Extract line index from mesh position (assuming grid layout)
    // Grid is centered at origin, so convert position to grid coordinates
    const GRID_OFFSET = 4.5; // From Grid.tsx constants
    const TOTAL_CELL_SIZE = 1.0; // From Grid.tsx constants
    
    const gridY = Math.round((mesh.position.z + GRID_OFFSET) / TOTAL_CELL_SIZE);
    return gridY;
  }
}
