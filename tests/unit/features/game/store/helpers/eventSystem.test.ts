import { describe, it, expect } from 'vitest';
import { getEventScoreMultiplier, tickActiveEvent, checkTierEvent } from '@features/game/store/helpers/eventSystem';
import { CellType, GRID_SIZE } from '@features/game/types';
import { GameMode } from '@shared/types';

describe('eventSystem', () => {
  describe('getEventScoreMultiplier', () => {
    it('should return 1.0 for no active event', () => {
      expect(getEventScoreMultiplier(null)).toBe(1.0);
    });

    it('should return 1.3 for QUAKE event', () => {
      expect(getEventScoreMultiplier('QUAKE')).toBe(1.3);
    });

    it('should return 1.2 for ICE_STORM event', () => {
      expect(getEventScoreMultiplier('ICE_STORM')).toBe(1.2);
    });

    it('should return 1.2 for MIRROR event', () => {
      expect(getEventScoreMultiplier('MIRROR')).toBe(1.2);
    });

    it('should return 1.2 for CHAOS event', () => {
      expect(getEventScoreMultiplier('CHAOS')).toBe(1.2);
    });

    it('should return 1.2 for VOID event', () => {
      expect(getEventScoreMultiplier('VOID')).toBe(1.2);
    });
  });

  describe('checkTierEvent - Game Mode Isolation', () => {
    it('should activate tier events only in ENDLESS mode', () => {
      // Validates Requirements 9.1, 9.2
      
      // Mock get function for ENDLESS mode
      const getEndless = () => ({
        gameMode: GameMode.ENDLESS,
        grid: Array(GRID_SIZE).fill(null).map(() => 
          Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
        ),
      });
      
      const set = () => {};
      
      // Test: Tier transition in ENDLESS mode should advance tier.
      const resultEndless = checkTierEvent(15000, 0, getEndless as any, set);
      expect(resultEndless).not.toBeNull();
      expect(resultEndless?.activeEvent).toBe(null);
      expect(resultEndless?.eventMovesRemaining).toBe(0);
      expect(resultEndless?.difficultyTier).toBe(1);
    });

    it('should NOT activate tier events in TIMED mode', () => {
      // Validates Requirements 9.2
      
      const getTimed = () => ({
        gameMode: GameMode.TIMED,
        grid: Array(GRID_SIZE).fill(null).map(() => 
          Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
        ),
      });
      
      const set = () => {};
      
      // Test: Tier transition in TIMED mode should NOT activate event
      const resultTimed = checkTierEvent(15000, 0, getTimed as any, set);
      expect(resultTimed).toBeNull();
    });

    it('should NOT activate tier events in DAILY_CHALLENGE mode', () => {
      // Validates Requirements 9.2
      
      const getDaily = () => ({
        gameMode: GameMode.DAILY_CHALLENGE,
        grid: Array(GRID_SIZE).fill(null).map(() => 
          Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
        ),
      });
      
      const set = () => {};
      
      // Test: Tier transition in DAILY_CHALLENGE mode should NOT activate event
      const resultDaily = checkTierEvent(15000, 0, getDaily as any, set);
      expect(resultDaily).toBeNull();
    });
  });

  describe('checkTierEvent - Endless tier rules', () => {
    const getEndless = () => ({
      gameMode: GameMode.ENDLESS,
      grid: Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
      ),
    });
    const set = () => {};

    it('keeps tier 1 and tier 2 as special-block unlocks without active events', () => {
      const tier1 = checkTierEvent(15000, 0, getEndless as any, set);
      const tier2 = checkTierEvent(40000, 1, getEndless as any, set);

      expect(tier1).toEqual(expect.objectContaining({
        difficultyTier: 1,
        activeEvent: null,
        eventMovesRemaining: 0,
      }));
      expect(tier2).toEqual(expect.objectContaining({
        difficultyTier: 2,
        activeEvent: null,
        eventMovesRemaining: 0,
      }));
    });

    it('starts a short quake at tier 3', () => {
      const result = checkTierEvent(80000, 2, getEndless as any, set);

      expect(result).toEqual(expect.objectContaining({
        difficultyTier: 3,
        activeEvent: 'QUAKE',
        eventMovesRemaining: 4,
      }));
    });

    it('starts a short ice storm at tier 4', () => {
      const result = checkTierEvent(130000, 3, getEndless as any, set);

      expect(result).toEqual(expect.objectContaining({
        difficultyTier: 4,
        activeEvent: 'ICE_STORM',
        eventMovesRemaining: 5,
      }));
    });

    it('starts a stronger quake at tier 5', () => {
      const result = checkTierEvent(190000, 4, getEndless as any, set);

      expect(result).toEqual(expect.objectContaining({
        difficultyTier: 5,
        activeEvent: 'QUAKE',
        eventMovesRemaining: 6,
      }));
    });
  });
});

