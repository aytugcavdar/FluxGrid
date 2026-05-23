import { describe, expect, it } from 'vitest';
import { calculateScore } from '@features/game/store/helpers/scoreCalculator';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';

describe('scoreCalculator', () => {
  const miniEventState = createMiniEventState();

  it('calculates base score without multipliers', () => {
    const result = calculateScore(100, false, 1, 0, null, miniEventState, 0, 1);

    expect(result.score).toBe(100);
    expect(result.breakdown).toEqual({
      tier: 1,
      event: 1,
      miniEvents: [],
      total: 1,
    });
  });

  it('applies color bonus', () => {
    const result = calculateScore(100, true, 1, 0, null, miniEventState, 0, 1);

    expect(result.score).toBe(150);
    expect(result.breakdown.total).toBe(1.5);
  });

  it('ignores deprecated external multiplier argument', () => {
    const result = calculateScore(100, false, 5, 0, null, miniEventState, 0, 1);

    expect(result.score).toBe(100);
    expect(result.breakdown.total).toBe(1);
  });

  it('applies tier and event multipliers', () => {
    const result = calculateScore(100, false, 1, 2, 'QUAKE', miniEventState, 0, 1);

    expect(result.score).toBe(Math.floor(100 * 1.5 * 1.3));
    expect(result.breakdown.tier).toBe(1.5);
    expect(result.breakdown.event).toBe(1.3);
  });

  it('applies passive and streak multipliers', () => {
    const result = calculateScore(100, false, 1, 0, null, miniEventState, 0, 1.25, 2);

    expect(result.score).toBe(250);
    expect(result.breakdown.total).toBe(2.5);
  });

  it('keeps mini-event breakdown empty after mini-events were removed', () => {
    miniEventState.activeEvents.add('SCORE_RUSH');

    const result = calculateScore(100, false, 1, 0, null, miniEventState, 2, 1);

    expect(result.score).toBe(100);
    expect(result.breakdown.miniEvents).toEqual([]);
  });
});
