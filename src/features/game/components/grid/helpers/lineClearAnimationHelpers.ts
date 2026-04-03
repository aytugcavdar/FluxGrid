/**
 * Line Clear Animation Update Helpers
 * Update logic for line clear animation phases
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';
import { GRID_SIZE } from '../constants';
import { getVectorPos } from './positionHelpers';

/**
 * Update line clear animation (all phases)
 */
export function updateLineClearAnimation(
  lineClearAnimationRef: { current: any },
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  isLowEndDevice: boolean,
  useVisualEffectStore: any
): void {
  if (!lineClearAnimationRef.current?.active) return;
  
  const anim = lineClearAnimationRef.current;
  const elapsed = Date.now() - anim.startTime;
  
  if (anim.phase === 'brightness') {
    // Stage 1: Brightness wave (0-150ms)
    if (elapsed < 150) {
      anim.progress = elapsed / 150;
      
      // Convert cleared cells to array and sort left-to-right
      const cellsArray = Array.from(anim.clearedCells).map((key) => {
        const [x, y] = key.split(',').map(Number);
        return { key, x, y };
      }).sort((a, b) => a.x - b.x);
      
      // Apply brightness wave
      cellsArray.forEach((cellData, index) => {
        const cell = grid[cellData.y]?.[cellData.x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh?.material) {
            const mat = mesh.material as BABYLON.StandardMaterial;
            const originalColor = anim.originalColors.get(cellData.key) || mat.diffuseColor;
            
            // Calculate wave progress for this cell
            const cellWaveProgress = (anim.progress * cellsArray.length - index) / cellsArray.length;
            const clampedProgress = Math.max(0, Math.min(1, cellWaveProgress));
            
            // Brightness peaks at 0.5 progress, then fades
            let brightness: number;
            if (clampedProgress < 0.5) {
              brightness = clampedProgress * 2;
            } else {
              brightness = 2 - (clampedProgress * 2);
            }
            
            // Apply white brightness overlay
            const white = BABYLON.Color3.White();
            mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, white, brightness * 0.8);
            (mat as any).emissiveIntensity = 1.0;
          }
        }
      });
    } else {
      // Transition to particles phase
      anim.phase = 'particles';
      anim.startTime = Date.now();
      anim.progress = 0;
    }
  } else if (anim.phase === 'particles') {
    // Stage 2: Particle emission (150-300ms)
    if (elapsed < 150) {
      anim.progress = elapsed / 150;
      
      // Trigger particle explosions at the start
      if (anim.progress < 0.1 && !isLowEndDevice) {
        const particleCount = isLowEndDevice ? 3 : 6;
        
        anim.clearedCells.forEach((key: string) => {
          const [x, y] = key.split(',').map(Number);
          const cell = grid[y]?.[x];
          if (cell) {
            const worldPos = getVectorPos(x, y);
            
            // Trigger visual effect explosion
            useVisualEffectStore.getState().addEffect({
              type: 'explosion',
              duration: 180,
              props: {
                x: worldPos.x,
                y: worldPos.y,
                color: cell.color,
                blockSize: 28,
                cellType: cell.type,
                particleCount: particleCount
              }
            });
          }
        });
      }
      
      // Fade out cleared cells
      anim.clearedCells.forEach((key: string) => {
        const [x, y] = key.split(',').map(Number);
        const cell = grid[y]?.[x];
        if (cell?.id) {
          const mesh = meshMap.get(cell.id);
          if (mesh?.material) {
            const mat = mesh.material as BABYLON.StandardMaterial;
            mat.emissiveColor = BABYLON.Color3.Black();
            mat.alpha = 1.0 - anim.progress;
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
    // Stage 3: Collapse (200ms)
    if (elapsed < 200) {
      anim.progress = elapsed / 200;
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
