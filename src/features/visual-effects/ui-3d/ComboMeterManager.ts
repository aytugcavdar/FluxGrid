/**
 * Combo Meter Manager
 * 
 * Manages 3D combo meter ring that fills up as combo increases.
 * Pulses and rotates for visual feedback.
 */

import * as BABYLON from 'babylonjs';
import { UI3D_CONFIG, ComboMeterState } from './config/ui3d.config';

export class ComboMeterManager {
  private scene: BABYLON.Scene;
  private meterState: ComboMeterState | null = null;
  private isVisible: boolean = false;
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  
  /**
   * Initialize the combo meter
   * @param position Position in world space
   */
  public initialize(position: BABYLON.Vector3): void {
    // Create outer ring (background)
    const outerRing = BABYLON.MeshBuilder.CreateTorus(
      'comboMeterOuter',
      {
        diameter: UI3D_CONFIG.comboMeter.radius * 2,
        thickness: UI3D_CONFIG.comboMeter.thickness,
        tessellation: 64,
      },
      this.scene
    );
    
    outerRing.position = position.clone();
    outerRing.rotation.x = Math.PI / 2; // Lay flat
    
    // Create material for outer ring
    const outerMaterial = new BABYLON.StandardMaterial('comboMeterOuterMat', this.scene);
    outerMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    outerMaterial.alpha = 0.5;
    outerRing.material = outerMaterial;
    
    // Create inner ring (fill)
    const innerRing = BABYLON.MeshBuilder.CreateTorus(
      'comboMeterFill',
      {
        diameter: UI3D_CONFIG.comboMeter.radius * 2,
        thickness: UI3D_CONFIG.comboMeter.thickness * 0.8,
        tessellation: 64,
      },
      this.scene
    );
    
    innerRing.position = position.clone();
    innerRing.rotation.x = Math.PI / 2;
    
    // Create material for inner ring
    const innerMaterial = new BABYLON.StandardMaterial('comboMeterFillMat', this.scene);
    innerMaterial.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    innerMaterial.alpha = 0.8;
    innerRing.material = innerMaterial;
    
    // Initially hide fill
    innerRing.scaling = new BABYLON.Vector3(0, 0, 1);
    
    // Create state
    this.meterState = {
      mesh: outerRing,
      fillMesh: innerRing,
      currentCombo: 0,
      maxCombo: 10,
      isPulsing: false,
      pulseStartTime: 0,
    };
    
    // Initially hidden
    this.hide();
  }
  
  /**
   * Update combo value
   * @param combo Current combo count
   * @param maxCombo Maximum combo for this session
   */
  public updateCombo(combo: number, maxCombo: number = 10): void {
    if (!this.meterState) return;
    
    this.meterState.currentCombo = combo;
    this.meterState.maxCombo = maxCombo;
    
    // Show meter if combo > 0
    if (combo > 0 && !this.isVisible) {
      this.show();
    } else if (combo === 0 && this.isVisible) {
      this.hide();
    }
    
    // Update fill scale
    const fillPercentage = Math.min(combo / maxCombo, 1.0);
    this.meterState.fillMesh.scaling.x = fillPercentage;
    this.meterState.fillMesh.scaling.y = fillPercentage;
    
    // Update color based on combo level
    const material = this.meterState.fillMesh.material as BABYLON.StandardMaterial;
    if (material) {
      if (combo < 3) {
        material.emissiveColor = new BABYLON.Color3(1, 1, 0); // Yellow
      } else if (combo < 7) {
        material.emissiveColor = new BABYLON.Color3(1, 0.5, 0); // Orange
      } else {
        material.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red
      }
    }
    
    // Trigger pulse
    this.triggerPulse();
  }
  
  /**
   * Trigger pulse animation
   */
  private triggerPulse(): void {
    if (!this.meterState) return;
    
    this.meterState.isPulsing = true;
    this.meterState.pulseStartTime = Date.now();
  }
  
  /**
   * Update animation
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    if (!this.meterState || !this.isVisible) return;
    
    const currentTime = Date.now();
    
    // Rotate meter
    const rotationDelta = (UI3D_CONFIG.comboMeter.rotationSpeed * deltaTime) / 1000;
    this.meterState.mesh.rotation.z += rotationDelta;
    this.meterState.fillMesh.rotation.z += rotationDelta;
    
    // Handle pulse animation
    if (this.meterState.isPulsing) {
      const elapsed = currentTime - this.meterState.pulseStartTime;
      const progress = Math.min(elapsed / UI3D_CONFIG.comboMeter.pulseDuration, 1.0);
      
      if (progress < 0.5) {
        // Scale up
        const scale = 1.0 + (progress * 2) * (UI3D_CONFIG.comboMeter.pulseScale - 1.0);
        this.meterState.mesh.scaling.z = scale;
        this.meterState.fillMesh.scaling.z = scale;
      } else {
        // Scale down
        const scale = UI3D_CONFIG.comboMeter.pulseScale - ((progress - 0.5) * 2) * (UI3D_CONFIG.comboMeter.pulseScale - 1.0);
        this.meterState.mesh.scaling.z = scale;
        this.meterState.fillMesh.scaling.z = scale;
      }
      
      if (progress >= 1.0) {
        this.meterState.isPulsing = false;
        this.meterState.mesh.scaling.z = 1.0;
        this.meterState.fillMesh.scaling.z = 1.0;
      }
    }
  }
  
  /**
   * Show the combo meter
   */
  public show(): void {
    if (!this.meterState) return;
    
    this.isVisible = true;
    this.meterState.mesh.setEnabled(true);
    this.meterState.fillMesh.setEnabled(true);
  }
  
  /**
   * Hide the combo meter
   */
  public hide(): void {
    if (!this.meterState) return;
    
    this.isVisible = false;
    this.meterState.mesh.setEnabled(false);
    this.meterState.fillMesh.setEnabled(false);
  }
  
  /**
   * Dispose the combo meter
   */
  public dispose(): void {
    if (this.meterState) {
      this.meterState.mesh.dispose();
      this.meterState.fillMesh.dispose();
      if (this.meterState.mesh.material) {
        this.meterState.mesh.material.dispose();
      }
      if (this.meterState.fillMesh.material) {
        this.meterState.fillMesh.material.dispose();
      }
      this.meterState = null;
    }
  }
}
