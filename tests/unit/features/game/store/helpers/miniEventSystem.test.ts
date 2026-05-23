import { describe, expect, it } from 'vitest';
import {
  checkMiniEvents,
  createMiniEventState,
  getMiniEventMultiplier,
  isPieceBlessingActive,
  shouldPreventComboBreak,
  tickMiniEvents,
} from '@features/game/store/helpers/miniEventSystem';

describe('miniEventSystem compatibility stubs', () => {
  it('creates an inert mini-event state', () => {
    const state = createMiniEventState();

    expect(state.activeEvents).toBeInstanceOf(Set);
    expect(state.activeEvents.size).toBe(0);
    expect(state.moveCounters).toEqual({});
    expect(state.lastActivation).toEqual({});
    expect(state.comboShieldActive).toBe(false);
  });

  it('does not activate or tick mini-events after removal', () => {
    const state = createMiniEventState();

    expect(checkMiniEvents(100, state, 3)).toBe(state);
    expect(tickMiniEvents(state, 2, true)).toBe(state);
  });

  it('returns neutral multipliers and disabled guards', () => {
    const state = createMiniEventState();

    expect(getMiniEventMultiplier(state.activeEvents, false, 2)).toBe(1);
    expect(getMiniEventMultiplier(state.activeEvents, true, 2)).toBe(1);
    expect(shouldPreventComboBreak(state, 0)).toBe(false);
    expect(isPieceBlessingActive(state)).toBe(false);
  });
});
