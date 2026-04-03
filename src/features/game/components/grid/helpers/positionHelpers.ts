/**
 * Position Helpers
 * Grid coordinate and position calculations
 */

import * as BABYLON from 'babylonjs';
import { TOTAL_CELL_SIZE, GRID_OFFSET } from '../constants';

/**
 * Convert grid coordinates to 3D world position
 */
export function getVectorPos(x: number, y: number): BABYLON.Vector3 {
  return new BABYLON.Vector3(
    (x * TOTAL_CELL_SIZE) - GRID_OFFSET,
    0,
    -((y * TOTAL_CELL_SIZE) - GRID_OFFSET)
  );
}

/**
 * Get cell ID from grid coordinates
 */
export function getCellId(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Parse cell ID to coordinates
 */
export function parseCellId(cellId: string): { x: number; y: number } {
  const [x, y] = cellId.split(',').map(Number);
  return { x, y };
}

/**
 * Check if coordinates are within grid bounds
 */
export function isValidCoord(x: number, y: number, gridSize: number): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}
