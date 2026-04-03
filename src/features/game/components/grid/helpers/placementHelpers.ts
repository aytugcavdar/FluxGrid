/**
 * Placement Helpers
 * Piece placement animation utilities
 */

import * as BABYLON from 'babylonjs';
import { PlacementAnimation } from '../types';
import { applySpringCurve } from './animationHelpers';

/**
 * Update placement animations in the render loop
 */
export function updatePlacementAnimations(
  currentTime: number,
  placementAnimationRef: { current: PlacementAnimation | null },
  meshMap: Map<string, BABYLON.Mesh>,
  prefersReducedMotion: boolean
): void {
  if (!placementAnimationRef.current?.active) return;
  
  const anim = placementAnimationRef.current;
  const ANIMATION_DURATION = 80; // 80ms total animation
  const EMISSIVE_DURATION = 300; // 300ms emissive glow
  const springCurve: [number, number, number] = prefersReducedMotion ? [1.0, 1.05, 1.0] : [1.0, 1.15, 1.0];
  
  let allComplete = true;
  
  anim.cellAnimations.forEach((cellAnim, cellId) => {
    const mesh = meshMap.get(cellId);
    if (!mesh) return;
    
    const elapsed = currentTime - cellAnim.startTime;
    
    // Scale animation (80ms)
    if (elapsed < ANIMATION_DURATION) {
      allComplete = false;
      const progress = elapsed / ANIMATION_DURATION;
      const scale = applySpringCurve(progress, springCurve);
      mesh.scaling = cellAnim.originalScale.scale(scale);
    } else {
      // Ensure final scale is restored
      mesh.scaling = cellAnim.originalScale;
    }
    
    // Emissive glow animation (300ms)
    if (elapsed < EMISSIVE_DURATION && mesh.material) {
      allComplete = false;
      const mat = mesh.material as BABYLON.StandardMaterial;
      const progress = elapsed / EMISSIVE_DURATION;
      const intensity = 1.0 - progress; // Fade from 1.0 to 0.0
      
      // Apply enhanced emissive color
      const enhancedEmissive = cellAnim.originalEmissive.scale(1.0 + intensity * 2.0);
      mat.emissiveColor = enhancedEmissive;
    } else if (mesh.material) {
      // Restore original emissive
      const mat = mesh.material as BABYLON.StandardMaterial;
      mat.emissiveColor = cellAnim.originalEmissive;
    }
  });
  
  // Clean up animation state when all animations complete
  if (allComplete) {
    placementAnimationRef.current = null;
  }
}

/**
 * Animate placement of cells with spring curve and stagger timing
 */
export function animatePlacement(
  cellIds: string[],
  meshMap: Map<string, BABYLON.Mesh>,
  placementAnimationRef: { current: PlacementAnimation | null },
  disableAnimations: boolean,
  prefersReducedMotion: boolean
): void {
  if (disableAnimations && !prefersReducedMotion) {
    // Skip animation completely if animations are disabled and not reduced motion
    return;
  }
  
  const currentTime = Date.now();
  const STAGGER_DELAY = 15; // 15ms per cell
  
  const cellAnimations = new Map<string, {
    cellId: string;
    startTime: number;
    originalScale: BABYLON.Vector3;
    originalEmissive: BABYLON.Color3;
  }>();
  
  cellIds.forEach((cellId, index) => {
    const mesh = meshMap.get(cellId);
    if (!mesh) return;
    
    const staggerDelay = index * STAGGER_DELAY;
    
    cellAnimations.set(cellId, {
      cellId,
      startTime: currentTime + staggerDelay,
      originalScale: new BABYLON.Vector3(1, 1, 1),
      originalEmissive: mesh.material 
        ? (mesh.material as BABYLON.StandardMaterial).emissiveColor.clone()
        : BABYLON.Color3.Black()
    });
  });
  
  placementAnimationRef.current = {
    active: true,
    startTime: currentTime,
    cellAnimations
  };
}
