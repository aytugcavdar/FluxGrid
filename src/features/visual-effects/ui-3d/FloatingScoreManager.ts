/**
 * Floating Score Manager
 * 
 * Manages 3D floating score text that appears when scoring points.
 * Scores float upward and fade out.
 */

import * as BABYLON from 'babylonjs';
import { UI3D_CONFIG, FloatingScoreInstance } from './config/ui3d.config';

export class FloatingScoreManager {
  private scene: BABYLON.Scene;
  private activeScores: FloatingScoreInstance[] = [];
  private font: string = 'bold 48px Arial';
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  
  /**
   * Create a floating score text
   * @param score Score value to display
   * @param position Starting position
   * @param color Text color
   */
  public createFloatingScore(
    score: number,
    position: BABYLON.Vector3,
    color: BABYLON.Color3 = new BABYLON.Color3(1, 1, 0)
  ): void {
    // Create dynamic texture for text
    const textureSize = 512;
    const dynamicTexture = new BABYLON.DynamicTexture(
      'scoreTexture',
      textureSize,
      this.scene,
      false
    );
    
    // Draw text on texture
    const ctx = dynamicTexture.getContext();
    ctx.font = this.font;
    const text = `+${score}`;
    
    // Clear and draw
    dynamicTexture.drawText(
      text,
      null,
      null,
      this.font,
      `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`,
      'transparent',
      true
    );
    
    // Create plane for text
    const plane = BABYLON.MeshBuilder.CreatePlane(
      'scorePlane',
      { width: 2, height: 1 },
      this.scene
    );
    
    // Create material
    const material = new BABYLON.StandardMaterial('scoreMaterial', this.scene);
    material.diffuseTexture = dynamicTexture;
    material.emissiveColor = color;
    material.opacityTexture = dynamicTexture;
    material.backFaceCulling = false;
    material.disableLighting = true;
    plane.material = material;
    
    // Set position
    plane.position = position.clone();
    
    // Billboard mode (always face camera)
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    // Create instance
    const instance: FloatingScoreInstance = {
      mesh: plane,
      startTime: Date.now(),
      duration: UI3D_CONFIG.floatingScore.duration,
      startPosition: position.clone(),
      endPosition: position.add(new BABYLON.Vector3(0, UI3D_CONFIG.floatingScore.floatDistance, 0)),
      isActive: true,
    };
    
    this.activeScores.push(instance);
  }
  
  /**
   * Update all floating scores
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    for (let i = this.activeScores.length - 1; i >= 0; i--) {
      const score = this.activeScores[i];
      
      if (!score.isActive) {
        continue;
      }
      
      const elapsed = currentTime - score.startTime;
      const progress = Math.min(elapsed / score.duration, 1.0);
      
      // Update position (ease out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      score.mesh.position = BABYLON.Vector3.Lerp(
        score.startPosition,
        score.endPosition,
        easedProgress
      );
      
      // Update alpha (fade out in last 40%)
      if (progress > UI3D_CONFIG.floatingScore.fadeStart) {
        const fadeProgress = (progress - UI3D_CONFIG.floatingScore.fadeStart) / 
                            (1 - UI3D_CONFIG.floatingScore.fadeStart);
        const alpha = 1.0 - fadeProgress;
        
        const material = score.mesh.material as BABYLON.StandardMaterial;
        if (material) {
          material.alpha = alpha;
        }
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        score.mesh.dispose();
        if (score.mesh.material) {
          score.mesh.material.dispose();
        }
        score.isActive = false;
        this.activeScores.splice(i, 1);
      }
    }
  }
  
  /**
   * Dispose all floating scores
   */
  public dispose(): void {
    for (const score of this.activeScores) {
      if (score.mesh) {
        score.mesh.dispose();
        if (score.mesh.material) {
          score.mesh.material.dispose();
        }
      }
    }
    this.activeScores = [];
  }
}
