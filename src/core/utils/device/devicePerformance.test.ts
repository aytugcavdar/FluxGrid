import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectDevicePerformance, shouldEnablePerformanceMode } from './devicePerformance';

describe('Device Performance Detection', () => {
  beforeEach(() => {
    // Reset navigator mocks
    vi.restoreAllMocks();
  });

  describe('detectDevicePerformance', () => {
    it('should detect high-end desktop devices', () => {
      // Mock high-end desktop
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 8,
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });

      expect(detectDevicePerformance()).toBe('high');
    });

    it('should detect medium-end devices', () => {
      // Mock medium device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 4,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 4,
        configurable: true,
      });

      expect(detectDevicePerformance()).toBe('medium');
    });

    it('should detect low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        configurable: true,
      });

      expect(detectDevicePerformance()).toBe('low');
    });

    it('should detect mobile devices as not high-end even with good specs', () => {
      // Mock high-spec mobile
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 8,
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        configurable: true,
      });

      expect(detectDevicePerformance()).toBe('medium');
    });

    it('should use default values when hardware info is unavailable', () => {
      // Mock unavailable hardware info
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: undefined,
        configurable: true,
      });

      // Should default to 2 cores, 4GB = low (2 cores < 4)
      expect(detectDevicePerformance()).toBe('low');
    });
  });

  describe('shouldEnablePerformanceMode', () => {
    it('should return true for low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        configurable: true,
      });

      expect(shouldEnablePerformanceMode()).toBe(true);
    });

    it('should return false for medium and high-end devices', () => {
      // Mock medium device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 4,
        configurable: true,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 4,
        configurable: true,
      });

      expect(shouldEnablePerformanceMode()).toBe(false);
    });
  });
});
