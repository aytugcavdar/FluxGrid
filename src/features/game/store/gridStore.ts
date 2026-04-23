/**
 * Grid Store
 * 
 * Manages grid state and grid operations
 * Part of the gameStore split refactoring
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Piece, GRID_SIZE, CellType } from '../types';
import { createEmptyGrid, processGrid } from './helpers/grid';

export interface GridStore {
  // State
  grid: GridState;
  
  // Actions
  updateCell: (x: number, y: number, filled: boolean, color?: string, type?: CellType, health?: number) => void;
  clearCell: (x: number, y: number) => void;
  clearLine: (lineIndex: number, isRow: boolean) => void;
  resetGrid: () => void;
  canPlacePiece: (piece: Piece, startX: number, startY: number) => boolean;
  getCompletedLines: () => { rows: number[]; cols: number[] };
  getCellAt: (x: number, y: number) => GridState[0][0] | null;
  setGrid: (grid: GridState) => void;
  processGridChanges: () => ReturnType<typeof processGrid>;
}

export const useGridStore = create<GridStore>((set, get) => ({
  // Initial state
  grid: createEmptyGrid(),
  
  /**
   * Update a specific cell in the grid
   */
  updateCell: (x, y, filled, color = '', type = CellType.NORMAL, health) => {
    const grid = get().grid;
    
    // Validate bounds
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      console.error(`[GridStore] Invalid cell coordinates: (${x}, ${y})`);
      return;
    }
    
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === y && colIndex === x) {
          return {
            ...cell,
            filled,
            color: filled ? color : '',
            id: filled ? (cell.id || uuidv4()) : '',
            type: filled ? type : CellType.NORMAL,
            health: filled ? health : undefined,
          };
        }
        return cell;
      })
    );
    
    set({ grid: newGrid });
  },
  
  /**
   * Clear a specific cell
   */
  clearCell: (x, y) => {
    get().updateCell(x, y, false);
  },
  
  /**
   * Clear an entire line (row or column)
   */
  clearLine: (lineIndex, isRow) => {
    const grid = get().grid;
    
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const shouldClear = isRow ? rowIndex === lineIndex : colIndex === lineIndex;
        
        if (shouldClear) {
          return {
            ...cell,
            filled: false,
            color: '',
            id: '',
            type: CellType.NORMAL,
            health: undefined,
          };
        }
        return cell;
      })
    );
    
    set({ grid: newGrid });
  },
  
  /**
   * Reset grid to empty state
   */
  resetGrid: () => {
    set({ grid: createEmptyGrid() });
  },
  
  /**
   * Check if a piece can be placed at the given position
   */
  canPlacePiece: (piece, startX, startY) => {
    const grid = get().grid;
    
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col] === 1) {
          const gridY = startY + row;
          const gridX = startX + col;

          // Out of bounds
          if (gridY < 0 || gridY >= GRID_SIZE || gridX < 0 || gridX >= GRID_SIZE) {
            return false;
          }
          
          // Collision
          if (grid[gridY][gridX].filled) {
            return false;
          }
        }
      }
    }
    
    return true;
  },
  
  /**
   * Get completed lines (rows and columns)
   */
  getCompletedLines: () => {
    const grid = get().grid;
    const completedRows: number[] = [];
    const completedCols: number[] = [];
    
    // Check rows
    for (let y = 0; y < GRID_SIZE; y++) {
      if (grid[y].every(cell => cell.filled)) {
        completedRows.push(y);
      }
    }
    
    // Check columns
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid.every(row => row[x].filled)) {
        completedCols.push(x);
      }
    }
    
    return { rows: completedRows, cols: completedCols };
  },
  
  /**
   * Get cell at specific coordinates
   */
  getCellAt: (x, y) => {
    const grid = get().grid;
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      return null;
    }
    
    return grid[y][x];
  },
  
  /**
   * Set entire grid (for loading saved games)
   */
  setGrid: (grid) => {
    set({ grid });
  },
  
  /**
   * Process grid changes (line clears, bombs, etc.)
   */
  processGridChanges: () => {
    const grid = get().grid;
    const result = processGrid(grid);
    
    // Update grid with processed result
    set({ grid: result.grid });
    
    return result;
  },
}));
