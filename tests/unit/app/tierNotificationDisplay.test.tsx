import { describe, it, expect } from 'vitest';
import { TIER_SCORE_MULTIPLIERS } from '../../../src/features/game/constants';

describe('Tier Notification Display', () => {
  it('should have correct multipliers for each tier', () => {
    // Verify the multipliers match the spec
    expect(TIER_SCORE_MULTIPLIERS[0]).toBe(1.0);
    expect(TIER_SCORE_MULTIPLIERS[1]).toBe(1.2);
    expect(TIER_SCORE_MULTIPLIERS[2]).toBe(1.5);
    expect(TIER_SCORE_MULTIPLIERS[3]).toBe(1.8);
    expect(TIER_SCORE_MULTIPLIERS[4]).toBe(2.2);
    expect(TIER_SCORE_MULTIPLIERS[5]).toBe(2.6);
    expect(TIER_SCORE_MULTIPLIERS[6]).toBe(3.0);
  });

  it('should format multiplier correctly', () => {
    // Test multiplier formatting
    const tier1Multiplier = TIER_SCORE_MULTIPLIERS[1];
    const formatted = tier1Multiplier.toFixed(2);
    expect(formatted).toBe('1.20');
    
    const tier3Multiplier = TIER_SCORE_MULTIPLIERS[3];
    const formatted3 = tier3Multiplier.toFixed(2);
    expect(formatted3).toBe('1.80');
  });

  it('should have 7 tiers (0-6)', () => {
    expect(TIER_SCORE_MULTIPLIERS.length).toBe(7);
  });
});
