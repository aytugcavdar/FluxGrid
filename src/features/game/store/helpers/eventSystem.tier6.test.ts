import { describe, expect, it, vi } from 'vitest';
import { GameMode } from '@shared/types';
import { checkTierEvent } from './eventSystem';

describe('Tier 6 fixed-grid rule', () => {
  it('starts no event and leaves only the fixed-grid mechanic active', () => {
    const get = () => ({ gameMode: GameMode.ENDLESS }) as any;
    const result = checkTierEvent(260000, 5, get, vi.fn());

    expect(result).toMatchObject({
      difficultyTier: 6,
      activeEvent: null,
      eventMovesRemaining: 0,
    });
  });
});
