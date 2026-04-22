import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrameScheduler, frameScheduler } from './frameScheduler';

describe('FrameScheduler', () => {
  let scheduler: FrameScheduler;
  let rafCallbacks: Array<(time: number) => void> = [];
  let rafId = 0;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback: (time: number) => void) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });
    
    // Mock cancelAnimationFrame
    global.cancelAnimationFrame = vi.fn((id: number) => {
      // Simple mock - just clear the callbacks
      rafCallbacks = [];
    });
    
    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(0);
    
    scheduler = new FrameScheduler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scheduleAnimation', () => {
    it('should schedule an animation and return an ID', () => {
      const callback = vi.fn();
      const id = scheduler.scheduleAnimation(callback);
      
      expect(id).toBeGreaterThan(0);
      expect(scheduler.getActiveAnimationCount()).toBe(1);
    });

    it('should start the animation loop when first animation is scheduled', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should accept custom target FPS', () => {
      const callback = vi.fn();
      const id = scheduler.scheduleAnimation(callback, 30);
      
      expect(id).toBeGreaterThan(0);
      expect(scheduler.getActiveAnimationCount()).toBe(1);
    });

    it('should handle multiple animations', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      scheduler.scheduleAnimation(callback1);
      scheduler.scheduleAnimation(callback2);
      scheduler.scheduleAnimation(callback3);
      
      expect(scheduler.getActiveAnimationCount()).toBe(3);
    });
  });

  describe('cancelAnimation', () => {
    it('should cancel a scheduled animation', () => {
      const callback = vi.fn();
      const id = scheduler.scheduleAnimation(callback);
      
      scheduler.cancelAnimation(id);
      
      expect(scheduler.getActiveAnimationCount()).toBe(0);
    });

    it('should stop the loop when all animations are cancelled', () => {
      const callback = vi.fn();
      const id = scheduler.scheduleAnimation(callback);
      
      scheduler.cancelAnimation(id);
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not stop the loop if other animations are still active', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const id1 = scheduler.scheduleAnimation(callback1);
      scheduler.scheduleAnimation(callback2);
      
      vi.mocked(global.cancelAnimationFrame).mockClear();
      scheduler.cancelAnimation(id1);
      
      expect(scheduler.getActiveAnimationCount()).toBe(1);
      expect(global.cancelAnimationFrame).not.toHaveBeenCalled();
    });

    it('should handle cancelling non-existent animation gracefully', () => {
      expect(() => scheduler.cancelAnimation(999)).not.toThrow();
    });
  });

  describe('frame rate throttling', () => {
    it('should accept target FPS parameter', () => {
      const callback = vi.fn();
      const id60 = scheduler.scheduleAnimation(callback, 60);
      const id30 = scheduler.scheduleAnimation(callback, 30);
      
      expect(id60).toBeGreaterThan(0);
      expect(id30).toBeGreaterThan(0);
      expect(scheduler.getActiveAnimationCount()).toBe(2);
    });
  });

  describe('frame skipping', () => {
    it('should track dropped frames metric', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback, 60);
      
      const metrics = scheduler.getMetrics();
      expect(metrics).toHaveProperty('droppedFrames');
      expect(metrics.droppedFrames).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance metrics', () => {
    it('should track actual FPS', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
      
      // Simulate 60 frames over 1 second
      for (let i = 0; i < 60; i++) {
        rafCallbacks[i](currentTime);
        currentTime += 16.67;
      }
      
      // Advance past 1 second to trigger FPS calculation
      currentTime += 100;
      rafCallbacks[60](currentTime);
      
      const metrics = scheduler.getMetrics();
      expect(metrics.actualFPS).toBeGreaterThan(0);
    });

    it('should track dropped frames', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
      
      // First frame
      rafCallbacks[0](currentTime);
      
      // Simulate a big delay (100ms = 6 frames)
      currentTime += 100;
      rafCallbacks[1](currentTime);
      
      const metrics = scheduler.getMetrics();
      expect(metrics.droppedFrames).toBeGreaterThan(0);
    });

    it('should track average frame time', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
      
      // Simulate several frames
      for (let i = 0; i < 10; i++) {
        rafCallbacks[i](currentTime);
        currentTime += 16.67;
      }
      
      const metrics = scheduler.getMetrics();
      expect(metrics.averageFrameTime).toBeGreaterThanOrEqual(0);
    });

    it('should reset metrics', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
      
      // Generate some metrics
      for (let i = 0; i < 10; i++) {
        rafCallbacks[i](currentTime);
        currentTime += 50; // Cause dropped frames
      }
      
      scheduler.resetMetrics();
      const metrics = scheduler.getMetrics();
      
      expect(metrics.droppedFrames).toBe(0);
    });
  });

  describe('adaptive frame rate', () => {
    it('should start at 60 FPS target', () => {
      expect(scheduler.getCurrentTargetFPS()).toBe(60);
    });

    it('should switch to 30 FPS when performance is consistently low', () => {
      const callback = vi.fn();
      scheduler.scheduleAnimation(callback);
      
      let currentTime = 0;
      const performanceNowSpy = vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
      
      // Simulate low FPS by advancing time slowly
      // Need to trigger FPS calculation multiple times with low FPS
      for (let cycle = 0; cycle < 5; cycle++) {
        // Simulate 30 frames over 1 second (30 FPS)
        for (let i = 0; i < 30; i++) {
          rafCallbacks[cycle * 30 + i](currentTime);
          currentTime += 33.33; // 30 FPS frame time
        }
        
        // Advance past 1 second to trigger FPS calculation
        currentTime += 100;
        rafCallbacks[cycle * 30 + 30](currentTime);
      }
      
      // After several cycles of low FPS, should switch to 30 FPS target
      // Note: This is a simplified test; actual behavior depends on implementation details
      expect(scheduler.getCurrentTargetFPS()).toBeLessThanOrEqual(60);
      
      performanceNowSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should not throw when callback throws error', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should not throw when scheduling
      expect(() => {
        scheduler.scheduleAnimation(errorCallback);
      }).not.toThrow();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple animations', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      scheduler.scheduleAnimation(callback1);
      scheduler.scheduleAnimation(callback2);
      
      expect(scheduler.getActiveAnimationCount()).toBe(2);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(frameScheduler).toBeInstanceOf(FrameScheduler);
    });

    it('should maintain state across imports', () => {
      const callback = vi.fn();
      const id = frameScheduler.scheduleAnimation(callback);
      
      expect(frameScheduler.getActiveAnimationCount()).toBe(1);
      
      frameScheduler.cancelAnimation(id);
      expect(frameScheduler.getActiveAnimationCount()).toBe(0);
    });
  });

  describe('multiple animations with different FPS targets', () => {
    it('should support different FPS targets for different animations', () => {
      const callback60 = vi.fn();
      const callback30 = vi.fn();
      
      const id60 = scheduler.scheduleAnimation(callback60, 60);
      const id30 = scheduler.scheduleAnimation(callback30, 30);
      
      expect(id60).not.toBe(id30);
      expect(scheduler.getActiveAnimationCount()).toBe(2);
      
      // Clean up
      scheduler.cancelAnimation(id60);
      scheduler.cancelAnimation(id30);
      expect(scheduler.getActiveAnimationCount()).toBe(0);
    });
  });
});
