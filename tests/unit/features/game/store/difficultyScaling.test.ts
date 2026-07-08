import { describe, expect, it } from 'vitest';
import { getTimedClearBonusSeconds } from '../../../../../src/features/game/store/helpers/difficultyScaling';

describe('getTimedClearBonusSeconds', () => {
  it('returns whole-second rewards by line clear count', () => {
    expect(getTimedClearBonusSeconds(1)).toBe(1);
    expect(getTimedClearBonusSeconds(2)).toBe(2);
    expect(getTimedClearBonusSeconds(3)).toBe(3);
    expect(getTimedClearBonusSeconds(4)).toBe(4);
    expect(getTimedClearBonusSeconds(5)).toBe(4);
  });

  it('adds perfect clear and combo rush bonuses', () => {
    expect(getTimedClearBonusSeconds(2, true, false)).toBe(4);
    expect(getTimedClearBonusSeconds(2, false, true)).toBe(2);
    expect(getTimedClearBonusSeconds(2, true, true)).toBe(4);
  });

  it('does not reward invalid clear counts', () => {
    expect(getTimedClearBonusSeconds(0)).toBe(0);
    expect(getTimedClearBonusSeconds(-1)).toBe(0);
    expect(getTimedClearBonusSeconds(Number.NaN)).toBe(0);
  });
});
