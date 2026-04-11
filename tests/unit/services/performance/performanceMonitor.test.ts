import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor } from '@services/performance/performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor.stop();
    vi.useRealTimers();
  });

  describe('FPS Tracking', () => {
    it('should start FPS tracking', () => {
      monitor.startFPSTracking();
      
      expect(monitor.isTracking()).toBe(true);
    });

    it('should calculate FPS', async () => {
      monitor.startFPSTracking();
      
      // Simulate 60 frames in 1 second
      for (let i = 0; i < 60; i++) {
        monitor.recordFrame();
        vi.advanceTimersByTime(16.67); // ~60 FPS
      }
      
      const fps = monitor.getCurrentFPS();
      expect(fps).toBeGreaterThan(50);
      expect(fps).toBeLessThanOrEqual(60);
    });

    it('should detect low FPS', async () => {
      monitor.startFPSTracking();
      
      // Simulate 20 frames in 1 second (low FPS)
      for (let i = 0; i < 20; i++) {
        monitor.recordFrame();
        vi.advanceTimersByTime(50); // ~20 FPS
      }
      
      const fps = monitor.getCurrentFPS();
      expect(fps).toBeLessThan(30);
    });

    it('should get average FPS', async () => {
      monitor.startFPSTracking();
      
      // Simulate varying FPS
      for (let i = 0; i < 100; i++) {
        monitor.recordFrame();
        vi.advanceTimersByTime(16.67 + Math.random() * 10);
      }
      
      const avgFPS = monitor.getAverageFPS();
      expect(avgFPS).toBeGreaterThan(0);
      expect(avgFPS).toBeLessThanOrEqual(60);
    });
  });

  describe('Memory Tracking', () => {
    it('should track memory usage', () => {
      const memory = monitor.getMemoryUsage();
      
      expect(memory).toBeDefined();
      expect(memory.usedJSHeapSize).toBeGreaterThanOrEqual(0);
      expect(memory.totalJSHeapSize).toBeGreaterThan(0);
      expect(memory.jsHeapSizeLimit).toBeGreaterThan(0);
    });

    it('should calculate memory percentage', () => {
      const percentage = monitor.getMemoryPercentage();
      
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should detect high memory usage', () => {
      // Mock high memory usage
      const mockPerformance = {
        memory: {
          usedJSHeapSize: 900 * 1024 * 1024, // 900MB
          totalJSHeapSize: 1000 * 1024 * 1024, // 1GB
          jsHeapSizeLimit: 1000 * 1024 * 1024,
        },
      };
      
      vi.stubGlobal('performance', mockPerformance);
      
      const percentage = monitor.getMemoryPercentage();
      expect(percentage).toBeGreaterThan(80);
    });
  });

  describe('Load Time Tracking', () => {
    it('should track page load time', () => {
      const loadTime = monitor.getPageLoadTime();
      
      expect(loadTime).toBeGreaterThanOrEqual(0);
    });

    it('should track resource load times', () => {
      const resources = monitor.getResourceLoadTimes();
      
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should track time to interactive', () => {
      const tti = monitor.getTimeToInteractive();
      
      expect(tti).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should get all metrics', () => {
      monitor.startFPSTracking();
      
      const metrics = monitor.getAllMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.fps).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.loadTime).toBeDefined();
    });

    it('should export metrics for analytics', () => {
      monitor.startFPSTracking();
      
      const exportData = monitor.exportMetrics();
      
      expect(exportData).toBeDefined();
      expect(exportData.timestamp).toBeDefined();
      expect(exportData.metrics).toBeDefined();
    });
  });

  describe('Performance Warnings', () => {
    it('should emit warning on low FPS', async () => {
      const warningCallback = vi.fn();
      monitor.onPerformanceWarning(warningCallback);
      
      monitor.startFPSTracking();
      
      // Simulate sustained low FPS
      for (let i = 0; i < 100; i++) {
        monitor.recordFrame();
        vi.advanceTimersByTime(50); // ~20 FPS
      }
      
      await vi.runAllTimersAsync();
      
      expect(warningCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'low_fps',
          value: expect.any(Number),
        })
      );
    });

    it('should emit warning on high memory', () => {
      const warningCallback = vi.fn();
      monitor.onPerformanceWarning(warningCallback);
      
      // Mock high memory
      const mockPerformance = {
        memory: {
          usedJSHeapSize: 950 * 1024 * 1024,
          totalJSHeapSize: 1000 * 1024 * 1024,
          jsHeapSizeLimit: 1000 * 1024 * 1024,
        },
      };
      
      vi.stubGlobal('performance', mockPerformance);
      
      monitor.checkMemory();
      
      expect(warningCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'high_memory',
          value: expect.any(Number),
        })
      );
    });
  });

  describe('Lifecycle', () => {
    it('should stop tracking', () => {
      monitor.startFPSTracking();
      expect(monitor.isTracking()).toBe(true);
      
      monitor.stop();
      expect(monitor.isTracking()).toBe(false);
    });

    it('should reset metrics', () => {
      monitor.startFPSTracking();
      
      for (let i = 0; i < 60; i++) {
        monitor.recordFrame();
      }
      
      monitor.reset();
      
      const fps = monitor.getCurrentFPS();
      expect(fps).toBe(0);
    });
  });
});
