/**
 * Achievement Popup Manager
 * 
 * Manages 3D achievement popups that appear when unlocking achievements.
 * Pops in with scale animation and stays visible for a few seconds.
 */

import * as BABYLON from 'babylonjs';
import { UI3D_CONFIG, AchievementPopupInstance } from './config/ui3d.config';

export class AchievementPopupManager {
  private scene: BABYLON.Scene;
  private activePopups: AchievementPopupInstance[] = [];
  private popupQueue: Array<{ title: string; icon: string }> = [];
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  
  /**
   * Show achievement popup
   * @param title Achievement title
   * @param icon Icon character (emoji or symbol)
   * @param position Position in world space
   */
  public showAchievement(
    title: string,
    icon: string,
    position: BABYLON.Vector3
  ): void {
    // Queue if another popup is active
    if (this.activePopups.length > 0) {
      this.popupQueue.push({ title, icon });
      return;
    }
    
    this.createPopup(title, icon, position);
  }
  
  /**
   * Create popup mesh
   */
  private createPopup(
    title: string,
    icon: string,
    position: BABYLON.Vector3
  ): void {
    // Create background panel
    const panel = BABYLON.MeshBuilder.CreatePlane(
      'achievementPanel',
      {
        width: UI3D_CONFIG.achievementPopup.width,
        height: UI3D_CONFIG.achievementPopup.height,
      },
      this.scene
    );
    
    // Create material
    const material = new BABYLON.StandardMaterial('achievementMat', this.scene);
    material.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0.2);
    material.alpha = 0.95;
    material.disableLighting = true;
    panel.material = material;
    
    // Create icon texture
    const iconSize = 256;
    const iconTexture = new BABYLON.DynamicTexture(
      'achievementIcon',
      iconSize,
      this.scene,
      false
    );
    
    iconTexture.drawText(
      icon,
      null,
      null,
      'bold 120px Arial',
      'white',
      'transparent',
      true
    );
    
    // Create icon plane
    const iconPlane = BABYLON.MeshBuilder.CreatePlane(
      'achievementIconPlane',
      {
        width: UI3D_CONFIG.achievementPopup.height * 0.8,
        height: UI3D_CONFIG.achievementPopup.height * 0.8,
      },
      this.scene
    );
    
    const iconMaterial = new BABYLON.StandardMaterial('achievementIconMat', this.scene);
    iconMaterial.diffuseTexture = iconTexture;
    iconMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    iconMaterial.opacityTexture = iconTexture;
    iconMaterial.disableLighting = true;
    iconPlane.material = iconMaterial;
    
    // Position icon on left side
    iconPlane.position.x = -UI3D_CONFIG.achievementPopup.width * 0.35;
    iconPlane.position.z = 0.1;
    iconPlane.parent = panel;
    
    // Create text texture
    const textSize = 512;
    const textTexture = new BABYLON.DynamicTexture(
      'achievementText',
      textSize,
      this.scene,
      false
    );
    
    const ctx = textTexture.getContext();
    ctx.font = 'bold 48px Arial';
    
    // Draw "Achievement Unlocked!"
    textTexture.drawText(
      'Achievement!',
      null,
      textSize * 0.3,
      'bold 32px Arial',
      'rgba(255, 255, 255, 0.8)',
      'transparent',
      false
    );
    
    // Draw title
    textTexture.drawText(
      title,
      null,
      textSize * 0.6,
      'bold 48px Arial',
      'white',
      'transparent',
      false
    );
    
    // Create text plane
    const textPlane = BABYLON.MeshBuilder.CreatePlane(
      'achievementTextPlane',
      {
        width: UI3D_CONFIG.achievementPopup.width * 0.55,
        height: UI3D_CONFIG.achievementPopup.height * 0.8,
      },
      this.scene
    );
    
    const textMaterial = new BABYLON.StandardMaterial('achievementTextMat', this.scene);
    textMaterial.diffuseTexture = textTexture;
    textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    textMaterial.opacityTexture = textTexture;
    textMaterial.disableLighting = true;
    textPlane.material = textMaterial;
    
