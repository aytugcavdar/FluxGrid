import { describe, it, expect } from 'vitest';
import {
  serializeGameState,
  deserializeGameState,
} from '@features/game/store/helpers/localStorage';
import { migrateSaveData, SaveData } from '@features/game/store/helpers/migration';
import { MiniEventType } from '@features/game/types';

describe('Feature: endless-mode-rebalance - localStorage Integration', () => {
  describe('Integration with migration system', () => {
    it('should work with migrateSaveData for new save data', () => {
      // Simulate a new game save with mini-event state
      const gameState = {
        score: 5000,
        difficultyTier: 2,
        activeEvent: 'QUAKE' as const,
        eventMovesRemaining: 8,
        miniEventState: {
          activeEvents: new Set([MiniEventType.FLUX_SURGE]),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 5,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 50,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 75,
        saveVersion: 2,
      };

      // Serialize for localStorage
      const serialized = serializeGameState(gameState);
      
      // Simulate localStorage round-trip
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      
      // Migrate (should be no-op for version 2)
      const migrated = migrateSaveData(parsed as SaveData);
      
      // Deserialize
      const deserialized = deserializeGameState(migrated);

      // Verify state is preserved
      expect(deserialized.score).toBe(5000);
      expect(deserialized.difficultyTier).toBe(2);
      expect(deserialized.totalMovesPlayed).toBe(75);
      expect(deserialized.miniEventState.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.FLUX_SURGE]).toBe(5);
      expect(deserialized.miniEventState.lastActivation[MiniEventType.FLUX_SURGE]).toBe(50);
    });

    it('should work with migrateSaveData for old save data (version 1)', () => {
      // Simulate an old game save without mini-event state
      const oldSaveData: SaveData = {
        score: 8000,
        difficultyTier: 3,
        activeEvent: 'MIRROR',
        eventMovesRemaining: 999, // Old infinite duration
        // No miniEventState or totalMovesPlayed
      };

      // Migrate to version 2
      const migrated = migrateSaveData(oldSaveData);
      
      // Deserialize
      const deserialized = deserializeGameState(migrated);

      // Verify migration worked
      expect(deserialized.score).toBe(8000);
      expect(deserialized.difficultyTier).toBe(3); // Recalculated based on score (8000 is in tier 3: 4000-9000)
      expect(deserialized.eventMovesRemaining).toBe(10); // Converted from 999 to standardized duration
      expect(deserialized.totalMovesPlayed).toBe(0); // Initialized with default
      expect(deserialized.miniEventState).toBeDefined();
      expect(deserialized.miniEventState.activeEvents.size).toBe(0);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.FLUX_SURGE]).toBe(0);
    });

    it('should handle complete save/load cycle with migration', () => {
      // Step 1: Create game state
      const originalState = {
        score: 12000,
        difficultyTier: 4,
        activeEvent: 'CHAOS' as const,
        eventMovesRemaining: 12,
        miniEventState: {
          activeEvents: new Set([MiniEventType.SCORE_RUSH, MiniEventType.CLEAR_BONUS]),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 8,
            [MiniEventType.CLEAR_BONUS]: 1,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 100,
            [MiniEventType.CLEAR_BONUS]: 150,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 175,
        saveVersion: 2,
      };

      // Step 2: Serialize
      const serialized = serializeGameState(originalState);
      
      // Step 3: Simulate localStorage (JSON round-trip)
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      
      // Step 4: Migrate (should be no-op for version 2)
      const migrated = migrateSaveData(parsed as SaveData);
      
      // Step 5: Deserialize
      const restored = deserializeGameState(migrated);

      // Step 6: Verify complete state restoration
      expect(restored.score).toBe(originalState.score);
      expect(restored.difficultyTier).toBe(originalState.difficultyTier);
      expect(restored.activeEvent).toBe(originalState.activeEvent);
      expect(restored.eventMovesRemaining).toBe(originalState.eventMovesRemaining);
      expect(restored.totalMovesPlayed).toBe(originalState.totalMovesPlayed);
      
      // Verify mini-event state
      expect(restored.miniEventState.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(restored.miniEventState.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(restored.miniEventState.activeEvents.size).toBe(2);
      expect(restored.miniEventState.moveCounters[MiniEventType.SCORE_RUSH]).toBe(8);
      expect(restored.miniEventState.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
      expect(restored.miniEventState.lastActivation[MiniEventType.SCORE_RUSH]).toBe(100);
      expect(restored.miniEventState.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(150);
    });

    it('should handle edge case: empty mini-event state', () => {
      const gameState = {
        score: 1000,
        difficultyTier: 0,
        miniEventState: {
          activeEvents: new Set<MiniEventType>(),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 0,
        saveVersion: 2,
      };

      const serialized = serializeGameState(gameState);
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      const migrated = migrateSaveData(parsed as SaveData);
      const restored = deserializeGameState(migrated);

      expect(restored.miniEventState.activeEvents.size).toBe(0);
      expect(restored.totalMovesPlayed).toBe(0);
    });

    it('should handle edge case: all mini-events active', () => {
      const gameState = {
        score: 20000,
        difficultyTier: 5,
        miniEventState: {
          activeEvents: new Set([
            MiniEventType.FLUX_SURGE,
            MiniEventType.SCORE_RUSH,
            MiniEventType.CLEAR_BONUS,
          ]),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 10,
            [MiniEventType.SCORE_RUSH]: 10,
            [MiniEventType.CLEAR_BONUS]: 1,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 150,
            [MiniEventType.SCORE_RUSH]: 200,
            [MiniEventType.CLEAR_BONUS]: 300,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 310,
        saveVersion: 2,
      };

      const serialized = serializeGameState(gameState);
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      const migrated = migrateSaveData(parsed as SaveData);
      const restored = deserializeGameState(migrated);

      expect(restored.miniEventState.activeEvents.size).toBe(3);
      expect(restored.miniEventState.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(restored.miniEventState.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(restored.miniEventState.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(restored.totalMovesPlayed).toBe(310);
    });
  });
});
