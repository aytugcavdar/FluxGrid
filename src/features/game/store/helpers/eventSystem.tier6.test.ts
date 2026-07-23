import { describe, expect, it, vi } from 'vitest';
import { GameMode } from '@shared/types';
import { CellType, GRID_SIZE } from '../../types';
import { createEmptyGrid } from './grid';
import {
  applyTier2FireSpreadPlan,
  applyTier2FireSpreadPlans,
  checkTierEvent,
  createTier2FireSpreadPlan,
  createTier2FireSpreadPlans,
  ensureLateGameFireMinimumWithFeedback,
  extinguishTier2Fire,
  getFireSpreadPendingTurns,
  isTier2FireSpreadPlanValid,
  spawnTier2Fire,
  spawnTier2FireWithFeedback,
  spreadTier2Fire,
  spreadTier2FireWithFeedback,
} from './eventSystem';

describe('Tier 6 fixed-grid rule', () => {
  it('starts no event and leaves only the fixed-grid mechanic active', () => {
    const get = () => ({ gameMode: GameMode.ENDLESS }) as any;
    const result = checkTierEvent(180000, 5, get, vi.fn());

    expect(result).toMatchObject({
      difficultyTier: 6,
      activeEvent: null,
      eventMovesRemaining: 0,
    });
  });
});

