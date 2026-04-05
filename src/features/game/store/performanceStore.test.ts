import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePerformanceStore } from './performanceStore';

describe('performanceStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePerformanceStore.getState().clearMetrics();
    usePerformanceStore.getState().setDebugMode(false);
  });

  describe('recordFPS', () => {
    it('should record FPS and update metrics', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPS(60);
      
      // Get fresh state after update
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.currentFPS).toBe(60);
      expect(metrics.fpsHistory.length).toBe(1);
      expect(metrics.fpsHistory[0].fps).toBe(60);
    });

    it('should calculate average FPS correctly', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPS(60);
      store.recordFPS(30);
      store.recordFPS(45);
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.averageFPS).toBe(45); // (60 + 30 + 45) / 3
    });

    it('should track min and max FPS', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPS(60);
      store.recordFPS(30);
      store.recordFPS(45);
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.minFPS).toBe(30);
      expect(metrics.maxFPS).toBe(60);
    });

    it('should keep only last 60 seconds of history', () => {
      const store = usePerformanceStore.getState();
      
      // Mock Date.now to control timestamps
      const now = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 70000) // 70 seconds ago
        .mockReturnValueOnce(now - 30000) // 30 seconds ago
        .mockReturnValueOnce(now); // now
      
      store.recordFPS(60);
      store.recordFPS(30);
      store.recordFPS(45);
      
      const metrics = usePerformanceStore.getState().metrics;
      // First entry should be filtered out (older than 60 seconds)
      expect(metrics.fpsHistory.length).toBe(2);
    });

    it('should calculate battery savings correctly', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPS(30);
      
      const metrics = usePerformanceStore.getState().metrics;
      // Battery savings = ((60 - 30) / 60) * 100 = 50%
      expect(metrics.estimatedBatterySavings).toBe(50);
    });
  });

  describe('recordFPSChange', () => {
    it('should record FPS changes with reason', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPSChange(60, 30, 'battery');
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.fpsChanges.length).toBe(1);
      expect(metrics.fpsChanges[0].oldFPS).toBe(60);
      expect(metrics.fpsChanges[0].newFPS).toBe(30);
      expect(metrics.fpsChanges[0].reason).toBe('battery');
    });

    it('should log to console when debug mode is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const store = usePerformanceStore.getState();
      
      store.setDebugMode(true);
      store.recordFPSChange(60, 30, 'battery');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PerformanceMetrics] FPS changed: 60 -> 30 (battery)'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('recordBackgroundPause', () => {
    it('should accumulate pause duration', () => {
      const store = usePerformanceStore.getState();
      
      store.recordBackgroundPause(1000);
      store.recordBackgroundPause(2000);
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.backgroundPauseDuration).toBe(3000);
      expect(metrics.backgroundPauseCount).toBe(2);
    });
  });

  describe('recordTouchResponse', () => {
    it('should record touch response times', () => {
      const store = usePerformanceStore.getState();
      
      store.recordTouchResponse(10);
      store.recordTouchResponse(20);
      store.recordTouchResponse(15);
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.touchResponseTimes.length).toBe(3);
      expect(metrics.averageTouchResponse).toBe(15); // (10 + 20 + 15) / 3
      expect(metrics.minTouchResponse).toBe(10);
      expect(metrics.maxTouchResponse).toBe(20);
    });

    it('should keep only last 100 touch responses', () => {
      const store = usePerformanceStore.getState();
      
      // Record 105 touch responses
      for (let i = 0; i < 105; i++) {
        store.recordTouchResponse(10);
      }
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.touchResponseTimes.length).toBe(100);
    });
  });

  describe('setDebugMode', () => {
    it('should enable debug mode', () => {
      const store = usePerformanceStore.getState();
      
      store.setDebugMode(true);
      
      expect(usePerformanceStore.getState().debugMode).toBe(true);
    });

    it('should disable debug mode', () => {
      const store = usePerformanceStore.getState();
      
      store.setDebugMode(true);
      store.setDebugMode(false);
      
      expect(usePerformanceStore.getState().debugMode).toBe(false);
    });
  });

  describe('exportMetrics', () => {
    it('should export metrics as JSON string', () => {
      const store = usePerformanceStore.getState();
      
      store.recordFPS(60);
      store.recordFPSChange(60, 30, 'battery');
      
      const exported = store.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed.currentFPS).toBe(60);
      expect(parsed.fpsChanges.length).toBe(1);
    });

    it('should export valid JSON', () => {
      const store = usePerformanceStore.getState();
      
      const exported = store.exportMetrics();
      
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('clearMetrics', () => {
    it('should reset all metrics to initial state', () => {
      const store = usePerformanceStore.getState();
      
      // Add some data
      store.recordFPS(30);
      store.recordFPSChange(60, 30, 'battery');
      store.recordBackgroundPause(1000);
      store.recordTouchResponse(10);
      
      // Clear metrics
      store.clearMetrics();
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.currentFPS).toBe(60);
      expect(metrics.fpsHistory.length).toBe(0);
      expect(metrics.fpsChanges.length).toBe(0);
      expect(metrics.backgroundPauseDuration).toBe(0);
      expect(metrics.touchResponseTimes.length).toBe(0);
    });
  });

  describe('logError', () => {
    it('should log errors to metrics', () => {
      const store = usePerformanceStore.getState();
      const error = new Error('Test error');
      
      store.logError(error);
      
      const metrics = usePerformanceStore.getState().metrics;
      expect(metrics.errors.length).toBe(1);
      expect(metrics.errors[0].error).toBe(error);
    });

    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const store = usePerformanceStore.getState();
      const error = new Error('Test error');
      
      store.logError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PerformanceMetrics] Error logged:',
        error
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('round-trip properties', () => {
    it('should preserve metrics through export and import', () => {
      const store = usePerformanceStore.getState();
      
      // Record some data
      store.recordFPS(45);
      store.recordFPSChange(60, 45, 'battery');
      store.recordBackgroundPause(1500);
      store.recordTouchResponse(12);
      
      // Export and parse
      const exported = store.exportMetrics();
      const parsed = JSON.parse(exported);
      
      // Verify all data is preserved
      expect(parsed.currentFPS).toBe(45);
      expect(parsed.fpsChanges[0].oldFPS).toBe(60);
      expect(parsed.fpsChanges[0].newFPS).toBe(45);
      expect(parsed.fpsChanges[0].reason).toBe('battery');
      expect(parsed.backgroundPauseDuration).toBe(1500);
      expect(parsed.touchResponseTimes[0]).toBe(12);
    });
  });
});
