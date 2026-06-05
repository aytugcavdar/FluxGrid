/**
 * Game helper functions for monetization system
 */

import { GridState, GRID_SIZE, CellType, GridCell } from '../../types';

/**
 * Calculate the percentage of grid cells that are filled
 * @param grid - The current grid state
 * @returns Percentage of filled cells (0-100)
 */
export function calculateGridClearPercentage(grid: GridState): number {
  const totalCells = GRID_SIZE * GRID_SIZE;
  let filledCells = 0;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].filled) {
        filledCells++;
      }
    }
  }

  return Math.round((filledCells / totalCells) * 100);
}

/**
 * Clear the bottom 2 rows of the grid (rows 8-9 in a 10x10 grid)
 * and apply gravity to drop remaining blocks
 * @param grid - The current grid state
 * @returns New grid with bottom 2 rows cleared and gravity applied
 */
export function clearBottomRows(grid: GridState): GridState {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const rowsToClear = 2;

  // Clear bottom 2 rows (rows 8 and 9)
  for (let y = GRID_SIZE - rowsToClear; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      newGrid[y][x] = {
        filled: false,
        color: '',
        type: CellType.NORMAL
      };
    }
  }

  // Apply gravity to all columns
  for (let x = 0; x < GRID_SIZE; x++) {
    // Collect all filled cells in this column from top to bottom
    const filledCells: GridCell[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      if (newGrid[y][x].filled) {
        filledCells.push({ ...newGrid[y][x] });
      }
    }
    
    // Clear the column
    for (let y = 0; y < GRID_SIZE; y++) {
      newGrid[y][x] = {
        filled: false,
        color: '',
        type: CellType.NORMAL
      };
    }
    
    // Place filled cells from bottom up (gravity effect)
    for (let i = 0; i < filledCells.length; i++) {
      const targetY = GRID_SIZE - 1 - i; // Start from bottom
      newGrid[targetY][x] = filledCells[filledCells.length - 1 - i]; // Place in reverse order
    }
  }

  return newGrid;
}

/**
 * Clear the top 2 rows of the grid (rows 0-1 in a 10x10 grid)
 * @param grid - The current grid state
 * @returns New grid with top 2 rows cleared
 */
export function clearTopRows(grid: GridState): GridState {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  
  // Clear top 2 rows (rows 0 and 1)
  for (let x = 0; x < GRID_SIZE; x++) {
    newGrid[0][x] = { filled: false, color: '', type: CellType.NORMAL };
    newGrid[1][x] = { filled: false, color: '', type: CellType.NORMAL };
  }
  
  return newGrid;
}

const EMPTY_CELL: GridCell = {
  filled: false,
  color: '',
  type: CellType.NORMAL
};

function emptyCell(): GridCell {
  return { ...EMPTY_CELL };
}

function createEmptyContinueGrid(): GridState {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill(null).map(() => emptyCell())
  );
}

/**
 * Create a rescue grid for rewarded continue.
 * Keeps most of the board intact, but opens enough space to make the revive fair.
 */
export function createContinueGrid(grid?: GridState): GridState {
  if (!grid) return createEmptyContinueGrid();

  const rescueGrid: GridState = grid.map(row => row.map(cell => ({ ...cell, isClearing: false })));

  const rowScores = rescueGrid.map((row, y) => ({
    y,
    filled: row.filter(cell => cell.filled).length,
  }));
  const colScores = Array.from({ length: GRID_SIZE }, (_, x) => ({
    x,
    filled: rescueGrid.reduce((count, row) => count + (row[x].filled ? 1 : 0), 0),
  }));

  const rowsToClear = new Set(
    rowScores
      .sort((a, b) => b.filled - a.filled || b.y - a.y)
      .slice(0, 2)
      .map(row => row.y)
  );
  const colsToClear = new Set(
    colScores
      .sort((a, b) => b.filled - a.filled || Math.abs(a.x - 4.5) - Math.abs(b.x - 4.5))
      .slice(0, 2)
      .map(col => col.x)
  );

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const inCenterRescueZone = x >= 3 && x <= 6 && y >= 3 && y <= 6;
      if (rowsToClear.has(y) || colsToClear.has(x) || inCenterRescueZone) {
        rescueGrid[y][x] = emptyCell();
      }
    }
  }

  return rescueGrid;
}