describe('Tier 2 fire pressure', () => {
  it('spawns two fire cells by converting existing normal blocks', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[0][x] = {
        filled: true,
        color: '#3b82f6',
        id: `normal-${x}`,
        type: CellType.NORMAL,
      };
    }

    const result = spawnTier2Fire(grid);
    const fireCells = result.flat().filter(cell => cell.type === CellType.FIRE);

    expect(fireCells).toHaveLength(2);
    expect(fireCells.every(cell => cell.filled && cell.health === 2)).toBe(true);
  });

  it('reports spawned fire cells for board feedback', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[0][x] = {
        filled: true,
        color: '#3b82f6',
        id: `normal-${x}`,
        type: CellType.NORMAL,
      };
    }

    const result = spawnTier2FireWithFeedback(grid);

    expect(result.cells).toHaveLength(2);
    result.cells.forEach(cell => {
      expect(result.grid[cell.y][cell.x]).toEqual(expect.objectContaining({
        id: cell.id,
        type: CellType.FIRE,
      }));
    });
  });

  it('tops up late-game fire pressure without replacing existing fire cells', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { filled: true, color: '#a855f7', id: 'existing', type: CellType.FIRE, health: 2 };
    for (let x = 1; x < 6; x++) {
      grid[0][x] = {
        filled: true,
        color: '#3b82f6',
        id: `normal-${x}`,
        type: CellType.NORMAL,
      };
    }

    const result = ensureLateGameFireMinimumWithFeedback(grid, 3);

    expect(result.cells).toHaveLength(2);
    expect(result.grid.flat().filter(cell => cell.type === CellType.FIRE)).toHaveLength(3);
    expect(result.grid[0][0]).toEqual(expect.objectContaining({ id: 'existing', health: 2 }));
  });

  it('does not respawn fire when the late-game minimum is already met', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < 3; x++) {
      grid[0][x] = {
        filled: true,
        color: '#a855f7',
        id: `fire-${x}`,
        type: CellType.FIRE,
        health: 2,
      };
    }

    const result = ensureLateGameFireMinimumWithFeedback(grid, 3);

    expect(result.grid).toBe(grid);
    expect(result.cells).toEqual([]);
  });

  it('shortens the warning window after 260K without removing it', () => {
    expect(getFireSpreadPendingTurns(259999)).toBe(2);
    expect(getFireSpreadPendingTurns(260000)).toBe(1);
  });

  it('prefers separated connected blocks outside nearly complete lines', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE - 2; x++) {
      grid[0][x] = {
        filled: true,
        color: '#f59e0b',
        id: `near-clear-${x}`,
        type: CellType.NORMAL,
      };
    }

    [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 7, y: 7 },
      { x: 8, y: 7 },
    ].forEach(({ x, y }) => {
      grid[y][x] = {
        filled: true,
        color: '#3b82f6',
        id: `safe-${x}-${y}`,
        type: CellType.NORMAL,
      };
    });

    const result = spawnTier2FireWithFeedback(grid);

    expect(result.cells).toHaveLength(2);
    expect(result.cells.every(cell => cell.y !== 0)).toBe(true);
    expect(
      Math.abs(result.cells[0].x - result.cells[1].x) +
      Math.abs(result.cells[0].y - result.cells[1].y)
    ).toBeGreaterThanOrEqual(3);
  });

  it('falls back to available blocks when every candidate is on a dense line', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[0][x] = {
        filled: true,
        color: '#3b82f6',
        id: `dense-${x}`,
        type: CellType.NORMAL,
      };
    }

    const result = spawnTier2FireWithFeedback(grid);

    expect(result.cells).toHaveLength(2);
    expect(
      Math.abs(result.cells[0].x - result.cells[1].x) +
      Math.abs(result.cells[0].y - result.cells[1].y)
    ).toBeGreaterThanOrEqual(3);
  });

  it('spreads every third tier move to one adjacent normal block', () => {
    const grid = createEmptyGrid();
    grid[4][4] = { filled: true, color: '#ef4444', id: 'fire', type: CellType.FIRE, health: 2 };
    grid[4][5] = { filled: true, color: '#3b82f6', id: 'burnable', type: CellType.NORMAL };

    const result = spreadTier2Fire(grid, 13, 10);
    const fireCells = result.flat().filter(cell => cell.type === CellType.FIRE);

    expect(result[4][5]).toEqual(expect.objectContaining({
      id: 'burnable',
      type: CellType.FIRE,
      health: 2,
    }));
    expect(fireCells).toHaveLength(2);
  });

  it('spreads from two separated sources in the same cycle', () => {
    const grid = createEmptyGrid();
    grid[2][2] = { filled: true, color: '#a855f7', id: 'source-a', type: CellType.FIRE, health: 2 };
    grid[2][3] = { filled: true, color: '#3b82f6', id: 'target-a', type: CellType.NORMAL };
    grid[7][7] = { filled: true, color: '#a855f7', id: 'source-b', type: CellType.FIRE, health: 2 };
    grid[7][8] = { filled: true, color: '#10b981', id: 'target-b', type: CellType.NORMAL };

    const plans = createTier2FireSpreadPlans(grid);
    const result = applyTier2FireSpreadPlans(grid, plans);

    expect(plans).toHaveLength(2);
    expect(new Set(plans.map(plan => `${plan.sourceX},${plan.sourceY}`)).size).toBe(2);
    expect(new Set(plans.map(plan => `${plan.x},${plan.y}`)).size).toBe(2);
    expect(result.cells).toHaveLength(2);
    expect(result.grid.flat().filter(cell => cell.type === CellType.FIRE)).toHaveLength(4);
  });

  it('limits a spread cycle to the remaining capacity', () => {
    const grid = createEmptyGrid();
    [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
      { x: 5, y: 1 },
      { x: 7, y: 1 },
      { x: 1, y: 7 },
    ].forEach(({ x, y }, index) => {
      grid[y][x] = {
        filled: true,
        color: '#a855f7',
        id: `source-${index}`,
        type: CellType.FIRE,
        health: 2,
      };
      grid[y][x + 1] = {
        filled: true,
        color: '#3b82f6',
        id: `target-${index}`,
        type: CellType.NORMAL,
      };
    });

    const plans = createTier2FireSpreadPlans(grid);
    const result = applyTier2FireSpreadPlans(grid, plans);

    expect(plans).toHaveLength(1);
    expect(result.grid.flat().filter(cell => cell.type === CellType.FIRE)).toHaveLength(6);
  });

  it('reports spread fire cells for board feedback', () => {
    const grid = createEmptyGrid();
    grid[4][4] = { filled: true, color: '#ef4444', id: 'fire', type: CellType.FIRE, health: 2 };
    grid[4][5] = { filled: true, color: '#3b82f6', id: 'burnable', type: CellType.NORMAL };

    const result = spreadTier2FireWithFeedback(grid, 13, 10);

    expect(result.cells).toEqual([
      expect.objectContaining({ id: 'burnable', x: 5, y: 4, sourceX: 4, sourceY: 4 }),
    ]);
  });

  it('keeps a planned spread on the same source and target until it is applied', () => {
    const grid = createEmptyGrid();
    grid[4][4] = { filled: true, color: '#a855f7', id: 'source', type: CellType.FIRE, health: 2 };
    grid[4][5] = { filled: true, color: '#3b82f6', id: 'target', type: CellType.NORMAL };

    const plan = createTier2FireSpreadPlan(grid);

    expect(plan).toEqual(expect.objectContaining({ x: 5, y: 4, sourceX: 4, sourceY: 4 }));
    expect(plan && isTier2FireSpreadPlanValid(grid, plan)).toBe(true);

    const result = applyTier2FireSpreadPlan(grid, plan!);
    expect(result.grid[4][5]).toEqual(expect.objectContaining({ id: 'target', type: CellType.FIRE, health: 2 }));
    expect(result.cells).toEqual([
      expect.objectContaining({ x: 5, y: 4, sourceX: 4, sourceY: 4 }),
    ]);
  });

  it('does not spread from a damaged virus source', () => {
    const grid = createEmptyGrid();
    grid[4][4] = { filled: true, color: '#a855f7', id: 'damaged', type: CellType.FIRE, health: 1 };
    grid[4][5] = { filled: true, color: '#3b82f6', id: 'target', type: CellType.NORMAL };

    expect(createTier2FireSpreadPlans(grid)).toEqual([]);
  });

  it('extinguishes fire back to normal blocks when leaving tier 2', () => {
    const grid = createEmptyGrid();
    grid[4][4] = { filled: true, color: '#ef4444', id: 'fire', type: CellType.FIRE, health: 1 };

    const result = extinguishTier2Fire(grid);

    expect(result[4][4]).toEqual(expect.objectContaining({
      id: 'fire',
      type: CellType.NORMAL,
      health: undefined,
    }));
  });
});
