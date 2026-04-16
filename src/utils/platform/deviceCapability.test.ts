import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeviceTier, detectDeviceCapabilities, detectDeviceTier, getPerformanceConfig } from './deviceCapability';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn()
  }
}));

describe('deviceCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DeviceTier enum', () => {
    it('should have LOW, MID, HIGH values', () => {
      expect(DeviceTier.LOW).toBe('low');
      expect(DeviceTier.MID).toBe('mid');
      expect(DeviceTier.HIGH).toBe('high');
    });
  });

  describe('detectDeviceCapabilities', () => {
    it('should detect device capabilities with defaults', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

      const capabilities = detectDeviceCapabilities();

      expect(capabilities).toHaveProperty('tier');
      expect(capabilities).toHaveProperty('memory');
      expect(capabilities).toHaveProperty('cores');
      expect(capabilities).toHaveProperty('dpi');
      expect(capabilities).toHaveProperty('gpuRenderer');
      expect(capabilities).toHaveProperty('isNative');
      expect(capabilities).toHaveProperty('isAndroid');
      expect(capabilities.isNative).toBe(false);
      expect(capabilities.isAndroid).toBe(false);
    });

    it('should detect Android platform', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      const capabilities = detectDeviceCapabilities();

      expect(capabilities.isNative).toBe(true);
      expect(capabilities.isAndroid).toBe(true);
    });

    it('should classify as LOW tier for low memory', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');

      // Mock low memory
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 2,
        configurable: true
      });

      const capabilities = detectDeviceCapabilities();

      expect(capabilities.tier).toBe(DeviceTier.LOW);
    });

    it('should handle missing deviceMemory gracefully', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

      // Remove deviceMemory
      Object.defineProperty(navigator, 'deviceMemory', {
        value: undefined,
        configurable: true
      });

      const capabilities = detectDeviceCapabilities();

      // Should default to 4GB
      expect(capabilities.memory).toBe(4);
    });

    it('should handle missing hardwareConcurrency gracefully', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

      const originalConcurrency = navigator.hardwareConcurrency;
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: undefined,
        configurable: true
      });

      const capabilities = detectDeviceCapabilities();

      // Should default to 4 cores
      expect(capabilities.cores).toBe(4);

      // Restore
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: originalConcurrency,
        configurable: true
      });
    });
  });

  describe('detectDeviceTier', () => {
    it('should classify LOW tier for memory < 4GB', () => {
      expect(detectDeviceTier(2, 8)).toBe(DeviceTier.LOW);
    });

    it('should classify LOW tier for cores <= 4', () => {
      expect(detectDeviceTier(8, 4)).toBe(DeviceTier.LOW);
    });

    it('should classify MID tier for 4GB <= memory < 6GB', () => {
      expect(detectDeviceTier(4, 6)).toBe(DeviceTier.MID);
      expect(detectDeviceTier(5, 6)).toBe(DeviceTier.MID);
    });

    it('should classify HIGH tier for memory >= 6GB and cores > 4', () => {
      expect(detectDeviceTier(6, 8)).toBe(DeviceTier.HIGH);
      expect(detectDeviceTier(8, 8)).toBe(DeviceTier.HIGH);
    });
  });

  describe('getPerformanceConfig', () => {
    it('should return LOW tier config', () => {
      const config = getPerformanceConfig(DeviceTier.LOW);

      expect(config.fragmentPoolSize).toBe(15);
      expect(config.hardwareScaling).toBe(2.0);
      expect(config.enableGlow).toBe(false);
      expect(config.enableParticles).toBe(false);
      expect(config.antialias).toBe(false);
      expect(config.maxTextureSize).toBe(1024);
    });

    it('should return MID tier config', () => {
      const config = getPerformanceConfig(DeviceTier.MID);

      expect(config.fragmentPoolSize).toBe(25);
      expect(config.hardwareScaling).toBe(1.2);
      expect(config.enableGlow).toBe(true);
      expect(config.enableParticles).toBe(true);
      expect(config.antialias).toBe(false);
      expect(config.maxTextureSize).toBe(2048);
    });

    it('should return HIGH tier config', () => {
      const config = getPerformanceConfig(DeviceTier.HIGH);

      expect(config.fragmentPoolSize).toBe(50);
      expect(config.hardwareScaling).toBe(1.0);
      expect(config.enableGlow).toBe(true);
      expect(config.enableParticles).toBe(true);
      expect(config.antialias).toBe(true);
      expect(config.maxTextureSize).toBe(4096);
    });
  });

  describe('GPU detection', () => {
    it('should handle WebGL unavailability gracefully', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');

      const capabilities = detectDeviceCapabilities();

      // GPU renderer might be null if WebGL is not available
      expect(capabilities.gpuRenderer === null || typeof capabilities.gpuRenderer === 'string').toBe(true);
    });
  });
});
