/**
 * Babylon.js Optimizer
 * 
 * Manages mesh quality, texture quality, shadows, glow, and particles
 */

import type { QualityPreset } from '../types';

interface MeshQualityConfig {
  subdivisions: number;
  simplificationRatio: number;
}

interface TextureQualityConfig {
  maxSize: number;
}

const MESH_QUALITY_CONFIGS: Record<string, MeshQualityConfig> = {
  low: { subdivisions: 100, simplificationRatio: 0.5 },
  medium: { subdivisions: 250, simplificationRatio: 0.75 },
  high: { subdivisions: 500, simplificationRatio: 1.0 }
};

const TEXTURE_QUALITY_CONFIGS: Record<string, TextureQualityConfig> = {
  low: { maxSize: 512 },
  medium: { maxSize: 1024 },
  high: { maxSize: 2048 }
};

export class BabylonOptimizer {
  private scene: any | null;
  private shadowGenerators: any[];
  private glowLayer: any | null;
  private currentMeshQuality: string;
  private currentTextureQuality: string;
  
  constructor() {
    this.scene = null;
    this.shadowGenerators = [];
    this.glowLayer = null;
    this.currentMeshQuality = 'medium';
    this.currentTextureQuality = 'medium';
  }
  
  /**
   * Initialize with Babylon.js scene
   */
  initialize(scene: any): void {
    this.scene = scene;
    console.log('[BabylonOptimizer] Initialized');
  }
  
  /**
   * Apply quality preset to all Babylon.js systems
   */
  applyQualityPreset(preset: QualityPreset): void {
    if (!this.scene) {
      console.warn('[BabylonOptimizer] Scene not initialized');
      return;
    }
    
    // Determine quality level from preset
    const qualityLevel = preset.liteMode ? 'low' : 
                        preset.meshQuality === 'high' ? 'high' : 
                        preset.meshQuality === 'low' ? 'low' : 'medium';
    
    this.applyMeshQuality(qualityLevel);
    this.applyTextureQuality(qualityLevel);
    this.applyShadowSettings(preset.shadows);
    this.applyGlowSettings(preset.glow, qualityLevel);
    
    // Convert particles string to boolean and quality
    const particlesEnabled = preset.particles !== 'off';
    this.applyParticleSettings(particlesEnabled, qualityLevel);
    
    console.log(`[BabylonOptimizer] Applied ${preset.name} preset`);
  }
  
  /**
   * Apply mesh quality (LOD levels)
   */
  applyMeshQuality(quality: string): void {
    if (!this.scene) return;
    
    const config = MESH_QUALITY_CONFIGS[quality] || MESH_QUALITY_CONFIGS.medium;
    
    // Get all meshes in scene
    const meshes = this.scene.meshes || [];
    
    for (const mesh of meshes) {
      if (!mesh || !mesh.name) continue;
      
      // Skip UI meshes and special meshes
      if (mesh.name.includes('UI') || mesh.name.includes('HUD')) continue;
      
      // Store old mesh for disposal
      const oldMesh = mesh.clone ? mesh.clone() : null;
      
      // Apply LOD based on quality
      if (mesh.material) {
        mesh.material.wireframe = false;
      }
      
      // Adjust mesh detail level
      if (mesh.subdivisions !== undefined) {
        mesh.subdivisions = config.subdivisions;
      }
      
      // Dispose old mesh after new one is ready
      if (oldMesh && oldMesh !== mesh) {
        setTimeout(() => {
          this.disposeMesh(oldMesh);
        }, 100); // Wait for new mesh to be ready
      }
    }
    
    this.currentMeshQuality = quality;
    console.log(`[BabylonOptimizer] Mesh quality set to ${quality}`);
  }
  
  /**
   * Dispose a mesh and its resources
   */
  private disposeMesh(mesh: any): void {
    if (!mesh) return;
    
    try {
      // Dispose material
      if (mesh.material) {
        mesh.material.dispose();
      }
      
      // Dispose textures
      if (mesh.material && mesh.material.albedoTexture) {
        mesh.material.albedoTexture.dispose();
      }
      
      // Dispose mesh
      if (mesh.dispose) {
        mesh.dispose();
      }
      
      console.log('[BabylonOptimizer] Mesh disposed');
    } catch (error) {
      console.error('[BabylonOptimizer] Error disposing mesh:', error);
    }
  }
  
