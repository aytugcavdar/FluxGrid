import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getSafeAreaInsets, 
  getDeviceType, 
  getOrientation, 
  shouldUseTabletLayout, 
  getTouchTargetPadding,
  getDragYOffset 
} from './responsive';

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

describe('getDeviceType', () => {
  beforeEach(() => {
    // Reset window dimensions and navigator
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  it('should return "mobile" for screen width less than 768px', () => {
    vi.stubGlobal('innerWidth', 375);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('mobile');
  });

  it('should return "mobile" for screen width at 767px (boundary)', () => {
    vi.stubGlobal('innerWidth', 767);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('mobile');
  });

  it('should return "tablet" for screen width >= 768px with touch capability', () => {
    vi.stubGlobal('innerWidth', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('tablet');
  });

  it('should return "tablet" for iPad-sized screen (1024px) with touch', () => {
    vi.stubGlobal('innerWidth', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('tablet');
  });

  it('should return "desktop" for screen width >= 768px without touch capability', () => {
    vi.stubGlobal('innerWidth', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('desktop');
  });

  it('should return "desktop" for large screen (1920px) without touch', () => {
    vi.stubGlobal('innerWidth', 1920);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('desktop');
  });

  it('should handle edge case of exactly 768px width with no touch as desktop', () => {
    vi.stubGlobal('innerWidth', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('desktop');
  });

  it('should prioritize width over touch for mobile detection', () => {
    // Even with no touch, small screen should be mobile
    vi.stubGlobal('innerWidth', 375);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const deviceType = getDeviceType();
    
    expect(deviceType).toBe('mobile');
  });
});

describe('getOrientation', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  it('should return "portrait" when height > width', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('portrait');
  });

  it('should return "landscape" when width > height', () => {
    vi.stubGlobal('innerWidth', 667);
    vi.stubGlobal('innerHeight', 375);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('landscape');
  });

  it('should return "landscape" when width equals height', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 768);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('landscape');
  });

  it('should handle typical mobile portrait dimensions (375x667)', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('portrait');
  });

  it('should handle typical mobile landscape dimensions (667x375)', () => {
    vi.stubGlobal('innerWidth', 667);
    vi.stubGlobal('innerHeight', 375);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('landscape');
  });

  it('should handle tablet portrait dimensions (768x1024)', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 1024);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('portrait');
  });

  it('should handle tablet landscape dimensions (1024x768)', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('landscape');
  });

  it('should handle desktop dimensions (1920x1080)', () => {
    vi.stubGlobal('innerWidth', 1920);
    vi.stubGlobal('innerHeight', 1080);
    
    const orientation = getOrientation();
    
    expect(orientation).toBe('landscape');
  });
});

describe('shouldUseTabletLayout', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  it('should return true for tablet in landscape orientation', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(true);
  });

  it('should return false for tablet in portrait orientation', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(false);
  });

  it('should return false for mobile in landscape orientation', () => {
    vi.stubGlobal('innerWidth', 667);
    vi.stubGlobal('innerHeight', 375);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(false);
  });

  it('should return false for desktop in landscape orientation', () => {
    vi.stubGlobal('innerWidth', 1920);
    vi.stubGlobal('innerHeight', 1080);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(false);
  });

  it('should return false for mobile in portrait orientation', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(false);
  });

  it('should handle edge case of exactly 768px width in landscape', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    // Width equals height, so orientation is landscape
    expect(shouldUse).toBe(true);
  });

  it('should return false for iPad Pro in portrait (1024x1366)', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 1366);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(false);
  });

  it('should return true for iPad Pro in landscape (1366x1024)', () => {
    vi.stubGlobal('innerWidth', 1366);
    vi.stubGlobal('innerHeight', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const shouldUse = shouldUseTabletLayout();
    
    expect(shouldUse).toBe(true);
  });
});

describe('getTouchTargetPadding', () => {
  it('should return 0 when visual size equals minimum size', () => {
    const padding = getTouchTargetPadding(52, 52);
    
    expect(padding).toBe(0);
  });

  it('should return 0 when visual size exceeds minimum size', () => {
    const padding = getTouchTargetPadding(60, 52);
    
    expect(padding).toBe(0);
  });

  it('should calculate correct padding when visual size is smaller', () => {
    const padding = getTouchTargetPadding(44, 52);
    
    // (52 - 44) / 2 = 4
    expect(padding).toBe(4);
  });

  it('should use default minimum size of 52px when not specified', () => {
    const padding = getTouchTargetPadding(44);
    
    // (52 - 44) / 2 = 4
    expect(padding).toBe(4);
  });

  it('should handle very small visual sizes', () => {
    const padding = getTouchTargetPadding(20, 52);
    
    // (52 - 20) / 2 = 16
    expect(padding).toBe(16);
  });

  it('should handle Material Design minimum (48px)', () => {
    const padding = getTouchTargetPadding(40, 48);
    
    // (48 - 40) / 2 = 4
    expect(padding).toBe(4);
  });

  it('should handle Apple HIG minimum (44px)', () => {
    const padding = getTouchTargetPadding(36, 44);
    
    // (44 - 36) / 2 = 4
    expect(padding).toBe(4);
  });

  it('should handle floating point results correctly', () => {
    const padding = getTouchTargetPadding(43, 52);
    
    // (52 - 43) / 2 = 4.5
    expect(padding).toBe(4.5);
  });

  it('should handle edge case of 1px difference', () => {
    const padding = getTouchTargetPadding(51, 52);
    
    // (52 - 51) / 2 = 0.5
    expect(padding).toBe(0.5);
  });

  it('should return 0 for exact match with custom minimum', () => {
    const padding = getTouchTargetPadding(48, 48);
    
    expect(padding).toBe(0);
  });
});

describe('getDragYOffset', () => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  it('should return 0 for desktop (width >= 768px, no touch)', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(0);
  });

  it('should return -28 for iPad landscape (width >= 768px with touch)', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-28);
  });

  it('should return -62 for mobile with height < 700px', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-62);
  });

  it('should return -68 for mobile with height between 700px and 800px', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 750);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-68);
  });

  it('should return -72 for mobile with height >= 820px', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 850);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-72);
  });

  it('should handle boundary case of exactly 700px height', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 700);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-68);
  });

  it('should handle boundary case of exactly 800px height', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 800);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-68);
  });

  it('should handle boundary case of exactly 768px width with touch', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-34);
  });

  it('should handle boundary case of exactly 768px width without touch', () => {
    vi.stubGlobal('innerWidth', 768);
    vi.stubGlobal('innerHeight', 1024);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(0);
  });

  it('should handle very tall mobile screens (> 900px)', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 950);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-72);
  });

  it('should handle iPad Pro 12.9" in portrait (1024x1366)', () => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 1366);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-34);
  });

  it('should handle small mobile screens (iPhone SE)', () => {
    vi.stubGlobal('innerWidth', 375);
    vi.stubGlobal('innerHeight', 667);
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });
    
    const offset = getDragYOffset();
    
    expect(offset).toBe(-62);
  });
});
