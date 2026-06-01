/**
 * Line Clear Helpers
 * Line detection and animation utilities
 */

import * as BABYLON from 'babylonjs';
import { CellType, GridState } from '../../../types';
import { LineClearAnimation } from '../types';
import { GRID_OFFSET, GRID_SIZE, TOTAL_CELL_SIZE } from '../constants';

export interface LineClearCellData {
  x: number;
  y: number;
  id?: string;
  color: string;
  cellType?: CellType;
}

export interface LineClearMovedCellData {
  id?: string;
  x: number;
  fromY: number;
  toY: number;
  cellType?: CellType;
}

const getGridPosition = (x: number, y: number): BABYLON.Vector3 => new BABYLON.Vector3(
  (x * TOTAL_CELL_SIZE) - GRID_OFFSET,
  0,
  -((y * TOTAL_CELL_SIZE) - GRID_OFFSET)
);

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
  cells?: LineClearCellData[],
  movedCells?: LineClearMovedCellData[]
): void {
  if (lineClearAnimationRef.current?.active) return; // Prevent concurrent animations

  const clearedCells = new Set<string>();
  const clearedCellIds = new Map<string, string>();
  const clearedCellData = new Map<string, { color: string; cellType?: CellType }>();
  const clearOrder = new Map<string, number>();
  const intersectionCells = new Set<string>();
  const rowSet = new Set(rows);
  const colSet = new Set(cols);

  if (cells?.length) {
    cells.forEach(cell => {
      const key = `${cell.x},${cell.y}`;
      clearedCells.add(key);
      if (cell.id) clearedCellIds.set(key, cell.id);
      clearedCellData.set(key, { color: cell.color, cellType: cell.cellType });
    });
  } else {
    rows.forEach(y => {
      for (let x = 0; x < GRID_SIZE; x++) clearedCells.add(`${x},${y}`);
    });
    cols.forEach(x => {
      for (let y = 0; y < GRID_SIZE; y++) clearedCells.add(`${x},${y}`);
    });
  }

  clearedCells.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    let order = GRID_SIZE;

    if (rowSet.has(y)) order = Math.min(order, x);
    if (colSet.has(x)) order = Math.min(order, y);
    if (order === GRID_SIZE) order = Math.min(x, y);

    clearOrder.set(key, order);
    if (rowSet.has(y) && colSet.has(x)) {
      intersectionCells.add(key);
    }
  });
  
  // Store original colors for each cleared cell
  const originalColors = new Map<string, BABYLON.Color3>();
  clearedCells.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const cell = grid[y]?.[x];
    const meshId = clearedCellIds.get(key) || cell?.id;
    if (meshId) {
      const mesh = meshMap.get(meshId);
      if (!mesh?.material) return;
      const mat = mesh.material as BABYLON.StandardMaterial;
      originalColors.set(key, mat.diffuseColor.clone());
    }
  });
  
  const affectedBlocks = new Map<string, { startPosition: BABYLON.Vector3; targetPosition: BABYLON.Vector3 }>();
  const consolidatedMoves = new Map<string, LineClearMovedCellData>();

  movedCells?.forEach(move => {
    if (!move.id) return;
    const existing = consolidatedMoves.get(move.id);
    consolidatedMoves.set(move.id, existing
      ? { ...move, fromY: existing.fromY }
      : move
    );
  });

  consolidatedMoves.forEach(move => {
    if (move.fromY === move.toY || !move.id) return;

    const mesh = meshMap.get(move.id);
    if (!mesh) return;

    const key = `${move.x},${move.toY}`;
    affectedBlocks.set(key, {
      startPosition: mesh.position.clone(),
      targetPosition: getGridPosition(move.x, move.toY),
    });
  });

  if (!movedCells?.length) {
    const clearedRowsSorted = [...rows].sort((a, b) => b - a);

    for (let x = 0; x < GRID_SIZE; x++) {
      let fallDistance = 0;
      for (let y = GRID_SIZE - 1; y >= 0; y--) {
        if (clearedRowsSorted.includes(y)) {
          fallDistance++;
        } else if (fallDistance > 0) {
          const cell = grid[y][x];
          const key = `${x},${Math.min(GRID_SIZE - 1, y + fallDistance)}`;
          const mesh = meshMap.get(cell.id || '');
          if (mesh) {
            affectedBlocks.set(key, {
              startPosition: mesh.position.clone(),
              targetPosition: getGridPosition(x, Math.min(GRID_SIZE - 1, y + fallDistance)),
            });
          }
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
    clearedCellIds,
    clearedCellData,
    clearOrder,
    clearOrderSpan: GRID_SIZE,
    intersectionCells,
    intersectionPulseMeshes: [],
    affectedBlocks,
    originalColors
  };
}
