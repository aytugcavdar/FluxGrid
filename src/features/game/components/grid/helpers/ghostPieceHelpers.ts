/**
 * Ghost Piece Helpers
 * Functions for rendering ghost piece preview in render loop
 */

import * as BABYLON from 'babylonjs';
import { GRID_SIZE, TOTAL_CELL_SIZE, GHOST_POOL_SIZE } from '../constants';
import { Piece } from '../../../types';
import { GridState } from '../../../types';

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

/**
 * Render ghost piece preview in render loop
 */
export const renderGhostPiece = (
  ghostMeshes: BABYLON.Mesh[],
  draggedPiece: Piece | null,
  hoverCoord: { x: number; y: number } | null,
  grid: GridState,
  canPlacePiece: (grid: GridState, piece: Piece, x: number, y: number) => boolean,
  time: number
): void => {
  // Hide all ghosts first
  ghostMeshes.forEach(m => { m.isVisible = false; });

  if (!draggedPiece || !hoverCoord) return;

  const isValid = canPlacePiece(grid, draggedPiece, hoverCoord.x, hoverCoord.y);
  const baseColor = isValid
    ? BABYLON.Color3.FromHexString(draggedPiece.color)
    : BABYLON.Color3.FromHexString("#ef4444");

  // Pulse factor for ghost breathing effect
  const ghostY = 0.35 + Math.sin(time * 3) * 0.04;

  let ghostIndex = 0;
  draggedPiece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val === 1 && ghostIndex < GHOST_POOL_SIZE) {
        const gx = hoverCoord.x + dx;
        const gy = hoverCoord.y + dy;

        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          const ghostBox = ghostMeshes[ghostIndex++];
          ghostBox.position = getVectorPos(gx, gy);
          ghostBox.position.y = ghostY;

          const mat = ghostBox.material as BABYLON.StandardMaterial;
          mat.diffuseColor = baseColor;
          mat.emissiveColor = baseColor.scale(0.2);
          mat.alpha = isValid ? 0.6 : 0.3;

          ghostBox.enableEdgesRendering();
          ghostBox.edgesWidth = isValid ? 4.0 : 2.5;
          ghostBox.edgesColor = isValid
            ? new BABYLON.Color4(baseColor.r, baseColor.g, baseColor.b, 0.9)
            : new BABYLON.Color4(1, 0.3, 0.3, 0.7);

          ghostBox.isVisible = true;
        }
      }
    });
  });
};
