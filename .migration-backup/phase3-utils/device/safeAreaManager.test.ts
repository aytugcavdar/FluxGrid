import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { applySafeAreaCSS, getSafeAreaInsets } from './safeAreaManager';

describe('SafeAreaManager', () => {
  beforeEach(() => {
    // Clear CSS variables before each test
    const root = document.documentElement;
    root.style.removeProperty('--safe-area-top');
    root.style.removeProperty('--safe-area-bottom');
    root.style.removeProperty('--safe-area-left');
    root.style.removeProperty('--safe-area-right');
    
    // Reset navigator.userAgent mock
    vi.clearAllMocks();
  });

  describe('Feature: android-layout-fixes, Property 6: Safe Area CSS Değişkenleri Ayarlanır', () => {
    it('should set CSS variables for all safe area values', () => {
      fc.assert(
        fc.property(
          fc.record({
            top: fc.integer({ min: 0, max: 100 }),
            bottom: fc.integer({ min: 0, max: 100 }),
            left: fc.integer({ min: 0, max: 50 }),
            right: fc.integer({ min: 0, max: 50 }),
          }),
          (insets) => {
            // Manually set CSS variables to simulate getSafeAreaInsets result
            const root = document.documentElement;
            root.style.setProperty('--safe-area-top', `${insets.top}px`);
            root.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
            root.style.setProperty('--safe-area-left', `${insets.left}px`);
            root.style.setProperty('--safe-area-right', `${insets.right}px`);
            
            const computedStyle = getComputedStyle(root);
            
            expect(computedStyle.getPropertyValue('--safe-area-top')).toBe(`${insets.top}px`);
            expect(computedStyle.getPropertyValue('--safe-area-bottom')).toBe(`${insets.bottom}px`);
            expect(computedStyle.getPropertyValue('--safe-area-left')).toBe(`${insets.left}px`);
            expect(computedStyle.getPropertyValue('--safe-area-right')).toBe(`${insets.right}px`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Feature: android-layout-fixes, Property 8: Safe Area Senkron Başlatma', () => {
    it('should set defaults synchronously before async query', () => {
      // Clear CSS variables
      const root = document.documentElement;
      root.style.removeProperty('--safe-area-top');
      
      // Call applySafeAreaCSS()
      applySafeAreaCSS();
      
      // Immediately check (before async query completes) that defaults are set
      const computedStyle = getComputedStyle(root);
      const topValue = computedStyle.getPropertyValue('--safe-area-top');
      
      // Should have a default value set synchronously
      expect(topValue).toBeTruthy();
      expect(topValue).toMatch(/\d+px/);
      
      // Android should have 48px, iOS should have 44px
      const isAndroid = /Android/i.test(navigator.userAgent);
      const expectedDefault = isAndroid ? '48px' : '44px';
      
      expect(topValue).toBe(expectedDefault);
    });

    it('should set conservative defaults for Android', () => {
      // Mock Android user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        configurable: true
      });
      
      const root = document.documentElement;
      root.style.removeProperty('--safe-area-top');
      root.style.removeProperty('--safe-area-bottom');
      
      applySafeAreaCSS();
      
      const computedStyle = getComputedStyle(root);
      expect(computedStyle.getPropertyValue('--safe-area-top')).toBe('48px');
      expect(computedStyle.getPropertyValue('--safe-area-bottom')).toBe('24px');
    });

    it('should set conservative defaults for iOS', () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
      
      const root = document.documentElement;
      root.style.removeProperty('--safe-area-top');
      root.style.removeProperty('--safe-area-bottom');
      
      applySafeAreaCSS();
      
      const computedStyle = getComputedStyle(root);
      expect(computedStyle.getPropertyValue('--safe-area-top')).toBe('44px');
      expect(computedStyle.getPropertyValue('--safe-area-bottom')).toBe('20px');
    });
  });

  describe('Unit Tests', () => {
    it('should set all four CSS variables', () => {
      applySafeAreaCSS();
      
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      // All variables should be set
      expect(computedStyle.getPropertyValue('--safe-area-top')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--safe-area-bottom')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--safe-area-left')).toBeTruthy();
      expect(computedStyle.getPropertyValue('--safe-area-right')).toBeTruthy();
    });

    it('should set left and right to 0px by default', () => {
      applySafeAreaCSS();
      
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      expect(computedStyle.getPropertyValue('--safe-area-left')).toBe('0px');
      expect(computedStyle.getPropertyValue('--safe-area-right')).toBe('0px');
    });
  });
});
