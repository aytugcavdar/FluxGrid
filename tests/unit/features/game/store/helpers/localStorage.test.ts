import { describe, it, expect } from 'vitest';
import {
  serializeMiniEventState,
  deserializeMiniEventState,
  serializeGameState,
  deserializeGameState,
} from '@features/game/store/helpers/localStorage';
import { MiniEventType, MiniEventState } from '@features/game/types';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';

describe('Feature: endless-mode-rebalance - localStorage Serialization', () => {
  describe('serializeMiniEventState', () => {
    it('should convert Set to array for activeEvents', () => {
      const miniEventState: MiniEventState = {
        activeEvents: new Set([MiniEventType.FLUX_SURGE, MiniEventType.SCORE_RUSH]),
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 5,
          [MiniEventType.SCORE_RUSH]: 8,
          [MiniEventType.CLEAR_BONUS]: 0,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        lastActivation: {
          [MiniEventType.FLUX_SURGE]: 50,
          [MiniEventType.SCORE_RUSH]: 100,
          [MiniEventType.CLEAR_BONUS]: 0,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        comboShieldActive: false,
      };

      const serialized = serializeMiniEventState(miniEventState);

      expect(Array.isArray(serialized.activeEvents)).toBe(true);
      expect(serialized.activeEvents).toContain(MiniEventType.FLUX_SURGE);
      expect(serialized.activeEvents).toContain(MiniEventType.SCORE_RUSH);
      expect(serialized.activeEvents.length).toBe(2);
    });

    it('should preserve moveCounters', () => {
      const miniEventState: MiniEventState = {
        activeEvents: new Set(),
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 10,
          [MiniEventType.SCORE_RUSH]: 5,
          [MiniEventType.CLEAR_BONUS]: 1,
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
      };

      const serialized = serializeMiniEventState(miniEventState);

      expect(serialized.moveCounters[MiniEventType.FLUX_SURGE]).toBe(10);
      expect(serialized.moveCounters[MiniEventType.SCORE_RUSH]).toBe(5);
      expect(serialized.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
    });

    it('should preserve lastActivation', () => {
      const miniEventState: MiniEventState = {
        activeEvents: new Set(),
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 0,
          [MiniEventType.SCORE_RUSH]: 0,
          [MiniEventType.CLEAR_BONUS]: 0,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        lastActivation: {
          [MiniEventType.FLUX_SURGE]: 50,
          [MiniEventType.SCORE_RUSH]: 100,
          [MiniEventType.CLEAR_BONUS]: 150,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        comboShieldActive: false,
      };

      const serialized = serializeMiniEventState(miniEventState);

      expect(serialized.lastActivation[MiniEventType.FLUX_SURGE]).toBe(50);
      expect(serialized.lastActivation[MiniEventType.SCORE_RUSH]).toBe(100);
      expect(serialized.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(150);
    });

    it('should handle empty activeEvents Set', () => {
      const miniEventState: MiniEventState = createMiniEventState();

      const serialized = serializeMiniEventState(miniEventState);

      expect(Array.isArray(serialized.activeEvents)).toBe(true);
      expect(serialized.activeEvents.length).toBe(0);
    });
  });

  describe('deserializeMiniEventState', () => {
    it('should convert array back to Set for activeEvents', () => {
      const serialized = {
        activeEvents: [MiniEventType.FLUX_SURGE, MiniEventType.CLEAR_BONUS],
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 3,
          [MiniEventType.SCORE_RUSH]: 0,
          [MiniEventType.CLEAR_BONUS]: 1,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        lastActivation: {
          [MiniEventType.FLUX_SURGE]: 50,
          [MiniEventType.SCORE_RUSH]: 0,
          [MiniEventType.CLEAR_BONUS]: 150,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        comboShieldActive: false,
      };

      const deserialized = deserializeMiniEventState(serialized);

      expect(deserialized.activeEvents instanceof Set).toBe(true);
      expect(deserialized.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(deserialized.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(deserialized.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(false);
      expect(deserialized.activeEvents.size).toBe(2);
    });

    it('should restore moveCounters', () => {
      const serialized = {
        activeEvents: [],
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 7,
          [MiniEventType.SCORE_RUSH]: 9,
          [MiniEventType.CLEAR_BONUS]: 1,
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
      };

      const deserialized = deserializeMiniEventState(serialized);

      expect(deserialized.moveCounters[MiniEventType.FLUX_SURGE]).toBe(7);
      expect(deserialized.moveCounters[MiniEventType.SCORE_RUSH]).toBe(9);
      expect(deserialized.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
    });

    it('should restore lastActivation', () => {
      const serialized = {
        activeEvents: [],
        moveCounters: {
          [MiniEventType.FLUX_SURGE]: 0,
          [MiniEventType.SCORE_RUSH]: 0,
          [MiniEventType.CLEAR_BONUS]: 0,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        lastActivation: {
          [MiniEventType.FLUX_SURGE]: 100,
          [MiniEventType.SCORE_RUSH]: 200,
          [MiniEventType.CLEAR_BONUS]: 300,
          [MiniEventType.COMBO_SHIELD]: 0,
          [MiniEventType.PIECE_BLESSING]: 0,
        },
        comboShieldActive: false,
      };

      const deserialized = deserializeMiniEventState(serialized);

      expect(deserialized.lastActivation[MiniEventType.FLUX_SURGE]).toBe(100);
      expect(deserialized.lastActivation[MiniEventType.SCORE_RUSH]).toBe(200);
      expect(deserialized.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(300);
    });

    it('should return default state when serialized is undefined', () => {
      const deserialized = deserializeMiniEventState(undefined);

      expect(deserialized.activeEvents instanceof Set).toBe(true);
      expect(deserialized.activeEvents.size).toBe(0);
      expect(deserialized.moveCounters[MiniEventType.FLUX_SURGE]).toBe(0);
      expect(deserialized.moveCounters[MiniEventType.SCORE_RUSH]).toBe(0);
      expect(deserialized.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(0);
      expect(deserialized.lastActivation[MiniEventType.FLUX_SURGE]).toBe(0);
      expect(deserialized.lastActivation[MiniEventType.SCORE_RUSH]).toBe(0);
      expect(deserialized.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(0);
    });
  });

  describe('serializeGameState', () => {
    it('should serialize miniEventState when present', () => {
      const gameState = {
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
        score: 5000,
      };

      const serialized = serializeGameState(gameState);

      expect(Array.isArray(serialized.miniEventState.activeEvents)).toBe(true);
      expect(serialized.miniEventState.activeEvents).toContain(MiniEventType.FLUX_SURGE);
      expect(serialized.totalMovesPlayed).toBe(75);
      expect(serialized.score).toBe(5000);
    });

    it('should serialize totalMovesPlayed when present', () => {
      const gameState = {
        totalMovesPlayed: 123,
        score: 10000,
      };

      const serialized = serializeGameState(gameState);

      expect(serialized.totalMovesPlayed).toBe(123);
      expect(serialized.score).toBe(10000);
    });

    it('should handle missing miniEventState', () => {
      const gameState = {
        totalMovesPlayed: 50,
        score: 3000,
      };

      const serialized = serializeGameState(gameState);

      expect(serialized.miniEventState).toBeUndefined();
      expect(serialized.totalMovesPlayed).toBe(50);
      expect(serialized.score).toBe(3000);
    });

    it('should preserve other fields', () => {
      const gameState = {
        miniEventState: createMiniEventState(),
        totalMovesPlayed: 0,
        score: 0,
        difficultyTier: 2,
        activeEvent: 'QUAKE' as const,
        eventMovesRemaining: 8,
      };

      const serialized = serializeGameState(gameState);

      expect(serialized.score).toBe(0);
      expect(serialized.difficultyTier).toBe(2);
      expect(serialized.activeEvent).toBe('QUAKE');
      expect(serialized.eventMovesRemaining).toBe(8);
    });
  });

  describe('deserializeGameState', () => {
    it('should deserialize miniEventState when present', () => {
      const serialized = {
        miniEventState: {
          activeEvents: [MiniEventType.SCORE_RUSH],
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 10,
            [MiniEventType.CLEAR_BONUS]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 100,
            [MiniEventType.CLEAR_BONUS]: 0,
          },
        },
        totalMovesPlayed: 150,
        score: 8000,
      };

      const deserialized = deserializeGameState(serialized);

      expect(deserialized.miniEventState.activeEvents instanceof Set).toBe(true);
      expect(deserialized.miniEventState.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(deserialized.totalMovesPlayed).toBe(150);
      expect(deserialized.score).toBe(8000);
    });

    it('should initialize miniEventState with defaults if missing', () => {
      const serialized = {
        totalMovesPlayed: 50,
        score: 3000,
      };

      const deserialized = deserializeGameState(serialized);

      expect(deserialized.miniEventState).toBeDefined();
      expect(deserialized.miniEventState.activeEvents instanceof Set).toBe(true);
      expect(deserialized.miniEventState.activeEvents.size).toBe(0);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.FLUX_SURGE]).toBe(0);
    });

    it('should initialize totalMovesPlayed with 0 if missing', () => {
      const serialized = {
        score: 5000,
        difficultyTier: 2,
      };

      const deserialized = deserializeGameState(serialized);

      expect(deserialized.totalMovesPlayed).toBe(0);
      expect(deserialized.score).toBe(5000);
      expect(deserialized.difficultyTier).toBe(2);
    });

    it('should preserve other fields', () => {
      const serialized = {
        miniEventState: {
          activeEvents: [],
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 0,
          },
        },
        totalMovesPlayed: 0,
        score: 12000,
        difficultyTier: 4,
        activeEvent: 'MIRROR',
        eventMovesRemaining: 10,
      };

      const deserialized = deserializeGameState(serialized);

      expect(deserialized.score).toBe(12000);
      expect(deserialized.difficultyTier).toBe(4);
      expect(deserialized.activeEvent).toBe('MIRROR');
      expect(deserialized.eventMovesRemaining).toBe(10);
    });
  });

  describe('Round-trip serialization', () => {
    it('should preserve state through serialize -> deserialize cycle', () => {
      const originalState = {
        miniEventState: {
          activeEvents: new Set([MiniEventType.FLUX_SURGE, MiniEventType.CLEAR_BONUS]),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 7,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 1,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 50,
            [MiniEventType.SCORE_RUSH]: 0,
            [MiniEventType.CLEAR_BONUS]: 150,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 175,
        score: 15000,
        difficultyTier: 3,
      };

      const serialized = serializeGameState(originalState);
      const deserialized = deserializeGameState(serialized);

      expect(deserialized.miniEventState.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(deserialized.miniEventState.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(deserialized.miniEventState.activeEvents.size).toBe(2);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.FLUX_SURGE]).toBe(7);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
      expect(deserialized.miniEventState.lastActivation[MiniEventType.FLUX_SURGE]).toBe(50);
      expect(deserialized.miniEventState.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(150);
      expect(deserialized.totalMovesPlayed).toBe(175);
      expect(deserialized.score).toBe(15000);
      expect(deserialized.difficultyTier).toBe(3);
    });

    it('should handle JSON.stringify -> JSON.parse cycle', () => {
      const originalState = {
        miniEventState: {
          activeEvents: new Set([MiniEventType.SCORE_RUSH]),
          moveCounters: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 10,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          lastActivation: {
            [MiniEventType.FLUX_SURGE]: 0,
            [MiniEventType.SCORE_RUSH]: 100,
            [MiniEventType.CLEAR_BONUS]: 0,
            [MiniEventType.COMBO_SHIELD]: 0,
            [MiniEventType.PIECE_BLESSING]: 0,
          },
          comboShieldActive: false,
        },
        totalMovesPlayed: 125,
        score: 9000,
      };

      const serialized = serializeGameState(originalState);
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      const deserialized = deserializeGameState(parsed);

      expect(deserialized.miniEventState.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(deserialized.miniEventState.activeEvents.size).toBe(1);
      expect(deserialized.miniEventState.moveCounters[MiniEventType.SCORE_RUSH]).toBe(10);
      expect(deserialized.miniEventState.lastActivation[MiniEventType.SCORE_RUSH]).toBe(100);
      expect(deserialized.totalMovesPlayed).toBe(125);
      expect(deserialized.score).toBe(9000);
    });
  });
});
