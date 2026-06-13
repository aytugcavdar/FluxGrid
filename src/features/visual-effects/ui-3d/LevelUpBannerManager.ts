/**
 * Level Up Banner Manager
 * 
 * Manages 3D level up banner that slides in from the side.
 * Shows level number with animation.
 */

import * as BABYLON from 'babylonjs';
import { UI3D_CONFIG, BannerInstance } from './config/ui3d.config';

export class LevelUpBannerManager {
  private scene: BABYLON.Scene;
  private activeBanners: BannerInstance[] = [];
  
  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }
  
  /**
   * Show level up banner
   * @param level New level number
   * @param position Center position for banner
   */
  public showLevelUp(level: number, position: BABYLON.Vector3): void {
    // Create banner background
    const banner = BABYLON.MeshBuilder.CreatePlane(
      'levelUpBanner',
      {
        width: UI3D_CONFIG.levelUpBanner.width,
        height: UI3D_CONFIG.levelUpBanner.height,
      },
      this.scene
    );
    
    // Create material with gradient
    const material = new BABYLON.StandardMaterial('bannerMaterial', this.scene);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);
    material.alpha = 0.9;
    material.disableLighting = true;
    banner.material = material;
    
    // Create text
    const textureSize = 1024;
    const dynamicTexture = new BABYLON.DynamicTexture(
      'bannerText',
      textureSize,
      this.scene,
      false
    );
    
    const ctx = dynamicTexture.getContext();
    ctx.font = 'bold 120px Arial';
    
    // Draw text
    dynamicTexture.drawText(
      `LEVEL ${level}`,
      null,
      null,
      'bold 120px Arial',
      'white',
      'transparent',
      true
    );
    
    // Create text plane
    const textPlane = BABYLON.MeshBuilder.CreatePlane(
      'bannerTextPlane',
      {
        width: UI3D_CONFIG.levelUpBanner.width * 0.8,
        height: UI3D_CONFIG.levelUpBanner.height * 0.6,
      },
      this.scene
    );
    
    const textMaterial = new BABYLON.StandardMaterial('bannerTextMat', this.scene);
    textMaterial.diffuseTexture = dynamicTexture;
    textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    textMaterial.opacityTexture = dynamicTexture;
    textMaterial.disableLighting = true;
    textPlane.material = textMaterial;
    
    // Position text slightly in front
    textPlane.position.z = 0.1;
    textPlane.parent = banner;
    
    // Set initial position (off-screen left)
    const startPos = position.clone();
    startPos.x -= UI3D_CONFIG.levelUpBanner.slideDistance;
    banner.position = startPos;
    
    // Set initial scale
    banner.scaling = new BABYLON.Vector3(
      UI3D_CONFIG.levelUpBanner.scaleFrom,
      UI3D_CONFIG.levelUpBanner.scaleFrom,
      1
    );
    
    // Billboard mode
    banner.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    // Create instance
    const instance: BannerInstance = {
      mesh: banner,
      textMesh: textPlane,
      startTime: Date.now(),
      duration: UI3D_CONFIG.levelUpBanner.duration,
      isActive: true,
    };
    
    this.activeBanners.push(instance);
  }
  
  /**
   * Update all banners
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    for (let i = this.activeBanners.length - 1; i >= 0; i--) {
      const banner = this.activeBanners[i];
      
      if (!banner.isActive) {
        continue;
      }
      
      const elapsed = currentTime - banner.startTime;
      const progress = Math.min(elapsed / banner.duration, 1.0);
      
      // Slide in animation (first 30%)
      if (progress < 0.3) {
        const slideProgress = progress / 0.3;
        const easedProgress = 1 - Math.pow(1 - slideProgress, 3); // Ease out
        banner.mesh.position.x += UI3D_CONFIG.levelUpBanner.slideDistance * easedProgress * (deltaTime / banner.duration);
      }
      
      // Scale animation (first 40%)
      if (progress < 0.4) {
        const scaleProgress = progress / 0.4;
        const scale = BABYLON.Scalar.Lerp(
          UI3D_CONFIG.levelUpBanner.scaleFrom,
          UI3D_CONFIG.levelUpBanner.scaleTo,
          scaleProgress
        );
        banner.mesh.scaling.x = scale;
        banner.mesh.scaling.y = scale;
      }
      
      // Fade out (last 30%)
      if (progress > 0.7) {
        const fadeProgress = (progress - 0.7) / 0.3;
        const alpha = 1.0 - fadeProgress;
        
        const material = banner.mesh.material as BABYLON.StandardMaterial;
        const textMaterial = banner.textMesh.material as BABYLON.StandardMaterial;
        
        if (material) material.alpha = alpha * 0.9;
        if (textMaterial) textMaterial.alpha = alpha;
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        banner.mesh.dispose();
        banner.textMesh.dispose();
        if (banner.mesh.material) banner.mesh.material.dispose();
        if (banner.textMesh.material) banner.textMesh.material.dispose();
        banner.isActive = false;
        this.activeBanners.splice(i, 1);
      }
    }
  }

  public hasActiveAnimations(): boolean {
    return this.activeBanners.length > 0;
  }
  
  /**
   * Dispose all banners
   */
  public dispose(): void {
    for (const banner of this.activeBanners) {
      if (banner.mesh) {
        banner.mesh.dispose();
        if (banner.mesh.material) banner.mesh.material.dispose();
      }
      if (banner.textMesh) {
        banner.textMesh.dispose();
        if (banner.textMesh.material) banner.textMesh.material.dispose();
      }
    }
    this.activeBanners = [];
  }
}