    // Position text on right side
    textPlane.position.x = UI3D_CONFIG.achievementPopup.width * 0.15;
    textPlane.position.z = 0.1;
    textPlane.parent = panel;
    
    // Set position
    panel.position = position.clone();
    
    // Set initial scale (small)
    panel.scaling = new BABYLON.Vector3(0.1, 0.1, 1);
    
    // Billboard mode
    panel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    // Create instance
    const instance: AchievementPopupInstance = {
      mesh: panel,
      iconMesh: iconPlane,
      textMesh: textPlane,
      startTime: Date.now(),
      duration: UI3D_CONFIG.achievementPopup.duration,
      displayTime: UI3D_CONFIG.achievementPopup.displayTime,
      isActive: true,
    };
    
    this.activePopups.push(instance);
  }
  
  /**
   * Update all popups
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    for (let i = this.activePopups.length - 1; i >= 0; i--) {
      const popup = this.activePopups[i];
      
      if (!popup.isActive) {
        continue;
      }
      
      const elapsed = currentTime - popup.startTime;
      const totalDuration = popup.duration + popup.displayTime;
      const progress = Math.min(elapsed / totalDuration, 1.0);
      
      // Pop in animation (first 20%)
      if (progress < 0.2) {
        const popProgress = progress / 0.2;
        let scale: number;
        
        if (popProgress < 0.7) {
          // Scale up to overshoot
          scale = BABYLON.Scalar.Lerp(0.1, UI3D_CONFIG.achievementPopup.popScale, popProgress / 0.7);
        } else {
          // Scale back to normal
          scale = BABYLON.Scalar.Lerp(UI3D_CONFIG.achievementPopup.popScale, 1.0, (popProgress - 0.7) / 0.3);
        }
        
        popup.mesh.scaling.x = scale;
        popup.mesh.scaling.y = scale;
      }
      
      // Hold (middle 60%)
      // No animation, just display
      
      // Fade out (last 20%)
      const fadeStartProgress = (popup.duration + popup.displayTime * 0.8) / totalDuration;
      if (progress > fadeStartProgress) {
        const fadeProgress = (progress - fadeStartProgress) / (1 - fadeStartProgress);
        const alpha = 1.0 - fadeProgress;
        
        const material = popup.mesh.material as BABYLON.StandardMaterial;
        const iconMaterial = popup.iconMesh.material as BABYLON.StandardMaterial;
        const textMaterial = popup.textMesh.material as BABYLON.StandardMaterial;
        
        if (material) material.alpha = alpha * 0.95;
        if (iconMaterial) iconMaterial.alpha = alpha;
        if (textMaterial) textMaterial.alpha = alpha;
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        popup.mesh.dispose();
        popup.iconMesh.dispose();
        popup.textMesh.dispose();
        
        if (popup.mesh.material) popup.mesh.material.dispose();
        if (popup.iconMesh.material) popup.iconMesh.material.dispose();
        if (popup.textMesh.material) popup.textMesh.material.dispose();
        
        popup.isActive = false;
        this.activePopups.splice(i, 1);
        
        // Show next in queue
        if (this.popupQueue.length > 0) {
          const next = this.popupQueue.shift()!;
          this.createPopup(next.title, next.icon, popup.mesh.position);
        }
      }
    }
  }
  
  /**
   * Dispose all popups
   */
  public dispose(): void {
    for (const popup of this.activePopups) {
      if (popup.mesh) {
        popup.mesh.dispose();
        if (popup.mesh.material) popup.mesh.material.dispose();
      }
      if (popup.iconMesh) {
        popup.iconMesh.dispose();
        if (popup.iconMesh.material) popup.iconMesh.material.dispose();
      }
      if (popup.textMesh) {
        popup.textMesh.dispose();
        if (popup.textMesh.material) popup.textMesh.material.dispose();
      }
    }
    this.activePopups = [];
    this.popupQueue = [];
  }
}
