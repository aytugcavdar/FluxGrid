import { describe, expect, it } from 'vitest';
import {
  deserializeGameState,
  serializeGameState,
} from '@features/game/store/helpers/localStorage';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';

describe('localStorage serialization integration', () => {
  it('round-trips current game save fields through JSON', () => {
    const miniEventState = createMiniEventState();
    miniEventState.activeEvents.add('LEGACY_EVENT');
    (miniEventState.moveCounters as Record<string, number>).LEGACY_EVENT = 7;
    (miniEventState.lastActivation as Record<string, number>).LEGACY_EVENT = 50;

    const saveState = {
      score: 15000,
      difficultyTier: 3,
      activeEvent: 'QUAKE' as const,
      eventMovesRemaining: 8,
      totalMovesPlayed: 100,
      miniEventState,
    };

    const serialized = serializeGameState(saveState);
    const json = JSON.stringify(serialized);
    const restored = deserializeGameState(JSON.parse(json));

    expect(restored.score).toBe(saveState.score);
    expect(restored.difficultyTier).toBe(saveState.difficultyTier);
    expect(restored.activeEvent).toBe(saveState.activeEvent);
    expect(restored.eventMovesRemaining).toBe(saveState.eventMovesRemaining);
    expect(restored.totalMovesPlayed).toBe(saveState.totalMovesPlayed);
    expect(restored.miniEventState.activeEvents.has('LEGACY_EVENT')).toBe(true);
    expect((restored.miniEventState.moveCounters as Record<string, number>).LEGACY_EVENT).toBe(7);
    expect((restored.miniEventState.lastActivation as Record<string, number>).LEGACY_EVENT).toBe(50);
  });

  it('loads older saves without mini-event or move-count fields', () => {
    const restored = deserializeGameState({
      score: 3000,
      difficultyTier: 1,
    });

    expect(restored.score).toBe(3000);
    expect(restored.difficultyTier).toBe(1);
    expect(restored.totalMovesPlayed).toBe(0);
    expect(restored.miniEventState.activeEvents.size).toBe(0);
  });
});
