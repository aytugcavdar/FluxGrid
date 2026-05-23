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
      this.resetMeshVisualState(mesh, colorHex, type, health);
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
    
    this.resetMeshVisualState(mesh, colorHex, type, health);

    // Hide mesh
    mesh.isVisible = false;
    mesh.getChildMeshes().forEach(child => {
      child.isVisible = false;
    });
    
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

  /**
   * Pooled meshes may have been faded, flashed, or outlined by animations.
   * Restore the base appearance before they are reused by a board cell.
   */
  private resetMeshVisualState(
    mesh: BABYLON.Mesh,
    colorHex: string,
    type: CellType,
    health: number | undefined
  ): void {
    mesh.visibility = 1;
    mesh.getChildMeshes().forEach(child => {
      child.isVisible = true;
      child.visibility = 1;
    });

    const mat = mesh.material as BABYLON.StandardMaterial | null;
    if (!mat) {
      return;
    }

    mat.wireframe = false;
    mat.specularColor = BABYLON.Color3.Black();
    mat.specularPower = 0;

    if (type === CellType.ICE) {
      if (health === 1) {
        mat.diffuseColor = BABYLON.Color3.FromHexString("#bfdbfe");
        mat.emissiveColor = BABYLON.Color3.FromHexString("#60a5fa").scale(0.1);
        mat.alpha = 0.8;
        mesh.enableEdgesRendering();
        mesh.edgesWidth = 3.5;
        mesh.edgesColor = new BABYLON.Color4(0.9, 0.6, 0.2, 0.9);
      } else {
        mat.diffuseColor = BABYLON.Color3.FromHexString("#7dd3fc");
        mat.emissiveColor = BABYLON.Color3.FromHexString("#38bdf8").scale(0.15);
        mat.alpha = 0.85;
        mesh.enableEdgesRendering();
        mesh.edgesWidth = 2.5;
        mesh.edgesColor = new BABYLON.Color4(0.7, 0.92, 1.0, 0.85);
      }
      return;
    }

    if (type === CellType.BOMB) {
      mat.diffuseColor = BABYLON.Color3.FromHexString("#1c1917");
      mat.emissiveColor = BABYLON.Color3.FromHexString("#f59e0b").scale(0.3);
      mat.alpha = 1;
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4;
      mesh.edgesColor = new BABYLON.Color4(1, 0.6, 0, 1);
      return;
    }

    const col = BABYLON.Color3.FromHexString(colorHex);
    mat.diffuseColor = col;
    mat.emissiveColor = col.scale(0.06);
    mat.alpha = 0.95;
    mesh.enableEdgesRendering();
    mesh.edgesWidth = 1.5;
    mesh.edgesColor = new BABYLON.Color4(1, 1, 1, 0.12);
  }
}
