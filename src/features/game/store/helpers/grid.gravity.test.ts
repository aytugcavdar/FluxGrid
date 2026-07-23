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

  it('reports the first ICE hit without removing the block', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[GRID_SIZE - 1][x] = {
        filled: true,
        color: '#38bdf8',
        id: `ice-row-${x}`,
        type: x === 0 ? CellType.ICE : CellType.NORMAL,
        health: x === 0 ? 2 : undefined,
      };
    }

    const result = processGrid(grid, { applyGravity: false });

    expect(result.grid[GRID_SIZE - 1][0]).toEqual(expect.objectContaining({
      id: 'ice-row-0',
      type: CellType.ICE,
      health: 1,
    }));
    expect(result.actions[0].damagedIceCells).toContainEqual(expect.objectContaining({
      id: 'ice-row-0',
      x: 0,
      y: GRID_SIZE - 1,
      health: 1,
    }));
  });

  it('reports the first FIRE hit without removing the burning block', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[GRID_SIZE - 1][x] = {
        filled: true,
        color: '#ef4444',
        id: `fire-row-${x}`,
        type: x === 0 ? CellType.FIRE : CellType.NORMAL,
        health: x === 0 ? 2 : undefined,
      };
    }

    const result = processGrid(grid, { applyGravity: false });

    expect(result.grid[GRID_SIZE - 1][0]).toEqual(expect.objectContaining({
      id: 'fire-row-0',
      type: CellType.FIRE,
      health: 1,
    }));
    expect(result.actions[0].damagedFireCells).toContainEqual(expect.objectContaining({
      id: 'fire-row-0',
      x: 0,
      y: GRID_SIZE - 1,
      health: 1,
    }));
  });

  it('reports bombs in chain order for staggered feedback', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[GRID_SIZE - 1][x] = {
        filled: true,
        color: '#f97316',
        id: `bomb-row-${x}`,
        type: x === 0 ? CellType.BOMB : CellType.NORMAL,
      };
    }
    grid[GRID_SIZE - 2][0] = {
      filled: true,
      color: '#f97316',
      id: 'chained-bomb',
      type: CellType.BOMB,
    };

    const result = processGrid(grid, { applyGravity: false });
    const bombIds = result.actions[0].bombCells.map((cell: { id?: string }) => cell.id);

    expect(bombIds).toEqual(expect.arrayContaining(['bomb-row-0', 'chained-bomb']));
    expect(result.bombsExploded).toBe(2);
  });

  it('treats VOID as a fixed blocker instead of a clearable line cell', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[GRID_SIZE - 1][x] = {
        filled: true,
        color: '#3b82f6',
        id: `row-${x}`,
        type: x === 0 ? CellType.VOID : CellType.NORMAL,
        voidTurns: x === 0 ? 2 : undefined,
      };
    }

    const result = processGrid(grid, { applyGravity: true });

    expect(result.totalLinesCleared).toBe(0);
    expect(result.grid[GRID_SIZE - 1][0]).toEqual(expect.objectContaining({
      type: CellType.VOID,
      voidTurns: 2,
    }));
  });

  it('does not remove a VOID zone hit by a bomb explosion', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[GRID_SIZE - 1][x] = {
        filled: true,
        color: '#f97316',
        id: `clear-row-${x}`,
        type: x === 0 ? CellType.BOMB : CellType.NORMAL,
      };
    }
    grid[GRID_SIZE - 2][0] = {
      filled: true,
      color: '#170d28',
      id: 'protected-void',
      type: CellType.VOID,
      voidTurns: 2,
    };

    const result = processGrid(grid, { applyGravity: false });

    expect(result.grid[GRID_SIZE - 2][0]).toEqual(expect.objectContaining({
      id: 'protected-void',
      type: CellType.VOID,
    }));
  });
});
