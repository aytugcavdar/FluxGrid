import { describe, it, expect } from 'vitest';
import { migrateSaveData, SaveData } from '@features/game/store/helpers/migration';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';
import { EVENT_DURATIONS } from '@features/game/constants';

describe('Feature: endless-mode-rebalance - Save Data Migration', () => {
  describe('migrateSaveData', () => {
    it('should not migrate data that is already at version 3', () => {
      const saveData: SaveData = {
        score: 5000,
        difficultyTier: 2,
        saveVersion: 3,
        miniEventState: createMiniEventState(),
        totalMovesPlayed: 100,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.score).toBe(5000);
      expect(result.difficultyTier).toBe(2);
    });

    it('should recalculate tier based on score and new thresholds', () => {
      const saveData: SaveData = {
        score: 5000,
        difficultyTier: 3, // Old tier value
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.difficultyTier).toBe(1); // Recalculated from current thresholds
      expect(result.score).toBe(5000); // Score preserved
    });

    it('should convert infinite event duration (999) to standardized duration', () => {
      const saveData: SaveData = {
        score: 10000,
        difficultyTier: 4,
        activeEvent: 'CHAOS',
        eventMovesRemaining: 999, // Infinite duration
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.eventMovesRemaining).toBe(EVENT_DURATIONS.CHAOS); // Converted to 12
      expect(result.activeEvent).toBe('CHAOS');
    });

    it('should convert infinite VOID event duration to standardized duration', () => {
      const saveData: SaveData = {
        score: 40000,
        difficultyTier: 6,
        activeEvent: 'VOID',
        eventMovesRemaining: 999,
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.eventMovesRemaining).toBe(EVENT_DURATIONS.VOID); // Converted to 10
    });

    it('should initialize miniEventState if missing', () => {
      const saveData: SaveData = {
        score: 3000,
        difficultyTier: 1,
        saveVersion: 1,
        // miniEventState is missing
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.miniEventState).toBeDefined();
      expect(result.miniEventState?.activeEvents).toBeInstanceOf(Set);
      expect(result.miniEventState?.activeEvents.size).toBe(0);
      expect(result.miniEventState?.moveCounters).toBeDefined();
      expect(result.miniEventState?.lastActivation).toBeDefined();
    });

    it('should initialize totalMovesPlayed if missing', () => {
      const saveData: SaveData = {
        score: 2000,
        difficultyTier: 1,
        saveVersion: 1,
        // totalMovesPlayed is missing
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.totalMovesPlayed).toBe(0);
    });

    it('should handle missing saveVersion (default to version 1)', () => {
      const saveData: SaveData = {
        score: 1500,
        difficultyTier: 1,
        // saveVersion is missing, should default to 1
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.miniEventState).toBeDefined();
      expect(result.totalMovesPlayed).toBe(0);
    });

    it('should preserve all other fields during migration', () => {
      const saveData: SaveData = {
        score: 8000,
        difficultyTier: 3,
        combo: 5,
        activeEvent: 'QUAKE',
        eventMovesRemaining: 8,
        customField: 'test',
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.combo).toBe(5);
      expect(result.activeEvent).toBe('QUAKE');
      expect(result.eventMovesRemaining).toBe(8); // Not 999, so not converted
      expect(result.customField).toBe('test');
    });

    it('should handle edge case: score at tier threshold', () => {
      const saveData: SaveData = {
        score: 9000,
        difficultyTier: 2,
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.difficultyTier).toBe(1);
    });

    it('should handle edge case: score = 0', () => {
      const saveData: SaveData = {
        score: 0,
        difficultyTier: 0,
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.difficultyTier).toBe(0);
    });

    it('should handle edge case: very high score', () => {
      const saveData: SaveData = {
        score: 100000,
        difficultyTier: 5,
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.difficultyTier).toBe(5);
    });

    it('should not convert non-infinite event durations', () => {
      const saveData: SaveData = {
        score: 5000,
        difficultyTier: 2,
        activeEvent: 'ICE_STORM',
        eventMovesRemaining: 5, // Not 999
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.eventMovesRemaining).toBe(5); // Unchanged
    });

    it('should handle missing score field', () => {
      const saveData: SaveData = {
        // score is missing
        difficultyTier: 2,
        saveVersion: 1,
      };

      const result = migrateSaveData(saveData);

      expect(result.saveVersion).toBe(3);
      expect(result.difficultyTier).toBe(2); // Unchanged since no score to recalculate from
    });
  });
});
