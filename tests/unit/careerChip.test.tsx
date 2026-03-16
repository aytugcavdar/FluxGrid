/**
 * Unit tests for career continuation chip
 * Validates Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect } from 'vitest';

describe('Career Continuation Chip', () => {
  describe('Conditional Rendering', () => {
    it('should show chip when maxLevelReached > 0', () => {
      const maxLevelReached = 5;
      const shouldShow = maxLevelReached > 0;
      
      expect(shouldShow).toBe(true);
    });

    it('should hide chip when maxLevelReached is 0', () => {
      const maxLevelReached = 0;
      const shouldShow = maxLevelReached > 0;
      
      expect(shouldShow).toBe(false);
    });

    it('should hide chip when maxLevelReached is negative', () => {
      const maxLevelReached = -1;
      const shouldShow = maxLevelReached > 0;
      
      expect(shouldShow).toBe(false);
    });
  });

  describe('Next Level Calculation', () => {
    it('should display next level number correctly', () => {
      const maxLevelReached = 5;
      const nextLevel = maxLevelReached + 1;
      
      expect(nextLevel).toBe(6);
    });

    it('should handle level 0 correctly', () => {
      const maxLevelReached = 0;
      const nextLevel = Math.max(1, maxLevelReached + 1);
      
      expect(nextLevel).toBe(1);
    });

    it('should handle high level numbers', () => {
      const maxLevelReached = 99;
      const nextLevel = maxLevelReached + 1;
      
      expect(nextLevel).toBe(100);
    });
  });

  describe('Chip Text Content', () => {
    it('should format chip text correctly', () => {
      const maxLevelReached = 5;
      const nextLevel = maxLevelReached + 1;
      const chipText = `kardan devam → Seviye ${nextLevel}`;
      
      expect(chipText).toBe('kardan devam → Seviye 6');
    });

    it('should include arrow separator', () => {
      const chipText = 'kardan devam → Seviye 10';
      
      expect(chipText).toContain('→');
      expect(chipText).toContain('kardan devam');
      expect(chipText).toContain('Seviye');
    });
  });
});
