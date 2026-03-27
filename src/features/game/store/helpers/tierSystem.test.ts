import { describe, it, expect } from 'vitest';
import { calculateTier, getTierScoreMultiplier, getTierFluxMultiplier, migrateTierData } from './tierSystem';

describe('tierSystem', () => {
  describe('calculateTier', () => {
    it('should return tier 0 for score 0', () => {
      expect(calculateTier(0)).toBe(0);
    });

    it('should return tier 0 for negative scores', () => {
      expect(calculateTier(-100)).toBe(0);
    });

    it('should return tier 1 for score 1500', () => {
      expect(calculateTier(1500)).toBe(1);
    });

    it('should return tier 2 for score 4000', () => {
      expect(calculateTier(4000)).toBe(2);
    });

    it('should return tier 6 for score 60000', () => {
      expect(calculateTier(60000)).toBe(6);
    });

    it('should return correct tier for scores between thresholds', () => {
      expect(calculateTier(2000)).toBe(1);
      expect(calculateTier(5000)).toBe(2);
      expect(calculateTier(10000)).toBe(3);
    });
  });

  describe('getTierScoreMultiplier', () => {
    it('should return 1.0 for tier 0', () => {
      expect(getTierScoreMultiplier(0)).toBe(1.0);
    });

    it('should return 1.15 for tier 1', () => {
      expect(getTierScoreMultiplier(1)).toBe(1.15);
    });

    it('should return 3.0 for tier 6', () => {
      expect(getTierScoreMultiplier(6)).toBe(3.0);
    });

    it('should return 1.0 for invalid negative tier', () => {
      expect(getTierScoreMultiplier(-1)).toBe(1.0);
    });

    it('should return 1.0 for invalid tier above 6', () => {
      expect(getTierScoreMultiplier(7)).toBe(1.0);
    });
  });

  describe('getTierFluxMultiplier', () => {
    it('should return 1.0 for tier 0', () => {
      expect(getTierFluxMultiplier(0)).toBe(1.0);
    });

    it('should return 1.1 for tier 1', () => {
      expect(getTierFluxMultiplier(1)).toBe(1.1);
    });

    it('should return 2.0 for tier 6', () => {
      expect(getTierFluxMultiplier(6)).toBe(2.0);
    });

    it('should return 1.0 for invalid negative tier', () => {
      expect(getTierFluxMultiplier(-1)).toBe(1.0);
    });

    it('should return 1.0 for invalid tier above 6', () => {
      expect(getTierFluxMultiplier(7)).toBe(1.0);
    });
  });

  describe('migrateTierData', () => {
    it('should recalculate tier based on score', () => {
      expect(migrateTierData(5, 2000)).toBe(1);
    });

    it('should ignore old tier value', () => {
      expect(migrateTierData(0, 10000)).toBe(3);
    });

    it('should handle tier 0 migration', () => {
      expect(migrateTierData(0, 0)).toBe(0);
    });

    it('should handle high tier migration', () => {
      expect(migrateTierData(3, 60000)).toBe(6);
    });
  });
});
