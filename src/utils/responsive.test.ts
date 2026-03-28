import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSafeAreaInsets } from './responsive';

describe('getSafeAreaInsets', () => {
  beforeEach(() => {
    // Reset document element styles before each test
    document.documentElement.style.removeProperty('--safe-area-inset-top');
    document.documentElement.style.removeProperty('--safe-area-inset-bottom');
    document.documentElement.style.removeProperty('--safe-area-inset-left');
    document.documentElement.style.removeProperty('--safe-area-inset-right');
  });

  it('should return all zeros when safe area insets are not set', () => {
    const insets = getSafeAreaInsets();
    
    expect(insets).toEqual({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });
  });

  it('should read bottom safe area inset from CSS variable', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '34px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.bottom).toBe(34);
  });

  it('should read top safe area inset from CSS variable', () => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '44px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.top).toBe(44);
  });

  it('should read left safe area inset from CSS variable', () => {
    document.documentElement.style.setProperty('--safe-area-inset-left', '20px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.left).toBe(20);
  });

  it('should read right safe area inset from CSS variable', () => {
    document.documentElement.style.setProperty('--safe-area-inset-right', '20px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.right).toBe(20);
  });

  it('should read all safe area insets when all are set', () => {
    document.documentElement.style.setProperty('--safe-area-inset-top', '44px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '34px');
    document.documentElement.style.setProperty('--safe-area-inset-left', '20px');
    document.documentElement.style.setProperty('--safe-area-inset-right', '20px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets).toEqual({
      top: 44,
      bottom: 34,
      left: 20,
      right: 20,
    });
  });

  it('should fallback to 0 for invalid CSS variable values', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', 'invalid');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.bottom).toBe(0);
  });

  it('should parse numeric values without px unit', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '34');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.bottom).toBe(34);
  });

  it('should handle partial safe area inset configuration', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '34px');
    document.documentElement.style.setProperty('--safe-area-inset-top', '44px');
    // left and right not set
    
    const insets = getSafeAreaInsets();
    
    expect(insets).toEqual({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });
  });

  it('should handle zero values correctly', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-top', '0');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.top).toBe(0);
    expect(insets.bottom).toBe(0);
  });

  it('should handle negative values by clamping them to 0', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '-10px');
    
    const insets = getSafeAreaInsets();
    
    // Negative values should be clamped to 0
    expect(insets.bottom).toBe(0);
  });

  it('should handle floating point values by truncating to integer', () => {
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '34.7px');
    
    const insets = getSafeAreaInsets();
    
    expect(insets.bottom).toBe(34);
  });
});
