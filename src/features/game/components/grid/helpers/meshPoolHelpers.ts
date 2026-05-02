/**
 * Mesh Pooling Helpers
 * Reuses meshes instead of creating/disposing them constantly
 * Reduces GC pressure and improves performance
 */

import * as BABYLON from 'babylonjs';
import { CellType } from '../../../types';

/**
 * Mesh pool for reusing block meshes
 */
export class MeshPool {
  private pool: Map<string, BABYLON.Mesh[]> = new Map();
  private maxPoolSize: number;
  
  constructor(maxPoolSize: number = 50) {
    this.maxPoolSize = maxPoolSize;
  }
  
  /**
   * Get a mesh from pool or create new one
   */
  getMesh(
    colorHex: string,
    type: CellType,
    health: number | undefined,
    createFn: () => BABYLON.Mesh
  ): BABYLON.Mesh {
    const key = this.getKey(colorHex, type, health);
    const poolArray = this.pool.get(key);
    
    // Try to get from pool
    if (poolArray && poolArray.length > 0) {
      const mesh = poolArray.pop()!;
      mesh.isVisible = true;
      return mesh;
    }
    
    // Pool empty, create new mesh
    return createFn();
  }
  
  /**
   * Return a mesh to the pool
   */
  returnMesh(
    mesh: BABYLON.Mesh,
    colorHex: string,
    type: CellType,
    health: number | undefined
  ): void {
    const key = this.getKey(colorHex, type, health);
    
    // Hide mesh
    mesh.isVisible = false;
    
    // Reset transform
    mesh.position.set(0, -100, 0); // Move far away
    mesh.rotation.set(0, 0, 0);
    mesh.scaling.set(1, 1, 1);
    
    // Get or create pool array
    if (!this.pool.has(key)) {
      this.pool.set(key, []);
    }
    
    const poolArray = this.pool.get(key)!;
    
    // Add to pool if not full
    if (poolArray.length < this.maxPoolSize) {
      poolArray.push(mesh);
    } else {
      // Pool full, dispose mesh
      mesh.dispose();
    }
  }
  
  /**
   * Dispose all pooled meshes
   */
  dispose(): void {
    this.pool.forEach(poolArray => {
      poolArray.forEach(mesh => mesh.dispose());
    });
    this.pool.clear();
  }
  
  /**
   * Get pool statistics
   */
  getStats(): { totalPooled: number; poolsByType: Map<string, number> } {
    let total = 0;
    const byType = new Map<string, number>();
    
    this.pool.forEach((poolArray, key) => {
      total += poolArray.length;
      byType.set(key, poolArray.length);
    });
    
    return { totalPooled: total, poolsByType: byType };
  }
  
  /**
   * Generate unique key for mesh type
   */
  private getKey(colorHex: string, type: CellType, health: number | undefined): string {
    return `${colorHex}-${type}-${health || 0}`;
  }
}
