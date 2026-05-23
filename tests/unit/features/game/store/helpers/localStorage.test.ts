import { describe, expect, it } from 'vitest';
import {
  deserializeGameState,
  deserializeMiniEventState,
  serializeGameState,
  serializeMiniEventState,
} from '@features/game/store/helpers/localStorage';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';

describe('localStorage game-state helpers', () => {
  it('serializes compatibility mini-event state Sets as arrays', () => {
    const state = createMiniEventState();
    state.activeEvents.add('LEGACY_EVENT');
    (state.moveCounters as Record<string, number>).LEGACY_EVENT = 3;
    (state.lastActivation as Record<string, number>).LEGACY_EVENT = 42;

    const serialized = serializeMiniEventState(state);

    expect(serialized.activeEvents).toEqual(['LEGACY_EVENT']);
    expect(serialized.moveCounters.LEGACY_EVENT).toBe(3);
    expect(serialized.lastActivation.LEGACY_EVENT).toBe(42);
  });

  it('deserializes compatibility mini-event state arrays as Sets', () => {
    const deserialized = deserializeMiniEventState({
      activeEvents: ['LEGACY_EVENT'],
      moveCounters: { LEGACY_EVENT: 3 },
      lastActivation: { LEGACY_EVENT: 42 },
      comboShieldActive: true,
    });

    expect(deserialized.activeEvents).toBeInstanceOf(Set);
    expect(deserialized.activeEvents.has('LEGACY_EVENT')).toBe(true);
    expect(deserialized.moveCounters.LEGACY_EVENT).toBe(3);
    expect(deserialized.lastActivation.LEGACY_EVENT).toBe(42);
    expect(deserialized.comboShieldActive).toBe(true);
  });

  it('returns default compatibility state when mini-event data is missing', () => {
    const deserialized = deserializeMiniEventState();

    expect(deserialized.activeEvents).toBeInstanceOf(Set);
    expect(deserialized.activeEvents.size).toBe(0);
    expect(deserialized.moveCounters).toEqual({});
    expect(deserialized.lastActivation).toEqual({});
  });

  it('serializes and deserializes game state while preserving current fields', () => {
    const original = {
      score: 12000,
      difficultyTier: 3,
      activeEvent: 'MIRROR' as const,
      eventMovesRemaining: 10,
      totalMovesPlayed: 175,
      miniEventState: createMiniEventState(),
    };
    original.miniEventState.activeEvents.add('LEGACY_EVENT');

    const serialized = serializeGameState(original);
    const restored = deserializeGameState(JSON.parse(JSON.stringify(serialized)));

    expect(restored.score).toBe(12000);
    expect(restored.difficultyTier).toBe(3);
    expect(restored.activeEvent).toBe('MIRROR');
    expect(restored.eventMovesRemaining).toBe(10);
    expect(restored.totalMovesPlayed).toBe(175);
    expect(restored.miniEventState.activeEvents.has('LEGACY_EVENT')).toBe(true);
  });

  it('defaults totalMovesPlayed when older saves omit it', () => {
    const restored = deserializeGameState({ score: 5000 });

    expect(restored.score).toBe(5000);
    expect(restored.totalMovesPlayed).toBe(0);
  });
});
