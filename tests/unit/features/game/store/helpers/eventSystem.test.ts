import { describe, it, expect } from 'vitest';
import { getEventScoreMultiplier, tickActiveEvent, checkTierEvent } from '@features/game/store/helpers/eventSystem';
import { GRID_SIZE } from '@features/game/types';
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

    it('should return 1.2 for GRAVITY_RUSH event', () => {
      expect(getEventScoreMultiplier('GRAVITY_RUSH')).toBe(1.2);
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
      
      // Test: Tier transition in ENDLESS mode should activate event
      const resultEndless = checkTierEvent(1500, 0, getEndless as any, set);
      expect(resultEndless).not.toBeNull();
      expect(resultEndless?.activeEvent).toBe('ICE_STORM');
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
      const resultTimed = checkTierEvent(1500, 0, getTimed as any, set);
      expect(resultTimed).toBeNull();
    });

    it('should NOT activate tier events in ZEN mode', () => {
      // Validates Requirements 9.2
      
      const getZen = () => ({
        gameMode: GameMode.ZEN,
        grid: Array(GRID_SIZE).fill(null).map(() => 
          Array(GRID_SIZE).fill(null).map(() => ({ filled: false, color: '' }))
        ),
      });
      
      const set = () => {};
      
      // Test: Tier transition in ZEN mode should NOT activate event
      const resultZen = checkTierEvent(1500, 0, getZen as any, set);
      expect(resultZen).toBeNull();
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
      const resultDaily = checkTierEvent(1500, 0, getDaily as any, set);
      expect(resultDaily).toBeNull();
    });
  });
});

  describe('VOID periodic clearing', () => {
    it('should clear bottom 2 rows (rows 8 and 9) every 5 moves', () => {
      // This test verifies Requirements 2.8, 3.3, 15.3, 15.4, 15.5
      // The VOID event should clear rows 8 and 9 every 5 moves without gravity or scoring
      
      // Create a mock grid with blocks in all rows
      const createFilledGrid = (): any[] => {
        const grid: any[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          const row: any[] = [];
          for (let x = 0; x < GRID_SIZE; x++) {
            row.push({ filled: true, color: '#ff0000', id: `cell-${y}-${x}` });
          }
          grid.push(row);
        }
        return grid;
      };
      
      // Mock piece (not used in VOID logic but required by function signature)
      const mockPiece: any = { shape: [[1]], color: '#ff0000', instanceId: 'test-1', id: 'test-1' };
      
      // Test case 1: movesElapsed = 5 (should trigger clear)
      const grid1 = createFilledGrid();
      const get1 = () => ({
        activeEvent: 'VOID' as const,
        eventMovesRemaining: 5, // movesElapsed = 10 - 5 = 5
        grid: grid1,
      } as any);
      const set1 = () => {};
      
      const result1 = tickActiveEvent(grid1, mockPiece, get1, set1);
      
      expect(result1).not.toBeNull();
      expect(result1?.grid).toBeDefined();
      
      // Verify rows 8 and 9 are cleared
      for (let x = 0; x < GRID_SIZE; x++) {
        expect(result1?.grid?.[8][x].filled).toBe(false);
        expect(result1?.grid?.[9][x].filled).toBe(false);
      }
      
      // Verify other rows are NOT cleared
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          expect(result1?.grid?.[y][x].filled).toBe(true);
        }
      }
      
      // Test case 2: movesElapsed = 3 (should NOT trigger clear)
      const grid2 = createFilledGrid();
      const get2 = () => ({
        activeEvent: 'VOID' as const,
        eventMovesRemaining: 7, // movesElapsed = 10 - 7 = 3
        grid: grid2,
      } as any);
      const set2 = () => {};
      
      const result2 = tickActiveEvent(grid2, mockPiece, get2, set2);
      
      // Should still decrement counter but not clear rows
      expect(result2?.eventMovesRemaining).toBe(6);
      
      // If grid is updated, rows 8 and 9 should still be filled
      if (result2?.grid) {
        for (let x = 0; x < GRID_SIZE; x++) {
          expect(result2.grid[8][x].filled).toBe(true);
          expect(result2.grid[9][x].filled).toBe(true);
        }
      }
      
      // Test case 3: movesElapsed = 10 (should trigger clear at move 10)
      const grid3 = createFilledGrid();
      const get3 = () => ({
        activeEvent: 'VOID' as const,
        eventMovesRemaining: 1, // movesElapsed = 10 - 1 = 9, but after decrement it becomes 0
        grid: grid3,
      } as any);
      const set3 = () => {};
      
      const result3 = tickActiveEvent(grid3, mockPiece, get3, set3);
      
      // Event should deactivate when duration reaches 0 after decrement
      expect(result3?.activeEvent).toBe(null);
      expect(result3?.eventMovesRemaining).toBe(0);
    });
  });
