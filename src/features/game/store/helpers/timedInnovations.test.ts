import { describe, expect, it } from 'vitest';
import {
  getHitTimedTargets,
  getNextTimedMomentum,
  getTimedTargetReward,
  refillTimedTargets,
  resolveTimedTimeReward,
} from './timedInnovations';

describe('Timed innovations', () => {
  it('creates three targets on distinct rows and columns', () => {
    const targets = refillTimedTargets([], 3, 12);

    expect(targets).toHaveLength(3);
    expect(new Set(targets.map(target => target.x)).size).toBe(3);
    expect(new Set(targets.map(target => target.y)).size).toBe(3);
  });

  it('keeps surviving targets and refills cleared ones', () => {
    const existing = [{ x: 2, y: 3 }];
    const targets = refillTimedTargets(existing, 3, 8);

    expect(targets).toHaveLength(3);
    expect(targets).toContainEqual(existing[0]);
  });

  it('finds targets crossed by cleared rows or columns', () => {
    const targets = [{ x: 1, y: 2 }, { x: 4, y: 5 }, { x: 7, y: 8 }];

    expect(getHitTimedTargets(targets, [2], [4])).toEqual([targets[0], targets[1]]);
  });

  it('rewards one, two and three targets distinctly', () => {
    expect(getTimedTargetReward(1)).toEqual({ seconds: 1, scoreMultiplier: 1 });
    expect(getTimedTargetReward(2)).toEqual({ seconds: 3, scoreMultiplier: 1 });
    expect(getTimedTargetReward(3)).toEqual({ seconds: 3, scoreMultiplier: 2 });
  });

  it('reserves five bonus seconds for the last chance', () => {
    expect(resolveTimedTimeReward(6, 38, false, true, false)).toEqual({
      grantedSeconds: 0,
      convertedScore: 720,
      totalBonusSeconds: 38,
    });
    expect(resolveTimedTimeReward(5, 40, true, false, true)).toEqual({
      grantedSeconds: 0,
      convertedScore: 600,
      totalBonusSeconds: 40,
    });
  });

  it('converts Final Rush time rewards into score', () => {
    expect(resolveTimedTimeReward(4, 25, true, true, false)).toEqual({
      grantedSeconds: 0,
      convertedScore: 480,
      totalBonusSeconds: 25,
    });
  });

  it('fills momentum with quick clears and triggers a freeze at maximum', () => {
    const first = getNextTimedMomentum(0, 1, null, 1_000);
    const second = getNextTimedMomentum(first.momentum, 1, first.lastClearAt, 3_000);
    const third = getNextTimedMomentum(second.momentum, 1, second.lastClearAt, 5_000);

    expect(first.momentum).toBe(30);
    expect(second.momentum).toBe(70);
    expect(third).toEqual({ momentum: 0, lastClearAt: 5_000, freezeTriggered: true });
  });

  it('keeps momentum after a move without a clear', () => {
    expect(getNextTimedMomentum(35, 0, 1_000, 2_000).momentum).toBe(35);
  });
});
