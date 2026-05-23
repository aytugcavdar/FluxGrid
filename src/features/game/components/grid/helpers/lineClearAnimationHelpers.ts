/**
 * Line Clear Animation Update Helpers
 * Update logic for line clear animation phases with enhanced sweep effects
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';

/**
 * Update line clear animation (all phases) - OPTIMIZED FOR SPEED
 */
export function updateLineClearAnimation(
  lineClearAnimationRef: { current: any },
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  isConstrainedDevice: boolean,
  _useVisualEffectStore: any
): void {
  if (!lineClearAnimationRef.current?.active) return;
  
  const anim = lineClearAnimationRef.current;
  const elapsed = Date.now() - anim.startTime;

  if (isConstrainedDevice) {
    if (!anim.constrainedFlashApplied) {
      anim.constrainedFlashApplied = true;
      anim.clearedCells.forEach((key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh?.material) {
            const mat = mesh.material as BABYLON.StandardMaterial;
            mat.emissiveColor = BABYLON.Color3.White().scale(0.26);
            mat.alpha = 0.82;
          }
        }
      });
    }

    if (elapsed < 95) return;

    anim.clearedCells.forEach((key: string) => {
      const [x, y] = key.split(',').map(Number);
      const cell = grid[y]?.[x];
      if (cell?.id) {
        const mesh = meshMap.get(cell.id);
        if (mesh) {
          mesh.dispose();
          meshMap.delete(cell.id);
        }
      }
    });

    lineClearAnimationRef.current = null;
    return;
  }
  
  if (anim.phase === 'brightness') {
    // Stage 1: short confirmation flash before blocks disappear.
    if (elapsed < 110) {
      anim.progress = elapsed / 110;
      
      // Convert cleared cells to array and sort left-to-right for sweep effect
      const cellsArray = Array.from(anim.clearedCells as Set<string>).map((key: string) => {
        const [x, y] = key.split(',').map(Number);
        return { key, x, y };
      }).sort((a, b) => a.x - b.x);
      
      // Apply brightness sweep wave (left to right)
      cellsArray.forEach((cellData, index) => {
        const cell = grid[cellData.y]?.[cellData.x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh?.material) {
            const mat = mesh.material as BABYLON.StandardMaterial;
            const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
            
            // Calculate sweep wave progress for this cell
            const cellWaveProgress = (anim.progress * cellsArray.length - index) / cellsArray.length;
            const clampedProgress = Math.max(0, Math.min(1, cellWaveProgress));
            
            const brightness = Math.sin(clampedProgress * Math.PI);
            const white = BABYLON.Color3.White();
            const flashColor = BABYLON.Color3.Lerp(originalColor, white, 0.72);
            mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, flashColor, brightness);
            (mat as any).emissiveIntensity = 1.0 + brightness * 0.35;
            mat.alpha = 1.0;
          }
        }
      });
    } else {
      // Transition to quick fade phase.
      anim.phase = 'particles';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'particles') {
    // Stage 2: clean fade-out, no particle burst.
    if (elapsed < 90) {
      anim.progress = elapsed / 90;

      const cellsArray = Array.from(anim.clearedCells as Set<string>).map((key: string) => {
        const [x, y] = key.split(',').map(Number);
        return { key, x, y };
      }).sort((a, b) => a.x - b.x);
      
      cellsArray.forEach((cellData, index) => {
        const cell = grid[cellData.y]?.[cellData.x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh?.material) {
            const mat = mesh.material as BABYLON.StandardMaterial;
            
            // Calculate sweep fade for this cell
            const cellFadeProgress = (anim.progress * cellsArray.length - index) / cellsArray.length;
            const clampedFade = Math.max(0, Math.min(1, cellFadeProgress));
            
            const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
            mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, BABYLON.Color3.Black(), clampedFade);
            mat.alpha = 1.0 - clampedFade * 0.88;
          }
        }
      });
    } else {
      // Transition to collapse phase
      anim.phase = 'collapse';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'collapse') {
    // Stage 3: quick settle for affected blocks.
    if (elapsed < 80) {
      anim.progress = elapsed / 80;
      const easedProgress = anim.progress * (2 - anim.progress); // ease-out-quad
      
      // Animate falling blocks
      anim.affectedBlocks.forEach((data: any, key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh) {
            mesh.position.y = data.startY + (data.targetY - data.startY) * easedProgress;
          }
        }
      });
    } else {
      // Animation complete - remove cleared blocks
      anim.clearedCells.forEach((key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh) {
            mesh.dispose();
            meshMap.delete(cell.id);
          }
        }
      });
      
      lineClearAnimationRef.current = null;
    }
  }
}
