/**
 * Placement Helpers
 * Piece placement animation utilities with enhanced impact effects
 */

import * as BABYLON from 'babylonjs';
import { PlacementAnimation } from '../types';
import { applySpringCurve } from './animationHelpers';
import { PLACEMENT_ANIMATION_DURATION, PLACEMENT_IMPACT } from '../constants';

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
  const ANIMATION_DURATION = PLACEMENT_ANIMATION_DURATION; // Use constant (150ms)
  const EMISSIVE_DURATION = 300; // 300ms emissive glow
  const springCurve: [number, number, number] = prefersReducedMotion ? [1.0, 1.05, 1.0] : [1.0, 1.2, 1.0]; // More bounce
  
  let allComplete = true;
  
  anim.cellAnimations.forEach((cellAnim, cellId) => {
    const mesh = meshMap.get(cellId);
    if (!mesh) return;
    
    const elapsed = currentTime - cellAnim.startTime;
    
    // Scale animation (150ms - faster)
    if (elapsed < ANIMATION_DURATION) {
      allComplete = false;
      const progress = elapsed / ANIMATION_DURATION;
      const scale = applySpringCurve(progress, springCurve);
      mesh.scaling = cellAnim.originalScale.scale(scale);
    } else {
      // Ensure final scale is restored
      mesh.scaling = cellAnim.originalScale;
    }
    
    // Emissive glow animation (300ms) - brighter initial glow
    if (elapsed < EMISSIVE_DURATION && mesh.material) {
      allComplete = false;
      const mat = mesh.material as BABYLON.StandardMaterial;
      const progress = elapsed / EMISSIVE_DURATION;
      const intensity = 1.0 - progress; // Fade from 1.0 to 0.0
      
      // Apply enhanced emissive color with stronger initial glow
      const enhancedEmissive = cellAnim.originalEmissive.scale(1.0 + intensity * 3.5); // Increased from 2.0 to 3.5
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
 * Enhanced with impact effects based on drop height and combo
 */
export function animatePlacement(
  cellIds: string[],
  meshMap: Map<string, BABYLON.Mesh>,
  placementAnimationRef: { current: PlacementAnimation | null },
  disableAnimations: boolean,
  prefersReducedMotion: boolean,
  dropHeight?: number,
  combo?: number
): void {
  if (disableAnimations && !prefersReducedMotion) {
    // Skip animation completely if animations are disabled and not reduced motion
    return;
  }
  
  const currentTime = Date.now();
  const STAGGER_DELAY = 10; // Reduced from 15ms to 10ms for faster feel
  
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
  
  // TODO: Add particle burst effect based on dropHeight and combo
  // This will be implemented in the particle system enhancement
}
