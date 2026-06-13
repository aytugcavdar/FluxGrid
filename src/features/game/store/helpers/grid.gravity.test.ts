import { describe, expect, it } from 'vitest';
import { CellType, GRID_SIZE } from '../../types';
import { createEmptyGrid, processGrid } from './grid';

const createGravityScenario = () => {
  const grid = createEmptyGrid();

  for (let x = 0; x < GRID_SIZE; x++) {
    grid[GRID_SIZE - 1][x] = {
      filled: true,
      color: '#3b82f6',
      id: `bottom-${x}`,
      type: CellType.NORMAL,
    };
  }

  grid[0][0] = {
    filled: true,
    color: '#f472b6',
    id: 'floating-block',
    type: CellType.NORMAL,
  };

  return grid;
};

describe('processGrid gravity options', () => {
  it('drops remaining blocks after a clear when gravity is enabled', () => {
    const result = processGrid(createGravityScenario(), { applyGravity: true });

    expect(result.grid[GRID_SIZE - 1][0].id).toBe('floating-block');
    expect(result.grid[0][0].filled).toBe(false);
    expect(result.actions[0].movedCells).toContainEqual(expect.objectContaining({
      id: 'floating-block',
      fromY: 0,
      toY: GRID_SIZE - 1,
    }));
  });

  it('keeps remaining blocks fixed after a clear when gravity is disabled', () => {
    const result = processGrid(createGravityScenario(), { applyGravity: false });

    expect(result.grid[0][0].id).toBe('floating-block');
    expect(result.grid[GRID_SIZE - 1][0].filled).toBe(false);
    expect(result.actions[0].movedCells).toHaveLength(0);
  });
});
