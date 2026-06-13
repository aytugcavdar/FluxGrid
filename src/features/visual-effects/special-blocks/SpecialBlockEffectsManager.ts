/**
 * Special Block Effects Manager
 * 
 * Manages all special block effects: Bomb, Ice, Fire, Lightning
 * Integrates with particle system and provides visual feedback
 */

import * as BABYLON from 'babylonjs';
import { SPSParticlePoolManager } from '../particles/SPSParticlePoolManager';
import { EmissionConfig } from '../particles/config/particles.config';
import {
  SpecialBlockType,
  SPECIAL_BLOCK_CONFIG,
  BombExplosionEffect,
  IceFrostEffect,
  FireBurnEffect,
  LightningChainEffect,
} from './config/specialBlocks.config';

export class SpecialBlockEffectsManager {
  private scene: BABYLON.Scene;
  private particleManager: SPSParticlePoolManager;
  
  // Active effects
  private bombExplosions: BombExplosionEffect[] = [];
  private iceFrosts: IceFrostEffect[] = [];
  private fireBurns: FireBurnEffect[] = [];
  private lightningChains: LightningChainEffect[] = [];
  
  constructor(scene: BABYLON.Scene, particleManager: SPSParticlePoolManager) {
    this.scene = scene;
    this.particleManager = particleManager;
  }
  
