/**
 * Tests for game helper functions
 */

import { describe, it, expect } from 'vitest';
import { calculateGridClearPercentage, clearBottomRows, clearTopRows, createContinueGrid } from './gameHelpers';
import { GridState, GRID_SIZE, CellType } from '../features/game/types';

describe('gameHelpers', () => {
  describe('calculateGridClearPercentage', () => {
    it('should return 0 for empty grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: false,
          color: '',
          type: CellType.NORMAL
        }))
      );

      expect(calculateGridClearPercentage(grid)).toBe(0);
    });

    it('should return 100 for full grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: true,
          color: '#ff0000',
          type: CellType.NORMAL
        }))
      );

      expect(calculateGridClearPercentage(grid)).toBe(100);
    });

    it('should return 50 for half-filled grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map((_, y) =>
        Array(GRID_SIZE).fill(null).map((_, x) => ({
          filled: y < 5, // Fill top half
          color: y < 5 ? '#ff0000' : '',
          type: CellType.NORMAL
        }))
      );

      expect(calculateGridClearPercentage(grid)).toBe(50);
    });

    it('should return 20 for grid with 20 filled cells', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map((_, y) =>
        Array(GRID_SIZE).fill(null).map((_, x) => ({
          filled: y < 2, // Fill top 2 rows (20 cells)
          color: y < 2 ? '#ff0000' : '',
          type: CellType.NORMAL
        }))
      );

      expect(calculateGridClearPercentage(grid)).toBe(20);
    });
  });

  describe('clearBottomRows', () => {
    it('should clear bottom 2 rows and apply gravity', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: true,
          color: '#ff0000',
          type: CellType.NORMAL
        }))
      );

      const result = clearBottomRows(grid);

      // After clearing bottom 2 rows and applying gravity:
      // - 8 rows of blocks remain (rows 0-7 originally)
      // - They should drop to fill rows 2-9
      // - Rows 0-1 should be empty
      
      // Check top 2 rows are empty
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe(false);
          expect(result[y][x].color).toBe('');
        }
      }

      // Check rows 2-9 are filled (8 rows dropped down)
      for (let y = 2; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe(true);
          expect(result[y][x].color).toBe('#ff0000');
        }
      }
    });

    it('should not modify original grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: true,
          color: '#ff0000',
          type: CellType.NORMAL
        }))
      );

      const originalBottomCell = grid[9][0];
      clearBottomRows(grid);

      // Original grid should be unchanged
      expect(grid[9][0]).toBe(originalBottomCell);
      expect(grid[9][0].filled).toBe(true);
    });

    it('should apply gravity correctly with partially filled grid', () => {
      // Create a grid with blocks in specific positions
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: false,
          color: '',
          type: CellType.NORMAL
        }))
      );

      // Place some blocks in column 0: rows 2, 5, 8, 9
      grid[2][0] = { filled: true, color: '#ff0000', type: CellType.NORMAL };
      grid[5][0] = { filled: true, color: '#00ff00', type: CellType.NORMAL };
      grid[8][0] = { filled: true, color: '#0000ff', type: CellType.NORMAL };
      grid[9][0] = { filled: true, color: '#ffff00', type: CellType.NORMAL };

      const result = clearBottomRows(grid);

      // After clearing bottom 2 rows (8, 9) and applying gravity:
      // - Blocks from rows 2 and 5 remain (rows 8 and 9 are cleared)
      // - filledCells array will be: [#ff0000 (row 2), #00ff00 (row 5)]
      // - Gravity places them from bottom up in reverse order:
      //   - Row 9 (bottom) gets filledCells[1] = #00ff00 (from row 5)
      //   - Row 8 gets filledCells[0] = #ff0000 (from row 2)
      expect(result[9][0].filled).toBe(true);
      expect(result[9][0].color).toBe('#00ff00'); // Block from row 5 (last in array, goes to bottom)
      expect(result[8][0].filled).toBe(true);
      expect(result[8][0].color).toBe('#ff0000'); // Block from row 2 (first in array, goes above)

      // Rows 0-7 should be empty in column 0
      for (let y = 0; y < 8; y++) {
        expect(result[y][0].filled).toBe(false);
      }
    });

    it('should handle empty columns correctly', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: false,
          color: '',
          type: CellType.NORMAL
        }))
      );

      // Only fill bottom 2 rows
      for (let x = 0; x < GRID_SIZE; x++) {
        grid[8][x] = { filled: true, color: '#ff0000', type: CellType.NORMAL };
        grid[9][x] = { filled: true, color: '#00ff00', type: CellType.NORMAL };
      }

      const result = clearBottomRows(grid);

      // All cells should be empty after clearing bottom 2 rows
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          expect(result[y][x].filled).toBe(false);
        }
      }
    });
  });

  describe('clearTopRows', () => {
    it('should clear top 2 rows', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: true,
          color: '#ff0000',
          type: CellType.NORMAL
        }))
      );

      const result = clearTopRows(grid);

      // Check top 2 rows are cleared
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe(false);
          expect(result[y][x].color).toBe('');
        }
      }

      // Check other rows are unchanged
      for (let y = 2; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe(true);
          expect(result[y][x].color).toBe('#ff0000');
        }
      }
    });

    it('should not modify original grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({
          filled: true,
          color: '#ff0000',
          type: CellType.NORMAL
        }))
      );

      const originalTopCell = grid[0][0];
      clearTopRows(grid);

      // Original grid should be unchanged
      expect(grid[0][0]).toBe(originalTopCell);
      expect(grid[0][0].filled).toBe(true);
    });

    it('should work with partially filled grid', () => {
      const grid: GridState = Array(GRID_SIZE).fill(null).map((_, y) =>
        Array(GRID_SIZE).fill(null).map((_, x) => ({
          filled: (y + x) % 2 === 0,
          color: (y + x) % 2 === 0 ? '#ff0000' : '',
          type: CellType.NORMAL
        }))
      );

      const result = clearTopRows(grid);

      // Check top 2 rows are cleared
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe(false);
        }
      }

      // Check other rows maintain their pattern
      for (let y = 2; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          expect(result[y][x].filled).toBe((y + x) % 2 === 0);
        }
      }
    });
  });

  describe('createContinueGrid', () => {
    it('should create completely empty grid', () => {
      const result = createContinueGrid();

      // Check all cells are empty
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          expect(result[y][x].filled).toBe(false);
          expect(result[y][x].color).toBe('');
          expect(result[y][x].type).toBe(CellType.NORMAL);
        }
      }
    });

    it('should create grid with correct dimensions', () => {
      const result = createContinueGrid();

      expect(result.length).toBe(GRID_SIZE);
      expect(result[0].length).toBe(GRID_SIZE);
    });

    it('should create new grid instance each time', () => {
      const grid1 = createContinueGrid();
      const grid2 = createContinueGrid();

      // Should be different instances
      expect(grid1).not.toBe(grid2);
      expect(grid1[0]).not.toBe(grid2[0]);
      expect(grid1[0][0]).not.toBe(grid2[0][0]);
    });
  });
});
