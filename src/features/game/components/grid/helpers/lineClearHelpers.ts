/**
 * Line Clear Helpers
 * Line detection and animation utilities
 */

import * as BABYLON from 'babylonjs';
import { GridState } from '../../../types';
import { LineClearAnimation } from '../types';
import { GRID_SIZE, TOTAL_CELL_SIZE } from '../constants';

/**
 * Detect full rows and columns for line clear animation
 */
export function detectLineClear(grid: GridState): { rows: number[]; cols: number[] } {
  const fullRows: number[] = [];
  const fullCols: number[] = [];
  
  // Check rows
  for (let y = 0; y < GRID_SIZE; y++) {
    if (grid[y].every(cell => cell.filled)) fullRows.push(y);
  }
  
  // Check columns
  for (let x = 0; x < GRID_SIZE; x++) {
    let isFull = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[y][x].filled) {
        isFull = false;
        break;
      }
    }
    if (isFull) fullCols.push(x);
  }
  
  return { rows: fullRows, cols: fullCols };
}

/**
 * Start line clear animation
 */
export function startLineClearAnimation(
  rows: number[],
  cols: number[],
  grid: GridState,
  meshMap: Map<string, BABYLON.Mesh>,
  lineClearAnimationRef: { current: LineClearAnimation | null },
  triggerCameraShakeFn: (lineCount: number) => void
): void {
  if (lineClearAnimationRef.current?.active) return; // Prevent concurrent animations
  
  // Trigger camera shake based on line count
  const totalLines = rows.length + cols.length;
  triggerCameraShakeFn(totalLines);
  
  const clearedCells = new Set<string>();
  rows.forEach(y => {
    for (let x = 0; x < GRID_SIZE; x++) clearedCells.add(`${x},${y}`);
  });
  cols.forEach(x => {
    for (let y = 0; y < GRID_SIZE; y++) clearedCells.add(`${x},${y}`);
  });
  
  // Store original colors for each cleared cell
  const originalColors = new Map<string, BABYLON.Color3>();
  clearedCells.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const cell = grid[y]?.[x];
    if (cell?.id) {
      const mesh = meshMap.get(cell.id);
      if (mesh?.material) {
        const mat = mesh.material as BABYLON.StandardMaterial;
        originalColors.set(key, mat.diffuseColor.clone());
      }
    }
  });
  
  // Calculate affected blocks (blocks above cleared rows)
  const affectedBlocks = new Map<string, { startY: number; targetY: number }>();
  const clearedRowsSorted = [...rows].sort((a, b) => b - a); // Sort descending
  
  for (let x = 0; x < GRID_SIZE; x++) {
    let fallDistance = 0;
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      if (clearedRowsSorted.includes(y)) {
        fallDistance++;
      } else if (fallDistance > 0) {
        const key = `${x},${y}`;
        const mesh = meshMap.get(grid[y][x].id || '');
        if (mesh) {
          affectedBlocks.set(key, {
            startY: mesh.position.y,
            targetY: mesh.position.y - (fallDistance * TOTAL_CELL_SIZE)
          });
        }
      }
    }
  }
  
  lineClearAnimationRef.current = {
    active: true,
    phase: 'brightness',
    progress: 0,
    startTime: Date.now(),
    clearedCells,
    affectedBlocks,
    originalColors
  };
}