  /**
   * Trigger bomb explosion effect
   * @param position Explosion center
   * @param onBlockDestroy Callback for destroying blocks in radius
   */
  public triggerBombExplosion(
    position: BABYLON.Vector3,
    onBlockDestroy?: (x: number, y: number) => void
  ): void {
    const config = SPECIAL_BLOCK_CONFIG.bomb;
    
    // Emit explosion particles
    const explosionConfig: EmissionConfig = {
      color: config.color,
      lifetime: 1000,
      speed: 5.0,
      gravityDelay: 300,
      applyColorVariation: false,
    };
    
    this.particleManager.emitRadial(position, config.particleCount, explosionConfig);
    
    // Emit fire particles
    const fireConfig: EmissionConfig = {
      color: new BABYLON.Color4(1, 0.5, 0, 1),
      lifetime: 800,
      speed: 3.0,
      gravityDelay: 400,
      applyColorVariation: false,
    };
    
    this.particleManager.emitFire(position, 50, fireConfig);
    
    // Create shockwave ring
    const shockwave = BABYLON.MeshBuilder.CreateTorus(
      'bombShockwave',
      {
        diameter: 0.5,
        thickness: 0.1,
        tessellation: 32,
      },
      this.scene
    );
    
    shockwave.position = position.clone();
    shockwave.rotation.x = Math.PI / 2;
    
    const material = new BABYLON.StandardMaterial('shockwaveMat', this.scene);
    material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    material.alpha = 0.8;
    material.disableLighting = true;
    shockwave.material = material;
    
    // Create effect instance
    const effect: BombExplosionEffect = {
      position: position.clone(),
      startTime: Date.now(),
      duration: config.shockwaveDuration,
      shockwaveMesh: shockwave,
      isActive: true,
    };
    
    this.bombExplosions.push(effect);
    
    // Destroy blocks in radius (if callback provided)
    if (onBlockDestroy) {
      const gridX = Math.round(position.x);
      const gridY = Math.round(position.y);
      
      for (let dx = -config.explosionRadius; dx <= config.explosionRadius; dx++) {
        for (let dy = -config.explosionRadius; dy <= config.explosionRadius; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= config.explosionRadius) {
            onBlockDestroy(gridX + dx, gridY + dy);
          }
        }
      }
    }
  }
  
  /**
   * Trigger ice freeze effect
   * @param position Ice block position
   * @param affectedBlocks Blocks to freeze
   */
  public triggerIceFreeze(
    position: BABYLON.Vector3,
    affectedBlocks: Array<{ x: number; y: number; mesh: BABYLON.Mesh }>
  ): void {
    const config = SPECIAL_BLOCK_CONFIG.ice;
    
    // Emit ice particles
    const iceConfig: EmissionConfig = {
      color: config.color,
      lifetime: 1500,
      speed: 2.0,
      gravityDelay: 999999, // No gravity
      applyColorVariation: false,
    };
    
    this.particleManager.emitRadial(position, config.particleCount, iceConfig);
    
    // Create frost overlay on affected blocks
    const frostMeshes: BABYLON.Mesh[] = [];
    
    for (const block of affectedBlocks) {
      const frost = BABYLON.MeshBuilder.CreateBox(
        'frostOverlay',
        { size: 1.05 }, // Slightly larger than block
        this.scene
      );
      
      frost.position = new BABYLON.Vector3(block.x, block.y, 0);
      
      const frostMaterial = new BABYLON.StandardMaterial('frostMat', this.scene);
      frostMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.8, 1);
      frostMaterial.alpha = config.frostAlpha;
      frostMaterial.disableLighting = true;
      frost.material = frostMaterial;
      
      frostMeshes.push(frost);
    }
    
    // Create effect instance
    const effect: IceFrostEffect = {
      targetBlocks: affectedBlocks.map(b => ({ x: b.x, y: b.y })),
      frostMeshes,
      startTime: Date.now(),
      duration: config.freezeDuration,
      isActive: true,
    };
    
    this.iceFrosts.push(effect);
  }
  
  /**
   * Trigger fire burn effect
   * @param position Fire block position
   * @param gridX Grid X coordinate
   * @param gridY Grid Y coordinate
   */
  public triggerFireBurn(
    position: BABYLON.Vector3,
    gridX: number,
    gridY: number
  ): void {
    const config = SPECIAL_BLOCK_CONFIG.fire;
    
    // Emit fire particles
    const fireConfig: EmissionConfig = {
      color: config.color,
      lifetime: 1000,
      speed: 3.0,
      gravityDelay: 500,
      applyColorVariation: false,
    };
    
    this.particleManager.emitFire(position, config.particleCount, fireConfig);
    
    // Create flame mesh
    const flame = BABYLON.MeshBuilder.CreateCylinder(
      'flame',
      { height: 1.5, diameter: 0.8 },
      this.scene
    );
    
    flame.position = position.clone();
    flame.position.y += 0.5;
    
    const flameMaterial = new BABYLON.StandardMaterial('flameMat', this.scene);
    flameMaterial.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    flameMaterial.alpha = 0.7;
    flameMaterial.disableLighting = true;
    flame.material = flameMaterial;
    
    // Create effect instance
    const effect: FireBurnEffect = {
      position: position.clone(),
      gridX,
      gridY,
      startTime: Date.now(),
      duration: config.burnDuration,
      flameMesh: flame,
      isActive: true,
    };
    
    this.fireBurns.push(effect);
  }
  
  /**
   * Trigger lightning chain effect
   * @param startPosition Starting position
   * @param chainTargets Target positions for chain
   */
  public triggerLightningChain(
    startPosition: BABYLON.Vector3,
    chainTargets: BABYLON.Vector3[]
  ): void {
    const config = SPECIAL_BLOCK_CONFIG.lightning;
    
    // Create chain positions (start + targets)
    const chainPositions = [startPosition, ...chainTargets.slice(0, config.chainCount)];
    
    // Create effect instance
    const effect: LightningChainEffect = {
      chainPositions,
      currentChain: 0,
      lastChainTime: Date.now(),
      chainDelay: config.chainDelay,
      isActive: true,
    };
    
    this.lightningChains.push(effect);
    
    // Trigger first lightning
    this.triggerLightningBolt(startPosition);
  }
  
  /**
   * Trigger single lightning bolt
   */
  private triggerLightningBolt(position: BABYLON.Vector3): void {
    const config = SPECIAL_BLOCK_CONFIG.lightning;
    
    const lightningConfig: EmissionConfig = {
      color: config.color,
      lifetime: 300,
      speed: 8.0,
      gravityDelay: 999999,
      applyColorVariation: false,
    };
    
    this.particleManager.emitLightning(position, config.particleCount, lightningConfig);
  }
  
  /**
   * Update all effects
   * @param deltaTime Time since last frame (ms)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update bomb explosions
    for (let i = this.bombExplosions.length - 1; i >= 0; i--) {
      const effect = this.bombExplosions[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Expand shockwave
      const scale = 1 + progress * (SPECIAL_BLOCK_CONFIG.bomb.shockwaveRadius - 1);
      effect.shockwaveMesh.scaling.x = scale;
      effect.shockwaveMesh.scaling.y = scale;
      
      // Fade out
      const material = effect.shockwaveMesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.alpha = 0.8 * (1 - progress);
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        effect.shockwaveMesh.dispose();
        if (effect.shockwaveMesh.material) {
          effect.shockwaveMesh.material.dispose();
        }
        this.bombExplosions.splice(i, 1);
      }
    }
    
    // Update ice frosts
    for (let i = this.iceFrosts.length - 1; i >= 0; i--) {
      const effect = this.iceFrosts[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Pulse frost
      const pulseScale = 1 + Math.sin(elapsed * 0.005) * 0.05;
      for (const frost of effect.frostMeshes) {
        frost.scaling.x = pulseScale;
        frost.scaling.y = pulseScale;
      }
      
      // Fade out in last 20%
      if (progress > 0.8) {
        const fadeProgress = (progress - 0.8) / 0.2;
        const alpha = SPECIAL_BLOCK_CONFIG.ice.frostAlpha * (1 - fadeProgress);
        
        for (const frost of effect.frostMeshes) {
          const material = frost.material as BABYLON.StandardMaterial;
          if (material) {
            material.alpha = alpha;
          }
        }
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        for (const frost of effect.frostMeshes) {
          frost.dispose();
          if (frost.material) {
            frost.material.dispose();
          }
        }
        this.iceFrosts.splice(i, 1);
      }
    }
    
    // Update fire burns
    for (let i = this.fireBurns.length - 1; i >= 0; i--) {
      const effect = this.fireBurns[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(elapsed / effect.duration, 1.0);
      
      // Flicker flame
      const flicker = 1 + Math.sin(elapsed * 0.01) * 0.1;
      effect.flameMesh.scaling.y = flicker;
      
      // Fade out
      const material = effect.flameMesh.material as BABYLON.StandardMaterial;
      if (material) {
        material.alpha = 0.7 * (1 - progress);
      }
      
      // Remove when complete
      if (progress >= 1.0) {
        effect.flameMesh.dispose();
        if (effect.flameMesh.material) {
          effect.flameMesh.material.dispose();
        }
        this.fireBurns.splice(i, 1);
      }
    }
    
    // Update lightning chains
    for (let i = this.lightningChains.length - 1; i >= 0; i--) {
      const effect = this.lightningChains[i];
      const elapsed = currentTime - effect.lastChainTime;
      
      // Trigger next chain
      if (elapsed >= effect.chainDelay && effect.currentChain < effect.chainPositions.length - 1) {
        effect.currentChain++;
        effect.lastChainTime = currentTime;
        
        const nextPos = effect.chainPositions[effect.currentChain];
        this.triggerLightningBolt(nextPos);
      }
      
      // Remove when all chains complete
      if (effect.currentChain >= effect.chainPositions.length - 1 && elapsed >= effect.chainDelay) {
        this.lightningChains.splice(i, 1);
      }
    }
  }

  public hasActiveEffects(): boolean {
    return this.bombExplosions.length > 0
      || this.iceFrosts.length > 0
      || this.fireBurns.length > 0
      || this.lightningChains.length > 0;
  }
  
  /**
   * Dispose all effects
   */
  public dispose(): void {
    // Dispose bomb explosions
    for (const effect of this.bombExplosions) {
      effect.shockwaveMesh.dispose();
      if (effect.shockwaveMesh.material) {
        effect.shockwaveMesh.material.dispose();
      }
    }
    this.bombExplosions = [];
    
    // Dispose ice frosts
    for (const effect of this.iceFrosts) {
      for (const frost of effect.frostMeshes) {
        frost.dispose();
        if (frost.material) {
          frost.material.dispose();
        }
      }
    }
    this.iceFrosts = [];
    
    // Dispose fire burns
    for (const effect of this.fireBurns) {
      effect.flameMesh.dispose();
      if (effect.flameMesh.material) {
        effect.flameMesh.material.dispose();
      }
    }
    this.fireBurns = [];
    
    // Clear lightning chains
    this.lightningChains = [];
  }
}
