/**
 * TrailMeshManager
 * 
 * Manages trail effects for falling pieces using Babylon.js TrailMesh.
 * Limits concurrent trails to 3 for performance.
 */

import * as BABYLON from 'babylonjs';
import { TrailConfig, TrailInstance, ANIMATION_CONFIG } from './config/animation.config';

export class TrailMeshManager {
  private scene: BABYLON.Scene;
  private trails: Map<string, TrailInstance> = new Map();
  private maxTrails: number = 3;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * Create a new trail for a piece
   * @param pieceId Unique identifier for the piece
   * @param generator The mesh to generate trail from
   * @param config Trail configuration
   * @returns Trail instance or null if max trails reached
   */
  createTrail(
    pieceId: string,
    generator: BABYLON.Mesh,
    config: TrailConfig
  ): TrailInstance | null {
    // Limit concurrent trails to 3
    if (this.trails.size >= this.maxTrails) {
      // Remove oldest trail
      const oldestKey = this.trails.keys().next().value;
      this.disposeTrail(oldestKey);
    }

    // Create trail mesh
    const trail = new BABYLON.TrailMesh(
      `trail_${pieceId}`,
      generator,
      this.scene,
      config.width,
      config.segmentCount,
      true // autoStart
    );

    // Set rendering group for proper render order (after opaque, before transparent UI)
    trail.renderingGroupId = 1;

    // Create material with emissive glow
    const material = new BABYLON.StandardMaterial(`trail_mat_${pieceId}`, this.scene);
    material.emissiveColor = new BABYLON.Color3(config.color.r, config.color.g, config.color.b);
    material.diffuseColor = new BABYLON.Color3(config.color.r, config.color.g, config.color.b);
    material.alpha = config.alpha;
    material.backFaceCulling = false;

    // Apply emissive intensity
    material.emissiveColor.scaleInPlace(config.emissiveIntensity);

    trail.material = material;

    // Create trail instance
    const trailInstance: TrailInstance = {
      mesh: trail,
      generator,
      config,
      isActive: true,
      positions: [],
    };

    this.trails.set(pieceId, trailInstance);
    return trailInstance;
  }

  /**
   * Update trail vertex buffer (shift segments and add new position)
   * @param pieceId Unique identifier for the piece
   */
  updateTrail(pieceId: string): void {
    const trailInstance = this.trails.get(pieceId);
    if (!trailInstance || !trailInstance.isActive) return;

    const trail = trailInstance.mesh as BABYLON.TrailMesh;
    const generator = trailInstance.generator as BABYLON.Mesh;

    // Store current position
    const currentPos = generator.position.clone();
    trailInstance.positions.push({
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z,
    });

    // Limit position history to segment count
    if (trailInstance.positions.length > trailInstance.config.segmentCount) {
      trailInstance.positions.shift();
    }

    // Apply width taper toward trail end
    // TrailMesh handles this automatically through its diameter parameter
    // We just need to ensure the trail is updating
  }

  /**
   * Dispose a specific trail
   * @param pieceId Unique identifier for the piece
   */
  disposeTrail(pieceId: string): void {
    const trailInstance = this.trails.get(pieceId);
    if (!trailInstance) return;

    trailInstance.isActive = false;

    // Dispose trail mesh and material
    if (trailInstance.mesh) {
      const trail = trailInstance.mesh as BABYLON.TrailMesh;
      if (trail.material) {
        trail.material.dispose();
      }
      trail.dispose();
    }

    this.trails.delete(pieceId);
  }

  /**
   * Dispose all trails (used when entering performance mode)
   */
  disposeAll(): void {
    const pieceIds = Array.from(this.trails.keys());
    pieceIds.forEach(id => this.disposeTrail(id));
  }

  /**
   * Get active trail count
   */
  getActiveTrailCount(): number {
    return this.trails.size;
  }

  /**
   * Check if a piece has an active trail
   */
  hasTrail(pieceId: string): boolean {
    return this.trails.has(pieceId);
  }
}
