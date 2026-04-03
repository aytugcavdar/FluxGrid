/**
 * Game Over Helpers
 * Game over animation utilities
 */

import * as BABYLON from 'babylonjs';
import { GameOverAnimation } from '../types';

/**
 * Start game over animation
 */
export function startGameOverAnimation(
  meshMap: Map<string, BABYLON.Mesh>,
  gameOverAnimationRef: { current: GameOverAnimation | null }
): void {
  if (gameOverAnimationRef.current?.active) return;
  
  // Collect all block IDs
  const allBlockIds: string[] = [];
  meshMap.forEach((mesh, id) => {
    allBlockIds.push(id);
  });
  
  gameOverAnimationRef.current = {
    active: true,
    phase: 'shake',
    progress: 0,
    startTime: Date.now(),
    cellAnimations: new Map()
  };
}

/**
 * Update game over animation in render loop
 */
export function updateGameOverAnimation(
  gameOverAnimationRef: { current: GameOverAnimation | null },
  meshMap: Map<string, BABYLON.Mesh>,
  gridBaseRef: { current: BABYLON.Mesh | null },
  gridSlotsRef: BABYLON.Mesh[],
  shakeIntensityRef: { current: number }
): void {
  if (!gameOverAnimationRef.current?.active) return;
  
  const anim = gameOverAnimationRef.current;
  const elapsed = Date.now() - anim.startTime;
  
  if (anim.phase === 'shake') {
    // Shake phase: 300ms
    if (elapsed < 300) {
      anim.progress = elapsed / 300;
      shakeIntensityRef.current = 0.5 * (1 - anim.progress); // Decay shake
    } else {
      // Transition to collapse phase
      anim.phase = 'collapse';
      anim.startTime = Date.now();
      anim.progress = 0;
      shakeIntensityRef.current = 0;
    }
  } else if (anim.phase === 'collapse') {
    // Collapse phase: 800ms
    if (elapsed < 800) {
      anim.progress = elapsed / 800;
      
      // Animate all blocks falling, fading, and rotating
      meshMap.forEach((mesh) => {
        // Fall down
        mesh.position.y -= 0.015; // Constant fall rate
        
        // Fade out
        if (mesh.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          mat.alpha = 1.0 - anim.progress;
        }
        
        // Random rotation
        mesh.rotation.y += 0.05 * (Math.random() - 0.5);
      });
    } else {
      // Transition to fade phase
      anim.phase = 'fade';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'fade') {
    // Fade phase: 300ms
    if (elapsed < 300) {
      anim.progress = elapsed / 300;
      
      // Fade grid base
      if (gridBaseRef.current?.material) {
        const mat = gridBaseRef.current.material as BABYLON.StandardMaterial;
        mat.alpha = 1.0 - anim.progress;
      }
      
      // Fade grid slots
      gridSlotsRef.forEach(slot => {
        if (slot.material) {
          const mat = slot.material as BABYLON.StandardMaterial;
          mat.alpha = 0.92 * (1.0 - anim.progress);
        }
      });
    } else {
      // Animation complete
      gameOverAnimationRef.current = null;
    }
  }
}
