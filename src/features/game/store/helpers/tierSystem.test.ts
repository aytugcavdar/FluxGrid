import { describe, it, expect } from 'vitest';
import { calculateEndlessLoop, calculateTier, getTierScoreMultiplier, migrateTierData } from './tierSystem';

describe('tierSystem', () => {
  describe('calculateTier', () => {
    it('should return tier 0 for score 0', () => {
      expect(calculateTier(0)).toBe(0);
    });

    it('should return tier 0 for negative scores', () => {
      expect(calculateTier(-100)).toBe(0);
    });

    it('should keep early score in tier 0', () => {
      expect(calculateTier(4999)).toBe(0);
    });

    it('should return tier 1 for score 5000', () => {
      expect(calculateTier(5000)).toBe(1);
    });

    it('should return tier 6 for score 180000', () => {
      expect(calculateTier(180000)).toBe(6);
    });

    it('should return correct tier for scores between thresholds', () => {
      expect(calculateTier(4999)).toBe(0);
      expect(calculateTier(19999)).toBe(1);
      expect(calculateTier(90000)).toBe(4);
    });
  });

  describe('getTierScoreMultiplier', () => {
    it('should return 1.0 for tier 0', () => {
      expect(getTierScoreMultiplier(0)).toBe(1.0);
    });

    it('should return 1.2 for tier 1', () => {
      expect(getTierScoreMultiplier(1)).toBe(1.2);
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

  describe('calculateEndlessLoop', () => {
    it('should return 0 before loop thresholds', () => {
      expect(calculateEndlessLoop(180000)).toBe(0);
      expect(calculateEndlessLoop(259999)).toBe(0);
    });

    it('should advance loops at endgame thresholds', () => {
      expect(calculateEndlessLoop(260000)).toBe(1);
      expect(calculateEndlessLoop(380000)).toBe(2);
      expect(calculateEndlessLoop(550000)).toBe(3);
      expect(calculateEndlessLoop(750000)).toBe(4);
    });
  });

  describe('migrateTierData', () => {
    it('should recalculate tier based on score', () => {
      expect(migrateTierData(5, 3000)).toBe(0);
    });

    it('should ignore old tier value', () => {
      expect(migrateTierData(0, 20000)).toBe(2);
    });

    it('should handle tier 0 migration', () => {
      expect(migrateTierData(0, 0)).toBe(0);
    });

    it('should handle high tier migration', () => {
      expect(migrateTierData(3, 180000)).toBe(6);
    });
  });
});