  /**
   * Apply texture quality
   */
  applyTextureQuality(quality: string): void {
    if (!this.scene) return;
    
    const config = TEXTURE_QUALITY_CONFIGS[quality] || TEXTURE_QUALITY_CONFIGS.medium;
    
    // Get all textures in scene
    const textures = this.scene.textures || [];
    
    for (const texture of textures) {
      if (!texture) continue;
      
      // Scale texture to max size
      if (texture.getSize) {
        const size = texture.getSize();
        if (size.width > config.maxSize || size.height > config.maxSize) {
          texture.scale(config.maxSize / Math.max(size.width, size.height));
        }
      }
    }
    
    this.currentTextureQuality = quality;
    console.log(`[BabylonOptimizer] Texture quality set to ${quality} (max ${config.maxSize}px)`);
  }
  
  /**
   * Apply shadow settings
   */
  applyShadowSettings(enabled: boolean): void {
    if (!this.scene) return;
    
    if (enabled) {
      // Enable shadows if they were disabled
      for (const generator of this.shadowGenerators) {
        if (generator && generator.getShadowMap) {
          generator.getShadowMap().refreshRate = 1;
        }
      }
    } else {
      // Disable all shadow generators
      for (const generator of this.shadowGenerators) {
        if (generator && generator.dispose) {
          generator.dispose();
        }
      }
      this.shadowGenerators = [];
    }
    
    console.log(`[BabylonOptimizer] Shadows ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Apply glow settings
   */
  applyGlowSettings(enabled: boolean, quality: string): void {
    if (!this.scene) return;
    
    if (enabled) {
      // Create or update glow layer
      if (!this.glowLayer) {
        // Import GlowLayer dynamically to avoid circular dependencies
        try {
          const BABYLON = (window as any).BABYLON;
          if (BABYLON && BABYLON.GlowLayer) {
            this.glowLayer = new BABYLON.GlowLayer('glow', this.scene);
          }
        } catch (error) {
          console.warn('[BabylonOptimizer] Failed to create glow layer:', error);
          return;
        }
      }
      
      // Adjust glow resolution based on quality
      if (this.glowLayer) {
        const resolution = quality === 'high' ? 512 : quality === 'medium' ? 256 : 128;
        this.glowLayer.blurKernelSize = resolution / 16;
      }
    } else {
      // Dispose glow layer
      if (this.glowLayer) {
        this.glowLayer.dispose();
        this.glowLayer = null;
      }
    }
    
    console.log(`[BabylonOptimizer] Glow ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Apply particle settings
   */
  applyParticleSettings(enabled: boolean, quality: string): void {
    if (!this.scene) return;
    
    // Get all particle systems in scene
    const particleSystems = this.scene.particleSystems || [];
    
    if (enabled) {
      // Set particle count based on quality
      const maxParticles = quality === 'high' ? 20 : quality === 'medium' ? 10 : 5;
      
      for (const system of particleSystems) {
        if (system && system.getCapacity) {
          const currentCapacity = system.getCapacity();
          if (currentCapacity > maxParticles) {
            system.updateFunction = (particles: any[]) => {
              // Limit active particles
              return particles.slice(0, maxParticles);
            };
          }
        }
      }
      
      console.log(`[BabylonOptimizer] Particles enabled (max ${maxParticles})`);
    } else {
      // Stop all particle systems
      for (const system of particleSystems) {
        if (system && system.stop) {
          system.stop();
        }
      }
      
      console.log('[BabylonOptimizer] Particles disabled');
    }
  }
  
  /**
   * Register shadow generator
   */
  registerShadowGenerator(generator: any): void {
    this.shadowGenerators.push(generator);
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    // Dispose shadow generators
    for (const generator of this.shadowGenerators) {
      if (generator && generator.dispose) {
        generator.dispose();
      }
    }
    this.shadowGenerators = [];
    
    // Dispose glow layer
    if (this.glowLayer) {
      this.glowLayer.dispose();
      this.glowLayer = null;
    }
    
    this.scene = null;
    console.log('[BabylonOptimizer] Disposed');
  }
}

// Singleton instance
export const babylonOptimizer = new BabylonOptimizer();
