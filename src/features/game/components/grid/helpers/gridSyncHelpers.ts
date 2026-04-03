/**
 * Grid Sync Helpers
 * Functions for synchronizing grid state with 3D meshes
 */

import React from 'react';
import * as BABYLON from 'babylonjs';
import { GridState, CellType } from '../../../types';
import { GRID_SIZE, TOTAL_CELL_SIZE } from '../constants';

const GRID_OFFSET = (GRID_SIZE - 1) * TOTAL_CELL_SIZE / 2;

/**
 * Get 3D position from grid coordinates
 */
const getVectorPos = (gx: number, gy: number): BABYLON.Vector3 => {
  return new BABYLON.Vector3(
    (gx * TOTAL_CELL_SIZE) - GRID_OFFSET,
    0,
    -((gy * TOTAL_CELL_SIZE) - GRID_OFFSET)
  );
};

export interface LineClearAnimationState {
  active: boolean;
  phase: 'brightness' | 'particles' | 'collapse';
  progress: number;
  startTime: number;
  clearedCells: Set<string>;
  affectedBlocks: Map<string, { startY: number; targetY: number }>;
  originalColors: Map<string, BABYLON.Color3>;
}

/**
 * Sync grid state with 3D meshes
 */
export const syncGridMeshes = (
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  createBlockMesh: (color: string, id: string, type: CellType, health?: number) => BABYLON.Mesh,
  lineClearAnimationRef: React.MutableRefObject<LineClearAnimationState | null>,
  shouldUpdateAnimations: boolean,
  time: number,
  activeSkill: any
): string[] => {
  const activeIds = new Set<string>();
  const newlyCreatedIds: string[] = [];

  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.filled && cell.id) {
        activeIds.add(cell.id);
        const targetPos = getVectorPos(x, y);
        let mesh = meshMap.get(cell.id);
        
        if (!mesh) {
          mesh = createBlockMesh(cell.color, cell.id, cell.type || CellType.NORMAL, cell.health);
          mesh.position = targetPos.clone();
          mesh.position.y = 12; // Drop from higher
          meshMap.set(cell.id, mesh);
          newlyCreatedIds.push(cell.id);
        }

        mesh.isVisible = true;

        // Update material if health changed (for ICE)
        if (cell.type === CellType.ICE && cell.health === 1 && mesh.material) {
          const mat = mesh.material as BABYLON.StandardMaterial;
          if (!mat.wireframe) {
            mat.alpha = 0.6;
            mat.wireframe = true;
          }
        }

        // Smooth landing (skip if being animated by line clear)
        const cellKey = `${x},${y}`;
        const isBeingAnimated = lineClearAnimationRef.current?.clearedCells.has(cellKey) ||
          lineClearAnimationRef.current?.affectedBlocks.has(cellKey);

        if (!isBeingAnimated) {
          mesh.position = BABYLON.Vector3.Lerp(mesh.position, targetPos, 0.25);
        }

        // Skip emissive animations for blocks being cleared
        const isBeingCleared = lineClearAnimationRef.current?.clearedCells.has(cellKey);

        if (shouldUpdateAnimations && !isBeingCleared) {
          // Bomb block animation
          if (cell.type === CellType.BOMB && mesh.material) {
            const bombPulse = 0.3 + Math.abs(Math.sin(time * 2)) * 0.2;
            (mesh.material as BABYLON.StandardMaterial).emissiveColor =
              BABYLON.Color3.FromHexString("#f59e0b").scale(bombPulse);
          }
          // Ice block animation
          else if (cell.type === CellType.ICE && mesh.material) {
            const icePulse = 0.15 + Math.abs(Math.sin(time * 1)) * 0.15;
            const iceColor = cell.health === 1
              ? BABYLON.Color3.FromHexString("#60a5fa")
              : BABYLON.Color3.FromHexString("#38bdf8");
            (mesh.material as BABYLON.StandardMaterial).emissiveColor = iceColor.scale(icePulse + 0.1);
          }
          // CHRONO block animation
          else if (cell.type === CellType.CHRONO && mesh.material) {
            const chronoPulse = 0.15 + Math.abs(Math.sin(time * 2.5)) * 0.25;
            (mesh.material as BABYLON.StandardMaterial).emissiveColor =
              BABYLON.Color3.FromHexString("#f59e0b").scale(chronoPulse);
          }
          // SHATTER skill: Show pulse on ALL filled cells
          else if (cell.type === CellType.NORMAL && activeSkill === 'SHATTER' && cell.filled) {
            const pulseAlpha = 0.15 + Math.abs(Math.sin(time * 3)) * 0.10;
            (mesh.material as BABYLON.StandardMaterial).emissiveColor =
              BABYLON.Color3.FromHexString("#ef4444").scale(pulseAlpha);
          }
        }
      }
    });
  });

  // Cleanup inactive meshes
  for (const [id, mesh] of meshMap.entries()) {
    if (!activeIds.has(id)) {
      mesh.scaling.scaleInPlace(0.7);
      mesh.rotation.y += 0.3;
      if (mesh.scaling.x < 0.05) {
        mesh.dispose();
        meshMap.delete(id);
      }
    }
  }

  return newlyCreatedIds;
};
