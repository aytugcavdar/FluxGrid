import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';
import { SaveData } from '@features/game/store/helpers/migration';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';

describe('Feature: endless-mode-rebalance - GameStore Migration Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      score: 0,
      difficultyTier: 0,
      activeEvent: null,
      eventMovesRemaining: 0,
      miniEventState: createMiniEventState(),
      totalMovesPlayed: 0,
    });
  });

  describe('initGame with saved data', () => {
    it('should initialize game with migrated save data', () => {
      const savedData: SaveData = {
        score: 5000,
        difficultyTier: 3, // Old tier value
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(5000);
      expect(state.difficultyTier).toBe(0); // Recalculated from score
      expect(state.gameMode).toBe(GameMode.ENDLESS);
      expect(state.miniEventState).toBeDefined();
      expect(state.totalMovesPlayed).toBe(0);
    });

    it('should convert infinite event duration during initialization', () => {
      const savedData: SaveData = {
        score: 20000,
        difficultyTier: 5,
        activeEvent: 'CHAOS',
        eventMovesRemaining: 999, // Infinite duration
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(20000);
      expect(state.activeEvent).toBe('CHAOS');
      expect(state.eventMovesRemaining).toBe(12); // Converted to standardized duration
    });

    it('should initialize miniEventState if missing in saved data', () => {
      const savedData: SaveData = {
        score: 3000,
        difficultyTier: 1,
        saveVersion: 1,
        // miniEventState is missing
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.miniEventState).toBeDefined();
      expect(state.miniEventState.activeEvents).toBeInstanceOf(Set);
      expect(state.miniEventState.activeEvents.size).toBe(0);
    });

    it('should initialize totalMovesPlayed if missing in saved data', () => {
      const savedData: SaveData = {
        score: 2000,
        difficultyTier: 1,
        saveVersion: 1,
        // totalMovesPlayed is missing
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.totalMovesPlayed).toBe(0);
    });

    it('should preserve score during migration', () => {
      const savedData: SaveData = {
        score: 8500,
        difficultyTier: 4,
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(8500); // Score preserved
      expect(state.difficultyTier).toBe(0); // Tier recalculated
    });

    it('should handle save data already at version 2', () => {
      const savedData: SaveData = {
        score: 10000,
        difficultyTier: 3,
        saveVersion: 2,
        miniEventState: createMiniEventState(),
        totalMovesPlayed: 50,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(10000);
      expect(state.difficultyTier).toBe(3); // Not recalculated
      expect(state.totalMovesPlayed).toBe(50);
    });

    it('should initialize fresh game when no saved data provided', () => {
      useGameStore.getState().initGame(GameMode.ENDLESS);

      const state = useGameStore.getState();
      expect(state.score).toBe(0);
      expect(state.difficultyTier).toBe(0);
      expect(state.activeEvent).toBeNull();
      expect(state.eventMovesRemaining).toBe(0);
      expect(state.miniEventState).toBeDefined();
      expect(state.totalMovesPlayed).toBe(0);
    });

    it('should handle VOID event with infinite duration', () => {
      const savedData: SaveData = {
        score: 40000,
        difficultyTier: 6,
        activeEvent: 'VOID',
        eventMovesRemaining: 999,
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.activeEvent).toBe('VOID');
      expect(state.eventMovesRemaining).toBe(10); // Converted to standardized duration
    });

    it('should not affect non-ENDLESS modes', () => {
      const savedData: SaveData = {
        score: 5000,
        difficultyTier: 2,
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.TIMED, savedData);

      const state = useGameStore.getState();
      expect(state.gameMode).toBe(GameMode.TIMED);
      expect(state.score).toBe(5000); // Score loaded
      expect(state.difficultyTier).toBe(0); // Recalculated but not used in TIMED mode
    });

    it('should handle edge case: score at tier threshold', () => {
      const savedData: SaveData = {
        score: 15000, // Exactly at tier 1 threshold
        difficultyTier: 2,
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(15000);
      expect(state.difficultyTier).toBe(1); // Should be tier 1
    });

    it('should handle edge case: very high score', () => {
      const savedData: SaveData = {
        score: 300000, // Beyond tier 6 threshold
        difficultyTier: 5,
        saveVersion: 1,
      };

      useGameStore.getState().initGame(GameMode.ENDLESS, savedData);

      const state = useGameStore.getState();
      expect(state.score).toBe(300000);
      expect(state.difficultyTier).toBe(6); // Max tier
    });
  });
});
