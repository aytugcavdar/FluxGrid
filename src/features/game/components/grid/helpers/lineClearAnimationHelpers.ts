/**
 * Line Clear Animation Update Helpers
 * Update logic for line clear animation phases with enhanced sweep effects
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';
import { GRID_SIZE, LINE_CLEAR_SWEEP } from '../constants';
import { getVectorPos } from './positionHelpers';

/**
 * Update line clear animation (all phases) - OPTIMIZED FOR SPEED
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
    // Stage 1: Brightness sweep (0-100ms) - FASTER
    if (elapsed < 100) { // Reduced from 150ms
      anim.progress = elapsed / 100;
      
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
            
            // Brightness peaks at 0.5 progress, then fades (sharper peak)
            let brightness: number;
            if (clampedProgress < 0.4) {
              brightness = clampedProgress * 2.5; // Faster rise
            } else {
              brightness = 2.5 - (clampedProgress * 2.5); // Faster fall
            }
            
            // Apply bright white flash with color tint
            const white = BABYLON.Color3.White();
            const flashColor = BABYLON.Color3.Lerp(originalColor, white, 0.7); // More white
            mat.emissiveColor = BABYLON.Color3.Lerp(originalColor, flashColor, brightness);
            (mat as any).emissiveIntensity = 1.0 + brightness * 0.5; // Extra intensity
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
    // Stage 2: Particle emission (100-200ms) - FASTER
    if (elapsed < 100) { // Reduced from 150ms
      anim.progress = elapsed / 100;
      
      // Trigger particle explosions at the start with sweep effect
      if (anim.progress < 0.15 && !isLowEndDevice) {
        const particleCount = isLowEndDevice ? 4 : 8; // More particles
        
        // Sort cells for sweep effect
        const cellsArray = Array.from(anim.clearedCells as Set<string>).map((key: string) => {
          const [x, y] = key.split(',').map(Number);
          return { key, x, y };
        }).sort((a, b) => a.x - b.x);
        
        cellsArray.forEach((cellData, index) => {
          const cell = grid[cellData.y]?.[cellData.x];
          if (cell) {
            const worldPos = getVectorPos(cellData.x, cellData.y);
            
            // Stagger particle emission for sweep effect
            const delay = index * (LINE_CLEAR_SWEEP.CHAIN_DELAY / cellsArray.length);
            
            setTimeout(() => {
              // Trigger visual effect explosion (legacy system)
              useVisualEffectStore.getState().addEffect({
                type: 'explosion',
                duration: 150, // Faster explosion
                props: {
                  x: worldPos.x,
                  y: worldPos.y,
                  color: cell.color,
                  blockSize: 32, // Larger particles
                  cellType: cell.type,
                  particleCount: particleCount
                }
              });
            }, delay);
          }
        });
      }
      
      // Fade out cleared cells with sweep
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
            
            mat.emissiveColor = BABYLON.Color3.Black();
            mat.alpha = 1.0 - clampedFade;
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
    // Stage 3: Collapse (100ms) - MUCH FASTER
    if (elapsed < 100) { // Reduced from 200ms
      anim.progress = elapsed / 100;
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