describe('VOID temporary zones', () => {
  const createEmptyGrid = (): any[] => Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ filled: false, color: '' }))
  );
  const mockPiece: any = {
    shape: [[1]],
    color: '#ff0000',
    instanceId: 'test-1',
    id: 'test-1',
  };
  const getVoidState = (grid: any[], eventMovesRemaining: number) => () => ({
    activeEvent: 'VOID' as const,
    eventMovesRemaining,
    grid,
  } as any);
  const getVoidCells = (grid: any[][]) => grid.flat().filter(cell => cell.type === CellType.VOID);

  it('spawns two zones without deleting existing blocks', () => {
    const grid = createEmptyGrid();
    grid[GRID_SIZE - 1][0] = {
      filled: true,
      color: '#ff0000',
      id: 'existing-block',
      type: CellType.NORMAL,
    };

    const result = tickActiveEvent(grid, mockPiece, getVoidState(grid, 10), () => {}, [mockPiece]);

    expect(result?.eventMovesRemaining).toBe(9);
    expect(result?.grid?.[GRID_SIZE - 1][0].id).toBe('existing-block');
    expect(getVoidCells(result!.grid!)).toHaveLength(2);
    expect(getVoidCells(result!.grid!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ filled: true, voidTurns: 3 }),
    ]));
  });

  it('keeps zones for three player moves and then relocates them', () => {
    const first = tickActiveEvent(
      createEmptyGrid(), mockPiece, getVoidState(createEmptyGrid(), 10), () => {}, [mockPiece]
    )!;
    const firstIds = getVoidCells(first.grid!).map(cell => cell.id);

    const second = tickActiveEvent(first.grid!, mockPiece, getVoidState(first.grid!, 9), () => {}, [mockPiece])!;
    expect(getVoidCells(second.grid!).every(cell => cell.voidTurns === 2)).toBe(true);

    const third = tickActiveEvent(second.grid!, mockPiece, getVoidState(second.grid!, 8), () => {}, [mockPiece])!;
    expect(getVoidCells(third.grid!).every(cell => cell.voidTurns === 1)).toBe(true);

    const fourth = tickActiveEvent(third.grid!, mockPiece, getVoidState(third.grid!, 7), () => {}, [mockPiece])!;
    const relocatedCells = getVoidCells(fourth.grid!);
    expect(relocatedCells).toHaveLength(2);
    expect(relocatedCells.every(cell => cell.voidTurns === 3)).toBe(true);
    expect(relocatedCells.every(cell => !firstIds.includes(cell.id))).toBe(true);
  });

  it('does not create a zone that removes the last valid placement', () => {
    const grid = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({
        filled: !(x === 0 && y === 0),
        color: '#ff0000',
        id: `cell-${y}-${x}`,
        type: CellType.NORMAL,
      }))
    );

    const result = tickActiveEvent(grid, mockPiece, getVoidState(grid, 10), () => {}, [mockPiece]);

    expect(getVoidCells(result!.grid!)).toHaveLength(0);
    expect(result!.grid![0][0].filled).toBe(false);
  });

  it('removes every zone when the event expires', () => {
    const grid = createEmptyGrid();
    grid[1][1] = {
      filled: true,
      color: '#170d28',
      id: 'void-1',
      type: CellType.VOID,
      voidTurns: 1,
    };

    const result = tickActiveEvent(grid, mockPiece, getVoidState(grid, 1), () => {}, [mockPiece]);

    expect(result?.activeEvent).toBe(null);
    expect(result?.eventMovesRemaining).toBe(0);
    expect(getVoidCells(result!.grid!)).toHaveLength(0);
  });
});
