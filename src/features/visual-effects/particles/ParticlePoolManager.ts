import * as BABYLON from 'babylonjs';

/**
 * ParticlePoolManager - Manages particle object pools for efficient rendering
 * 
 * Requirements: 1.2, 4.1-4.6, 7.2
 * 
 * Particle Types:
 * - impact: Placement impact particles (30 pool size)
 * - lineClear: Line clear particles (60 pool size)
 * - confetti: Perfect clear confetti (100 pool size)
 * - trail: Combo chain trails (25 pool size)
 */

export type ParticleType = 'impact' | 'lineClear' | 'confetti' | 'trail';

export interface ActiveParticle {
  mesh: BABYLON.Mesh;
  velocity: BABYLON.Vector3;
  lifetime: number;
  startTime: number;
  color: BABYLON.Color3;
  applyGravity: boolean;
  gravityDelay: number;
  isActive: boolean;
}

export interface ParticlePool {
  impactPool: ActiveParticle[];
  lineClearPool: ActiveParticle[];
  confettiPool: ActiveParticle[];
  trailPool: ActiveParticle[];
}

export interface ParticlePoolConfig {
  scene: BABYLON.Scene;
  qualityMultiplier: number; // 1.0, 0.6, 0.4
}

export class ParticlePoolManager {
  private scene: BABYLON.Scene;
  private qualityMultiplier: number;
  private qualityPreset: 'high' | 'medium' | 'low';
  private pools: ParticlePool;
  private gravity: number = 800; // pixels/second²
  
  constructor(config: ParticlePoolConfig) {
    this.scene = config.scene;
    this.qualityMultiplier = config.qualityMultiplier;
    
    // Set initial quality preset based on multiplier
    if (config.qualityMultiplier >= 1.0) {
      this.qualityPreset = 'high';
    } else if (config.qualityMultiplier >= 0.6) {
      this.qualityPreset = 'medium';
    } else {
      this.qualityPreset = 'low';
    }
    
    // Initialize pools
    this.pools = {
      impactPool: [],
      lineClearPool: [],
      confettiPool: [],
      trailPool: []
    };
    
    this.initializePools();
  }
  
  /**
   * Initialize all particle pools
   */
  private initializePools(): void {
    // Impact particles (30 * quality multiplier)
    const impactCount = Math.floor(30 * this.qualityMultiplier);
    for (let i = 0; i < impactCount; i++) {
      this.pools.impactPool.push(this.createParticle('impact'));
    }
    
    // Line clear particles (60 * quality multiplier)
    const lineClearCount = Math.floor(60 * this.qualityMultiplier);
    for (let i = 0; i < lineClearCount; i++) {
      this.pools.lineClearPool.push(this.createParticle('lineClear'));
    }
    
    // Confetti particles (100 * quality multiplier)
    const confettiCount = Math.floor(100 * this.qualityMultiplier);
    for (let i = 0; i < confettiCount; i++) {
      this.pools.confettiPool.push(this.createParticle('confetti'));
    }
    
    // Trail particles (25 * quality multiplier)
    const trailCount = Math.floor(25 * this.qualityMultiplier);
    for (let i = 0; i < trailCount; i++) {
      this.pools.trailPool.push(this.createParticle('trail'));
    }
  }
  
  /**
   * Create a single particle mesh
   */
  private createParticle(type: ParticleType): ActiveParticle {
    // Create small box mesh for particle
    const mesh = BABYLON.MeshBuilder.CreateBox(
      `particle-${type}-${Date.now()}-${Math.random()}`,
      { size: 0.1 },
      this.scene
    );
    
    // Create material
    const material = new BABYLON.StandardMaterial(
      `particle-mat-${type}-${Date.now()}`,
      this.scene
    );
    material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    material.disableLighting = true;
    mesh.material = material;
    
    // Initially hide
    mesh.isVisible = false;
    mesh.position = new BABYLON.Vector3(0, -100, 0); // Off-screen
    
    return {
      mesh,
      velocity: BABYLON.Vector3.Zero(),
      lifetime: 0,
      startTime: 0,
      color: new BABYLON.Color3(1, 1, 1),
      applyGravity: false,
      gravityDelay: 0,
      isActive: false
    };
  }
  
  /**
   * Acquire a particle from the pool
   * Requirements: 1.2, 4.1, 7.2
   */
  acquire(type: ParticleType): ActiveParticle | null {
    const pool = this.getPool(type);
    
    // Find inactive particle
    const particle = pool.find(p => !p.isActive);
    
    if (!particle) {
      console.warn(`[ParticlePool] ${type} pool exhausted`);
      
      // Fallback: reuse oldest particle
      const oldest = this.findOldestParticle(type);
      if (oldest) {
        this.recycleParticle(oldest);
        return oldest;
      }
      
      return null;
    }
    
    // Activate particle
    particle.isActive = true;
    particle.mesh.isVisible = true;
    particle.startTime = Date.now();
    
    return particle;
  }
  
