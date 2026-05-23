import { describe, it, expect } from 'vitest';
import { checkTimedMilestones } from '@features/game/store/helpers/progressionSystem';

describe('progressionSystem', () => {
  describe('checkTimedMilestones', () => {
    it('should return null when no milestone is reached', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(5000, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should return first milestone at 10k score', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(10000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    it('should return second milestone at 25k score', () => {
      const reachedMilestones = new Set<string>(['timed_10k']);
      const result = checkTimedMilestones(25000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_25k', label: 'Çeyrek Yol! 🔥' });
    });

    it('should return third milestone at 50k score', () => {
      const reachedMilestones = new Set<string>(['timed_10k', 'timed_25k']);
      const result = checkTimedMilestones(50000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_50k', label: 'Yarı Yol! ⚡' });
    });

    it('should return fourth milestone at 75k score', () => {
      const reachedMilestones = new Set<string>(['timed_10k', 'timed_25k', 'timed_50k']);
      const result = checkTimedMilestones(75000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_75k', label: 'Efsane Bölge! 💎' });
    });

    it('should return fifth milestone at 100k score', () => {
      const reachedMilestones = new Set<string>(['timed_10k', 'timed_25k', 'timed_50k', 'timed_75k']);
      const result = checkTimedMilestones(100000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_100k', label: '100K Kulübü! 👑' });
    });

    it('should not return same milestone twice', () => {
      const reachedMilestones = new Set<string>(['timed_10k']);
      const result = checkTimedMilestones(10000, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should return first unreached milestone when score exceeds multiple thresholds', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(30000, reachedMilestones);
      
      // Should return 10k milestone first, even though score is 30k
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    it('should return correct milestone when some are already reached', () => {
      const reachedMilestones = new Set<string>(['timed_10k']);
      const result = checkTimedMilestones(30000, reachedMilestones);
      
      // Should return 25k milestone since 10k is already reached
      expect(result).toEqual({ id: 'timed_25k', label: 'Çeyrek Yol! 🔥' });
    });

    it('should return null when all milestones are reached', () => {
      const reachedMilestones = new Set<string>([
        'timed_10k',
        'timed_25k',
        'timed_50k',
        'timed_75k',
        'timed_100k',
      ]);
      const result = checkTimedMilestones(150000, reachedMilestones);
      
      expect(result).toBeNull();
    });

    // Input validation tests
    it('should handle negative score gracefully', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(-1000, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should handle NaN score gracefully', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(NaN, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should handle Infinity score gracefully', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(Infinity, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should handle invalid reachedMilestones (not a Set)', () => {
      // @ts-expect-error Testing invalid input
      const result = checkTimedMilestones(10000, null);
      
      // Should still work by creating a new Set internally
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    it('should handle invalid reachedMilestones (array instead of Set)', () => {
      // @ts-expect-error Testing invalid input
      const result = checkTimedMilestones(10000, ['timed_10k']);
      
      // Should still work by creating a new Set internally
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    // Edge case tests
    it('should return milestone at exact threshold', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(10000, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    it('should return milestone just above threshold', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(10001, reachedMilestones);
      
      expect(result).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
    });

    it('should not return milestone just below threshold', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(9999, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should handle score of 0', () => {
      const reachedMilestones = new Set<string>();
      const result = checkTimedMilestones(0, reachedMilestones);
      
      expect(result).toBeNull();
    });

    it('should handle very high scores beyond all milestones', () => {
      const reachedMilestones = new Set<string>([
        'timed_10k',
        'timed_25k',
        'timed_50k',
        'timed_75k',
        'timed_100k',
      ]);
      const result = checkTimedMilestones(1000000, reachedMilestones);
      
      expect(result).toBeNull();
    });

    // Idempotency test (Requirement 8.6)
    it('should maintain idempotency - same milestone not returned twice', () => {
      const reachedMilestones = new Set<string>();
      
      // First call at 10k
      const result1 = checkTimedMilestones(10000, reachedMilestones);
      expect(result1).toEqual({ id: 'timed_10k', label: 'İlk 10K! 🎯' });
      
      // Add to reached set
      if (result1) {
        reachedMilestones.add(result1.id);
      }
      
      // Second call at same score
      const result2 = checkTimedMilestones(10000, reachedMilestones);
      expect(result2).toBeNull();
      
      // Third call at higher score
      const result3 = checkTimedMilestones(15000, reachedMilestones);
      expect(result3).toBeNull(); // Still null because next milestone is at 25k
    });

    // Sequential milestone progression test
    it('should return milestones in correct order as score increases', () => {
      const reachedMilestones = new Set<string>();
      
      // Score 10k
      let result = checkTimedMilestones(10000, reachedMilestones);
      expect(result?.id).toBe('timed_10k');
      if (result) reachedMilestones.add(result.id);
      
      // Score 25k
      result = checkTimedMilestones(25000, reachedMilestones);
      expect(result?.id).toBe('timed_25k');
      if (result) reachedMilestones.add(result.id);
      
      // Score 50k
      result = checkTimedMilestones(50000, reachedMilestones);
      expect(result?.id).toBe('timed_50k');
      if (result) reachedMilestones.add(result.id);
      
      // Score 75k
      result = checkTimedMilestones(75000, reachedMilestones);
      expect(result?.id).toBe('timed_75k');
      if (result) reachedMilestones.add(result.id);
      
      // Score 100k
      result = checkTimedMilestones(100000, reachedMilestones);
      expect(result?.id).toBe('timed_100k');
      if (result) reachedMilestones.add(result.id);
      
      // No more milestones
      result = checkTimedMilestones(150000, reachedMilestones);
      expect(result).toBeNull();
    });
  });
});
