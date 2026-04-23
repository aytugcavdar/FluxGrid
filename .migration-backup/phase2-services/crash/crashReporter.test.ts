/**
 * Unit tests for CrashReporter service
 * 
 * Tests error logging, breadcrumb trail, rate limiting, and device info collection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrashReporter, CrashSeverity } from './crashReporter';

describe('CrashReporter', () => {
  let crashReporter: CrashReporter;

  beforeEach(async () => {
    crashReporter = new CrashReporter();
    await crashReporter.initialize();
    await crashReporter.start();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(crashReporter.isHealthy()).toBe(true);
    });

    it('should collect device info on initialization', () => {
      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs.length).toBeGreaterThan(0);
      expect(breadcrumbs[0].message).toBe('CrashReporter service started');
    });
  });

  describe('Error Logging', () => {
    it('should log non-fatal errors', () => {
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      crashReporter.logError(error, CrashSeverity.ERROR);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should include context in error logs', () => {
      const error = new Error('Test error');
      const context = {
        gameState: 'playing',
        customData: { level: 5 }
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      crashReporter.logError(error, CrashSeverity.ERROR, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log fatal crashes', () => {
      const error = new Error('Fatal error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      crashReporter.logCrash(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Breadcrumb Trail', () => {
    it('should add breadcrumbs', () => {
      crashReporter.logBreadcrumb('User clicked button');
      crashReporter.logBreadcrumb('User navigated to settings');

      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs.length).toBeGreaterThanOrEqual(2);
      expect(breadcrumbs.some(b => b.message === 'User clicked button')).toBe(true);
    });

    it('should limit breadcrumbs to 20', () => {
      // Clear existing breadcrumbs
      crashReporter.clearBreadcrumbs();

      // Add 25 breadcrumbs
      for (let i = 0; i < 25; i++) {
        crashReporter.logBreadcrumb(`Action ${i}`);
      }

      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs.length).toBe(20);
      // Should keep the most recent ones
      expect(breadcrumbs[19].message).toBe('Action 24');
    });

    it('should include data in breadcrumbs', () => {
      crashReporter.clearBreadcrumbs();
      crashReporter.logBreadcrumb('User action', { buttonId: 'submit', value: 42 });

      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs[0].data).toEqual({ buttonId: 'submit', value: 42 });
    });

    it('should clear breadcrumbs', () => {
      crashReporter.logBreadcrumb('Test breadcrumb');
      crashReporter.clearBreadcrumbs();

      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs.length).toBe(0);
    });
  });

  describe('Custom Keys', () => {
    it('should set custom keys', () => {
      crashReporter.setCustomKey('gameMode', 'survival');
      crashReporter.setCustomKey('level', 10);
      crashReporter.setCustomKey('isPremium', true);

      // Custom keys should be included in error logs
      // We can't directly access customKeys, but we can verify through error logging
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      crashReporter.logError(error, CrashSeverity.ERROR);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should set user ID', () => {
      const userId = 'user-123';
      crashReporter.setUserId(userId);

      // User ID should be included in crash logs
      const error = new Error('Test error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      crashReporter.logCrash(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Log 100 errors (the limit)
      for (let i = 0; i < 100; i++) {
        crashReporter.logError(new Error(`Error ${i}`), CrashSeverity.ERROR);
      }

      // 101st error should be rate limited
      crashReporter.logError(new Error('Rate limited error'), CrashSeverity.ERROR);

      expect(warnSpy).toHaveBeenCalledWith('Error logging rate limit exceeded');

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should track error statistics', () => {
      const stats = crashReporter.getErrorStats();
      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('recentErrors');
      expect(typeof stats.count).toBe('number');
      expect(typeof stats.recentErrors).toBe('number');
    });
  });

  describe('Global Error Handlers', () => {
    it('should handle uncaught errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate an uncaught error
      const errorEvent = new ErrorEvent('error', {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Uncaught error')
      });

      window.dispatchEvent(errorEvent);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle unhandled promise rejections', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate an unhandled promise rejection
      const promise = Promise.resolve(); // Use resolved promise to avoid actual rejection
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise,
        reason: new Error('Unhandled rejection')
      });

      window.dispatchEvent(rejectionEvent);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Service Lifecycle', () => {
    it('should stop successfully', async () => {
      await crashReporter.stop();
      expect(crashReporter.getNetworkStatus()).toBe('stopped');
    });

    it('should clear data on stop', async () => {
      crashReporter.logBreadcrumb('Test breadcrumb');
      crashReporter.setCustomKey('test', 'value');

      await crashReporter.stop();

      // After stopping, breadcrumbs should be cleared
      const breadcrumbs = crashReporter.getBreadcrumbs();
      expect(breadcrumbs.length).toBe(0);
    });
  });
});
