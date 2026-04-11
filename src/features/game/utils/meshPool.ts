/**
 * Babylon.js Mesh Object Pool
 * 
 * Manages a pool of Babylon.js mesh objects to minimize garbage collection
 * and improve rendering performance.
 * Requirements: 5.6
 */

import * as BABYLON from 'babylonjs';

export interface MeshPoolConfig {
  scene: BABYLON.Scene;
  meshName: string;
  meshFactory: (scene: BABYLON.Scene, index: number) => BABYLON.Mesh;
  initialSize?: number;
  maxSize?: number;
}

export class MeshPool {
  private scene: BABYLON.Scene;
  private meshName: string;
  private meshFactory: (scene: BABYLON.Scene, index: number) => BABYLON.Mesh;
  private pool: BABYLON.Mesh[] = [];
  private active: Set<BABYLON.Mesh> = new Set();
  private readonly maxSize: number;
  private createdCount: number = 0;
  
  constructor(config: MeshPoolConfig) {
    this.scene = config.scene;
    this.meshName = config.meshName;
    this.meshFactory = config.meshFactory;
    this.maxSize = config.maxSize || 100;
    
    // Pre-allocate initial pool
    const initialSize = config.initialSize || 20;
    for (let i = 0; i < initialSize; i++) {
      const mesh = this.createMesh();
      mesh.setEnabled(false);
      this.pool.push(mesh);
    }
  }
  
  /**
   * Create a new mesh using the factory
   */
  private createMesh(): BABYLON.Mesh {
    const mesh = this.meshFactory(this.scene, this.createdCount++);
    mesh.name = `${this.meshName}_${this.createdCount}`;
    return mesh;
  }
  
  /**
   * Acquire a mesh from the pool
   * @returns Mesh from pool or newly created mesh
   */
  acquire(): BABYLON.Mesh {
    let mesh: BABYLON.Mesh;
    
    // Try to reuse from pool
    if (this.pool.length > 0) {
      mesh = this.pool.pop()!;
    } else {
      // Pool exhausted
      if (this.active.size < this.maxSize) {
        // Create new mesh
        mesh = this.createMesh();
      } else {
        // Max size reached, force reuse oldest
        console.warn(`[MeshPool:${this.meshName}] Max size reached, forcing reuse`);
        const oldest = Array.from(this.active)[0];
        this.release(oldest);
        mesh = this.pool.pop()!;
      }
    }
    
    // Activate mesh
    mesh.setEnabled(true);
    this.active.add(mesh);
    
    return mesh;
  }
  
  /**
   * Release a mesh back to the pool
   * @param mesh Mesh to release
   */
  release(mesh: BABYLON.Mesh): void {
    if (!this.active.has(mesh)) {
      console.warn(`[MeshPool:${this.meshName}] Attempting to release inactive mesh`);
      return;
    }
    
    // Deactivate mesh
    mesh.setEnabled(false);
    mesh.position.set(0, -100, 0); // Move off-screen
    
    // Reset material alpha if modified
    if (mesh.material) {
      const mat = mesh.material as BABYLON.StandardMaterial;
      if (mat.alpha !== undefined) {
        mat.alpha = 1.0;
      }
    }
    
    // Remove from active set
    this.active.delete(mesh);
    
    // Return to pool if not at max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(mesh);
    } else {
      // Pool full, dispose mesh
      mesh.dispose();
    }
  }
  
  /**
   * Release multiple meshes
   * @param meshes Array of meshes to release
   */
  releaseAll(meshes: BABYLON.Mesh[]): void {
    meshes.forEach(mesh => this.release(mesh));
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.active.size,
      maxSize: this.maxSize,
      totalCreated: this.createdCount,
      utilizationPercent: (this.active.size / this.maxSize) * 100,
    };
  }
  
  /**
   * Clear and dispose all meshes
   */
  dispose(): void {
    // Dispose pool meshes
    this.pool.forEach(mesh => mesh.dispose());
    this.pool = [];
    
    // Dispose active meshes
    this.active.forEach(mesh => mesh.dispose());
    this.active.clear();
    
    this.createdCount = 0;
  }
  
  /**
   * Resize the pool
   * @param newSize New maximum size
   */
  resize(newSize: number): void {
    this.maxSize = newSize;
    
    // Shrink pool if needed
    while (this.pool.length > newSize) {
      const mesh = this.pool.pop();
      if (mesh) {
        mesh.dispose();
      }
    }
  }
}

/**
 * Mesh Pool Manager - Manages multiple mesh pools
 */
export class MeshPoolManager {
  private pools: Map<string, MeshPool> = new Map();
  
  /**
   * Create or get a mesh pool
   * @param name Pool name
   * @param config Pool configuration
   * @returns Mesh pool
   */
  getOrCreatePool(name: string, config: MeshPoolConfig): MeshPool {
    if (!this.pools.has(name)) {
      this.pools.set(name, new MeshPool(config));
    }
    return this.pools.get(name)!;
  }
  
  /**
   * Get a pool by name
   * @param name Pool name
   * @returns Mesh pool or undefined
   */
  getPool(name: string): MeshPool | undefined {
    return this.pools.get(name);
  }
  
  /**
   * Get statistics for all pools
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStats();
    });
    return stats;
  }
  
  /**
   * Dispose all pools
   */
  disposeAll(): void {
    this.pools.forEach(pool => pool.dispose());
    this.pools.clear();
  }
}

// Global mesh pool manager instance
let globalMeshPoolManager: MeshPoolManager | null = null;

/**
 * Get or create the global mesh pool manager
 */
export function getMeshPoolManager(): MeshPoolManager {
  if (!globalMeshPoolManager) {
    globalMeshPoolManager = new MeshPoolManager();
  }
  return globalMeshPoolManager;
}

/**
 * Reset the global mesh pool manager
 */
export function resetMeshPoolManager(): void {
  if (globalMeshPoolManager) {
    globalMeshPoolManager.disposeAll();
  }
  globalMeshPoolManager = null;
}