  /**
   * Recycle a particle back to the pool
   */
  recycleParticle(particle: ActiveParticle): void {
    particle.isActive = false;
    particle.mesh.isVisible = false;
    particle.mesh.position.set(0, -100, 0); // Off-screen
    particle.velocity.set(0, 0, 0);
  }
  
  /**
   * Find oldest active particle of given type
   */
  private findOldestParticle(type: ParticleType): ActiveParticle | null {
    const pool = this.getPool(type);
    const activeParticles = pool.filter(p => p.isActive);
    
    if (activeParticles.length === 0) return null;
    
    return activeParticles.reduce((oldest, current) => 
      current.startTime < oldest.startTime ? current : oldest
    );
  }
  
  /**
   * Get pool by type
   */
  private getPool(type: ParticleType): ActiveParticle[] {
    switch (type) {
      case 'impact':
        return this.pools.impactPool;
      case 'lineClear':
        return this.pools.lineClearPool;
      case 'confetti':
        return this.pools.confettiPool;
      case 'trail':
        return this.pools.trailPool;
    }
  }
  
  /**
   * Update all active particles
   * Requirements: 4.3, 4.6
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();
    const deltaSeconds = deltaTime / 1000;
    
    // Update all pools
    Object.values(this.pools).forEach(pool => {
      pool.forEach(particle => {
        if (!particle.isActive) return;
        
        const elapsed = currentTime - particle.startTime;
        
        // Check lifetime
        if (elapsed >= particle.lifetime) {
          this.recycleParticle(particle);
          return;
        }
        
        // Apply velocity
        particle.mesh.position.addInPlace(
          particle.velocity.scale(deltaSeconds)
        );
        
        // Apply gravity after delay
        if (particle.applyGravity && elapsed >= particle.gravityDelay) {
          particle.velocity.y -= this.gravity * deltaSeconds;
        }
        
        // Fade out near end of lifetime
        const lifetimeProgress = elapsed / particle.lifetime;
        if (lifetimeProgress > 0.8) {
          const fadeProgress = (lifetimeProgress - 0.8) / 0.2;
          const alpha = 1 - fadeProgress;
          
          const material = particle.mesh.material as BABYLON.StandardMaterial;
          if (material) {
            material.alpha = alpha;
          }
        }
      });
    });
  }
  
  /**
   * Get active particle count for a type
   */
  getActiveCount(type: ParticleType): number {
    const pool = this.getPool(type);
    return pool.filter(p => p.isActive).length;
  }
  
  /**
   * Get available particle count for a type
   */
  getAvailableCount(type: ParticleType): number {
    const pool = this.getPool(type);
    return pool.filter(p => !p.isActive).length;
  }
  
  /**
   * Set quality multiplier and resize pools
   * Requirements: 13.4, 14.2
   */
  setMultiplier(multiplier: number): void {
    this.qualityMultiplier = multiplier;
    // Note: Pool resizing would require recreation, 
    // for now we just adjust future acquisitions
  }
  
  /**
   * Reduce all particle counts by percentage
   * Requirements: 13.4
   */
  reduceAllCounts(percentage: number): void {
    // Recycle particles to meet reduction target
    Object.values(this.pools).forEach(pool => {
      const activeParticles = pool.filter(p => p.isActive);
      const targetCount = Math.floor(activeParticles.length * (1 - percentage));
      const toRecycle = activeParticles.length - targetCount;
      
      for (let i = 0; i < toRecycle; i++) {
        const oldest = activeParticles[i];
        if (oldest) {
          this.recycleParticle(oldest);
        }
      }
    });
  }
  
  /**
   * Clear all particles
   */
  clearAll(): void {
    Object.values(this.pools).forEach(pool => {
      pool.forEach(particle => this.recycleParticle(particle));
    });
  }
  
  /**
   * Reinitialize pools (for context restoration)
   */
  reinitialize(scene: BABYLON.Scene): void {
    this.scene = scene;
    
    // Dispose old meshes
    Object.values(this.pools).forEach(pool => {
      pool.forEach(particle => {
        particle.mesh.dispose();
      });
    });
    
    // Reinitialize
    this.pools = {
      impactPool: [],
      lineClearPool: [],
      confettiPool: [],
      trailPool: []
    };
    
    this.initializePools();
  }
  
  /**
   * Set quality preset and update particle multipliers
   * Requirements: 13.4
   */
  setQualityPreset(preset: 'high' | 'medium' | 'low'): void {
    this.qualityPreset = preset;
    
    // Update quality multiplier based on preset
    const multipliers = {
      high: 1.0,
      medium: 0.6,
      low: 0.4
    };
    
    this.qualityMultiplier = multipliers[preset];
    
    console.log(`[ParticlePoolManager] Quality preset changed to ${preset}, multiplier: ${this.qualityMultiplier}`);
  }
  
  /**
   * Dispose all particles
   */
  dispose(): void {
    Object.values(this.pools).forEach(pool => {
      pool.forEach(particle => {
        particle.mesh.dispose();
      });
    });
    
    this.pools = {
      impactPool: [],
      lineClearPool: [],
      confettiPool: [],
      trailPool: []
    };
  }
}
