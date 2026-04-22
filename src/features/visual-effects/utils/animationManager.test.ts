import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationManager, animationManager } from './animationManager';

describe('AnimationManager', () => {
  let manager: AnimationManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new AnimationManager();
  });

  describe('canAddAnimation', () => {
    it('should return true when no animations are active', () => {
      expect(manager.canAddAnimation()).toBe(true);
    });

    it('should return true when under the limit (4 active)', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.addAnimation('anim3');
      manager.addAnimation('anim4');
      expect(manager.canAddAnimation()).toBe(true);
    });

    it('should return false when at the limit (5 active)', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.addAnimation('anim3');
      manager.addAnimation('anim4');
      manager.addAnimation('anim5');
      expect(manager.canAddAnimation()).toBe(false);
    });

    it('should return false when over the limit would be exceeded', () => {
      for (let i = 0; i < 5; i++) {
        manager.addAnimation(`anim${i}`);
      }
      expect(manager.canAddAnimation()).toBe(false);
    });
  });

  describe('addAnimation', () => {
    it('should add animation and return true when under limit', () => {
      const result = manager.addAnimation('anim1');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should add multiple animations up to the limit', () => {
      for (let i = 0; i < 5; i++) {
        const result = manager.addAnimation(`anim${i}`);
        expect(result).toBe(true);
      }
      expect(manager.getActiveCount()).toBe(5);
    });

    it('should return false when limit is reached', () => {
      // Fill to limit
      for (let i = 0; i < 5; i++) {
        manager.addAnimation(`anim${i}`);
      }
      
      // Try to add one more
      const result = manager.addAnimation('anim6');
      expect(result).toBe(false);
      expect(manager.getActiveCount()).toBe(5);
    });

    it('should not add duplicate animation IDs', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim1');
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle adding animation after removing one', () => {
      // Fill to limit
      for (let i = 0; i < 5; i++) {
        manager.addAnimation(`anim${i}`);
      }
      
      // Remove one
      manager.removeAnimation('anim0');
      
      // Should be able to add again
      const result = manager.addAnimation('anim5');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(5);
    });
  });

  describe('removeAnimation', () => {
    it('should remove an active animation', () => {
      manager.addAnimation('anim1');
      manager.removeAnimation('anim1');
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should handle removing non-existent animation', () => {
      manager.addAnimation('anim1');
      manager.removeAnimation('anim2');
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should allow adding new animation after removal', () => {
      manager.addAnimation('anim1');
      manager.removeAnimation('anim1');
      const result = manager.addAnimation('anim2');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle removing multiple animations', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.addAnimation('anim3');
      
      manager.removeAnimation('anim1');
      manager.removeAnimation('anim2');
      
      expect(manager.getActiveCount()).toBe(1);
    });
  });

  describe('getActiveCount', () => {
    it('should return 0 when no animations are active', () => {
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should return correct count with active animations', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      expect(manager.getActiveCount()).toBe(2);
    });

    it('should update count after removals', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.addAnimation('anim3');
      manager.removeAnimation('anim2');
      expect(manager.getActiveCount()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all active animations', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.addAnimation('anim3');
      
      manager.clearAll();
      
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should allow adding animations after clearAll', () => {
      manager.addAnimation('anim1');
      manager.addAnimation('anim2');
      manager.clearAll();
      
      const result = manager.addAnimation('anim3');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle clearAll when no animations are active', () => {
      manager.clearAll();
      expect(manager.getActiveCount()).toBe(0);
    });
  });

  describe('concurrency limit enforcement', () => {
    it('should enforce max 5 concurrent animations', () => {
      const results = [];
      
      // Try to add 10 animations
      for (let i = 0; i < 10; i++) {
        results.push(manager.addAnimation(`anim${i}`));
      }
      
      // First 5 should succeed
      expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
      
      // Last 5 should fail
      expect(results.slice(5)).toEqual([false, false, false, false, false]);
      
      // Count should be exactly 5
      expect(manager.getActiveCount()).toBe(5);
    });

    it('should maintain limit during add/remove cycles', () => {
      // Add 5 animations
      for (let i = 0; i < 5; i++) {
        manager.addAnimation(`anim${i}`);
      }
      
      // Remove 2
      manager.removeAnimation('anim0');
      manager.removeAnimation('anim1');
      
      // Should be able to add 2 more
      expect(manager.addAnimation('anim5')).toBe(true);
      expect(manager.addAnimation('anim6')).toBe(true);
      
      // Should not be able to add more
      expect(manager.addAnimation('anim7')).toBe(false);
      
      expect(manager.getActiveCount()).toBe(5);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(animationManager).toBeInstanceOf(AnimationManager);
    });

    it('should maintain state across imports', () => {
      animationManager.clearAll(); // Reset state
      animationManager.addAnimation('test1');
      expect(animationManager.getActiveCount()).toBe(1);
      animationManager.clearAll(); // Clean up
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as animation ID', () => {
      const result = manager.addAnimation('');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle special characters in animation ID', () => {
      const result = manager.addAnimation('anim-123_test@special');
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle very long animation IDs', () => {
      const longId = 'a'.repeat(1000);
      const result = manager.addAnimation(longId);
      expect(result).toBe(true);
      expect(manager.getActiveCount()).toBe(1);
    });

    it('should handle rapid add/remove operations', () => {
      for (let i = 0; i < 100; i++) {
        manager.addAnimation(`anim${i}`);
        if (i % 2 === 0) {
          manager.removeAnimation(`anim${i}`);
        }
      }
      
      // Should never exceed limit
      expect(manager.getActiveCount()).toBeLessThanOrEqual(5);
    });
  });
});
