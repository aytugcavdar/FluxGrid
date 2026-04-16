import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { detectPlatform, isAndroid, isIOS, isWeb, clearPlatformCache } from './platform';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn()
  }
}));

describe('Platform Detection Utility', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPlatformCache();
    vi.clearAllMocks();
  });

  describe('Feature: android-quick-performance-wins, Property 4: Platform Kontrolü (FPS Limiter)', () => {
    it('should correctly identify Android platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const result = isAndroid();
      
      expect(result).toBe(true);
      expect(isIOS()).toBe(false);
      expect(isWeb()).toBe(false);
    });

    it('should correctly identify non-Android platforms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ios', 'web'),
          (platform) => {
            clearPlatformCache();
            vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
            
            expect(isAndroid()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Feature: android-quick-performance-wins, Property 16: Platform Kontrolü (Background Pause)', () => {
    it('should return true for Android platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      expect(isAndroid()).toBe(true);
    });

    it('should return false for iOS platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      
      expect(isAndroid()).toBe(false);
    });

    it('should return false for web platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      
      expect(isAndroid()).toBe(false);
    });
  });

  describe('Feature: android-quick-performance-wins, Property 22: Platform Kontrolü (Touch Optimizer)', () => {
    it('should correctly detect Android for touch optimization', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const shouldEnableTouchOptimizer = isAndroid();
      
      expect(shouldEnableTouchOptimizer).toBe(true);
    });

    it('should not enable touch optimizer on non-Android platforms', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('ios', 'web'),
          (platform) => {
            clearPlatformCache();
            vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
            
            const shouldEnableTouchOptimizer = isAndroid();
            
            expect(shouldEnableTouchOptimizer).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('detectPlatform()', () => {
    it('should return correct platform info for Android', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const info = detectPlatform();
      
      expect(info.isAndroid).toBe(true);
      expect(info.isIOS).toBe(false);
      expect(info.isWeb).toBe(false);
      expect(info.platform).toBe('android');
    });

    it('should return correct platform info for iOS', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      
      const info = detectPlatform();
      
      expect(info.isAndroid).toBe(false);
      expect(info.isIOS).toBe(true);
      expect(info.isWeb).toBe(false);
      expect(info.platform).toBe('ios');
    });

    it('should return correct platform info for web', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      
      const info = detectPlatform();
      
      expect(info.isAndroid).toBe(false);
      expect(info.isIOS).toBe(false);
      expect(info.isWeb).toBe(true);
      expect(info.platform).toBe('web');
    });

    it('should handle errors gracefully and default to web', () => {
      vi.mocked(Capacitor.getPlatform).mockImplementation(() => {
        throw new Error('Platform detection failed');
      });
      
      const info = detectPlatform();
      
      expect(info.isAndroid).toBe(false);
      expect(info.isIOS).toBe(false);
      expect(info.isWeb).toBe(true);
      expect(info.platform).toBe('web');
    });
  });

  describe('isAndroid()', () => {
    it('should return true only for Android platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      expect(isAndroid()).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(isAndroid()).toBe(false);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(isAndroid()).toBe(false);
    });
  });

  describe('isIOS()', () => {
    it('should return true only for iOS platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(isIOS()).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      expect(isIOS()).toBe(false);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(isIOS()).toBe(false);
    });
  });

  describe('isWeb()', () => {
    it('should return true only for web platform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(isWeb()).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      expect(isWeb()).toBe(false);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(isWeb()).toBe(false);
    });
  });

  describe('Property-Based Tests', () => {
    it('should always return exactly one true value for platform checks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('android', 'ios', 'web'),
          (platform) => {
            clearPlatformCache();
            vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
            
            const androidCheck = isAndroid();
            const iosCheck = isIOS();
            const webCheck = isWeb();
            
            // Exactly one should be true
            const trueCount = [androidCheck, iosCheck, webCheck].filter(Boolean).length;
            expect(trueCount).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency between detectPlatform() and individual checks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('android', 'ios', 'web'),
          (platform) => {
            clearPlatformCache();
            vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
            
            const info = detectPlatform();
            
            expect(info.isAndroid).toBe(isAndroid());
            expect(info.isIOS).toBe(isIOS());
            expect(info.isWeb).toBe(isWeb());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Type Safety', () => {
    it('should return boolean values for all platform checks', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      expect(typeof isAndroid()).toBe('boolean');
      expect(typeof isIOS()).toBe('boolean');
      expect(typeof isWeb()).toBe('boolean');
    });

    it('should return PlatformInfo object from detectPlatform', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      
      const info = detectPlatform();
      
      expect(info).toHaveProperty('isAndroid');
      expect(info).toHaveProperty('isIOS');
      expect(info).toHaveProperty('isWeb');
      expect(info).toHaveProperty('platform');
      
      expect(typeof info.isAndroid).toBe('boolean');
      expect(typeof info.isIOS).toBe('boolean');
      expect(typeof info.isWeb).toBe('boolean');
      expect(typeof info.platform).toBe('string');
    });
  });

  describe('Requirements Validation', () => {
    it('validates Requirements 1.5: FPS Limiter SHALL be active only on Android', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      expect(isAndroid()).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(isAndroid()).toBe(false);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(isAndroid()).toBe(false);
    });

    it('validates Requirements 5.5: Background Pause SHALL be active only on Android', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      const shouldEnableBackgroundPause = isAndroid();
      expect(shouldEnableBackgroundPause).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('ios');
      expect(isAndroid()).toBe(false);
    });

    it('validates Requirements 8.5: Touch Optimizer SHALL apply only on Android', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android');
      const shouldEnableTouchOptimizer = isAndroid();
      expect(shouldEnableTouchOptimizer).toBe(true);
      
      clearPlatformCache();
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web');
      expect(isAndroid()).toBe(false);
    });

    it('validates Requirements 12.1, 12.2, 12.3: Platform-specific activation', () => {
      // Test all three requirements together
      const platforms = ['android', 'ios', 'web'] as const;
      
      platforms.forEach(platform => {
        clearPlatformCache();
        vi.mocked(Capacitor.getPlatform).mockReturnValue(platform);
        
        const shouldEnableFPSLimiter = isAndroid();
        const shouldEnableBackgroundPause = isAndroid();
        const shouldEnableTouchOptimizer = isAndroid();
        
        if (platform === 'android') {
          expect(shouldEnableFPSLimiter).toBe(true);
          expect(shouldEnableBackgroundPause).toBe(true);
          expect(shouldEnableTouchOptimizer).toBe(true);
        } else {
          expect(shouldEnableFPSLimiter).toBe(false);
          expect(shouldEnableBackgroundPause).toBe(false);
          expect(shouldEnableTouchOptimizer).toBe(false);
        }
      });
    });
  });
});
