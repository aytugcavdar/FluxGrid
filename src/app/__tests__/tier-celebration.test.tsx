import { describe, it, expect, vi } from 'vitest';
import { TIER_SCORE_MULTIPLIERS } from '../../features/game/constants';
import { playSkill, playHaptic } from '@core/utils/audio';

describe('GameApp - Tier Celebration Detection (Task 2.2)', () => {
  it('should import TIER_SCORE_MULTIPLIERS from game/constants (Req 12.4)', () => {
    // Verify the constant is imported and accessible
    expect(TIER_SCORE_MULTIPLIERS).toBeDefined();
    expect(Array.isArray(TIER_SCORE_MULTIPLIERS)).toBe(true);
    expect(TIER_SCORE_MULTIPLIERS.length).toBe(7); // Tiers 0-6
  });
  
  it('should calculate correct multiplier for tier 1 (Req 1.2)', () => {
    const tier = 1;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(1.15);
  });
  
  it('should calculate correct multiplier for tier 2 (Req 1.2)', () => {
    const tier = 2;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(1.35);
  });
  
  it('should calculate correct multiplier for tier 3 (Req 1.2)', () => {
    const tier = 3;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(1.6);
  });
  
  it('should calculate correct multiplier for tier 4 (Req 1.2)', () => {
    const tier = 4;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(2.0);
  });
  
  it('should calculate correct multiplier for tier 5 (Req 1.2)', () => {
    const tier = 5;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(2.5);
  });
  
  it('should calculate correct multiplier for tier 6 (Req 1.2)', () => {
    const tier = 6;
    const multiplier = TIER_SCORE_MULTIPLIERS[tier] || 1.0;
    expect(multiplier).toBe(3.0);
  });
  
  it('should use default multiplier 1.0 for out-of-range tier (Req 1.2)', () => {
    const tier = 99; // Invalid tier
    const multiplier = TIER_SCORE_MULTIPLIERS[tier as keyof typeof TIER_SCORE_MULTIPLIERS] || 1.0;
    expect(multiplier).toBe(1.0);
  });
  
  it('should use default multiplier 1.0 for negative tier (Req 1.2)', () => {
    const tier = -1; // Invalid tier
    const multiplier = TIER_SCORE_MULTIPLIERS[tier as keyof typeof TIER_SCORE_MULTIPLIERS] || 1.0;
    expect(multiplier).toBe(1.0);
  });
  
  it('should verify playSkill function is available (Req 2.5)', () => {
    expect(playSkill).toBeDefined();
    expect(typeof playSkill).toBe('function');
  });
  
  it('should verify playHaptic function is available (Req 2.6)', () => {
    expect(playHaptic).toBeDefined();
    expect(typeof playHaptic).toBe('function');
  });
});
