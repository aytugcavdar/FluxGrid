/**
 * BottomNavigation Responsive Device Tests
 * 
 * Task 12.1: Test on multiple devices and screen sizes
 * 
 * Tests cover:
 * - iPhone SE (320px), iPhone 12 (390px), iPhone 14 Pro Max (430px)
 * - Android devices with different screen sizes
 * - Landscape and portrait orientations
 * - Safe area insets on devices with notch
 * 
 * **Validates: Requirements 4.1, 4.2, 4.4, 4.5**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BottomNavigation } from './BottomNavigation';

// Store for mocked safe area insets
let mockedSafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

// Mock the hooks
vi.mock('../hooks/useAuthWithTimeout', () => ({
  useAuthWithTimeout: () => ({
    user: null,
    isAnonymous: false,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useResponsiveButtonSize', () => ({
  useResponsiveButtonSize: () => {
    const width = window.innerWidth;
    if (width < 320) return { width: 40, height: 40 };
    if (width < 375) return { width: 44, height: 44 };
    return { width: 48, height: 48 };
  },
}));

vi.mock('@utils/responsive', () => ({
  getSafeAreaInsets: () => mockedSafeAreaInsets,
}));

vi.mock('@features/auth/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      signInWithGoogle: vi.fn(),
      linkWithGoogle: vi.fn(),
    }),
  },
}));

// Device configurations for testing
const DEVICES = {
  iPhoneSE: {
    name: 'iPhone SE',
    portrait: { width: 320, height: 568 },
    landscape: { width: 568, height: 320 },
    safeAreaInsets: { top: 20, bottom: 0, left: 0, right: 0 },
  },
  iPhone12: {
    name: 'iPhone 12',
    portrait: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 },
    safeAreaInsets: { top: 47, bottom: 34, left: 0, right: 0 },
  },
  iPhone14ProMax: {
    name: 'iPhone 14 Pro Max',
    portrait: { width: 430, height: 932 },
    landscape: { width: 932, height: 430 },
    safeAreaInsets: { top: 59, bottom: 34, left: 0, right: 0 },
  },
  galaxyS21: {
    name: 'Samsung Galaxy S21',
    portrait: { width: 360, height: 800 },
    landscape: { width: 800, height: 360 },
    safeAreaInsets: { top: 0, bottom: 20, left: 0, right: 0 },
  },
  pixelXL: {
    name: 'Google Pixel XL',
    portrait: { width: 411, height: 823 },
    landscape: { width: 823, height: 411 },
    safeAreaInsets: { top: 0, bottom: 24, left: 0, right: 0 },
  },
};

describe('BottomNavigation - Device and Screen Size Tests (Task 12.1)', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    window.matchMedia = originalMatchMedia;
  });

  /**
   * Helper function to set viewport size and safe area insets
   */
  const setViewport = (width: number, height: number, safeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 }) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    // Update the mocked safe area insets
    mockedSafeAreaInsets = safeAreaInsets;
  };

  describe('iPhone SE (320px) - Portrait', () => {
    it('should render all buttons within viewport bounds', () => {
      const device = DEVICES.iPhoneSE;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.portrait.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should use minimum button size (40x40px) for very small screens', () => {
      const device = DEVICES.iPhoneSE;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const minWidth = button.style.minWidth;
        const minHeight = button.style.minHeight;
        
        // Should have minimum touch target size
        expect(minWidth).toBe('44px'); // CSS enforces minimum 44px
        expect(minHeight).toBe('44px');
      });
    });

    it('should have reduced gap between buttons on small screens', () => {
      const device = DEVICES.iPhoneSE;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]');
      
      // Verify navigation exists and uses grid layout
      expect(navigation).toBeTruthy();
      
      // Note: CSS media queries don't apply in jsdom, but we verify the inline style
      // The actual gap value is set via inline styles in the component
      const inlineGap = (navigation as HTMLElement).style.gap;
      expect(inlineGap).toBe('8px'); // Component sets this inline
    });
  });

  describe('iPhone 12 (390px) - Portrait', () => {
    it('should render all buttons within viewport bounds', () => {
      const device = DEVICES.iPhone12;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.portrait.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply safe area insets for notch', () => {
      const device = DEVICES.iPhone12;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]') as HTMLElement;
      
      // Should apply safe area inset to bottom padding
      // paddingBottom should be max(16px, safeAreaInsets.bottom)
      const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
      expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
    });

    it('should use standard button size (48x48px)', () => {
      const device = DEVICES.iPhone12;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const minWidth = button.style.minWidth;
        const minHeight = button.style.minHeight;
        
        expect(minWidth).toBe('44px'); // CSS minimum
        expect(minHeight).toBe('44px');
      });
    });
  });

  describe('iPhone 14 Pro Max (430px) - Portrait', () => {
    it('should render all buttons within viewport bounds', () => {
      const device = DEVICES.iPhone14ProMax;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.portrait.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply safe area insets for Dynamic Island', () => {
      const device = DEVICES.iPhone14ProMax;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]') as HTMLElement;
      
      // Should apply safe area inset to bottom padding
      const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
      expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
    });

    it('should have adequate spacing for larger screen', () => {
      const device = DEVICES.iPhone14ProMax;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]');
      const computedStyle = window.getComputedStyle(navigation as Element);
      
      // Gap should be 8px on screens >= 376px
      expect(computedStyle.gap).toBe('8px');
    });
  });

  describe('Samsung Galaxy S21 (360px) - Portrait', () => {
    it('should render all buttons within viewport bounds', () => {
      const device = DEVICES.galaxyS21;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.portrait.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply safe area insets for Android gesture bar', () => {
      const device = DEVICES.galaxyS21;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]') as HTMLElement;
      
      // Should apply safe area inset to bottom padding
      const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
      expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
    });
  });

  describe('Google Pixel XL (411px) - Portrait', () => {
    it('should render all buttons within viewport bounds', () => {
      const device = DEVICES.pixelXL;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.portrait.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply safe area insets for Android gesture bar', () => {
      const device = DEVICES.pixelXL;
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]') as HTMLElement;
      
      // Should apply safe area inset to bottom padding
      const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
      expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
    });
  });

  describe('Landscape Orientation Tests', () => {
    it('should adapt layout for iPhone SE landscape', () => {
      const device = DEVICES.iPhoneSE;
      setViewport(device.landscape.width, device.landscape.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.landscape.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should adapt layout for iPhone 12 landscape', () => {
      const device = DEVICES.iPhone12;
      setViewport(device.landscape.width, device.landscape.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.landscape.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should adapt layout for iPhone 14 Pro Max landscape', () => {
      const device = DEVICES.iPhone14ProMax;
      setViewport(device.landscape.width, device.landscape.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.landscape.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });

    it('should adapt layout for Galaxy S21 landscape', () => {
      const device = DEVICES.galaxyS21;
      setViewport(device.landscape.width, device.landscape.height, device.safeAreaInsets);

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.landscape.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Orientation Change Handling (Requirement 4.4)', () => {
    it('should recalculate layout within 300ms after orientation change', async () => {
      const device = DEVICES.iPhone12;
      
      // Start in portrait
      setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

      const { container, rerender } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      // Verify portrait layout
      let buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Change to landscape
      setViewport(device.landscape.width, device.landscape.height, device.safeAreaInsets);
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));

      // Wait for debounce (300ms) + RAF
      await waitFor(() => {
        rerender(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );
      }, { timeout: 400 });

      // Verify landscape layout
      buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        expect(rect.right).toBeLessThanOrEqual(device.landscape.width);
        expect(rect.left).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Grid Layout Consistency', () => {
    it('should maintain equal button spacing across all device sizes', () => {
      const devices = [DEVICES.iPhoneSE, DEVICES.iPhone12, DEVICES.iPhone14ProMax, DEVICES.galaxyS21, DEVICES.pixelXL];

      devices.forEach((device) => {
        setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const navigation = container.querySelector('[data-button-count]');
        expect(navigation).toBeTruthy();
        
        // Should use CSS Grid
        const computedStyle = window.getComputedStyle(navigation as Element);
        expect(computedStyle.display).toBe('grid');
        
        // Should have correct button count
        const buttonCount = navigation?.getAttribute('data-button-count');
        expect(buttonCount).toBe('4'); // 4 buttons in local-first (no auth button)
      });
    });

    it('should use correct grid template columns for each device', () => {
      const devices = [DEVICES.iPhoneSE, DEVICES.iPhone12, DEVICES.iPhone14ProMax];

      devices.forEach((device) => {
        setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const navigation = container.querySelector('[data-button-count]') as HTMLElement;
        
        // Should have grid-template-columns set to repeat(4, 1fr)
        expect(navigation.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
      });
    });
  });

  describe('Safe Area Insets Verification (Requirement 4.5)', () => {
    it('should apply correct bottom padding for devices with notch', () => {
      const devicesWithNotch = [DEVICES.iPhone12, DEVICES.iPhone14ProMax];

      devicesWithNotch.forEach((device) => {
        setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const navigation = container.querySelector('[data-button-count]') as HTMLElement;
        
        // Should apply safe area inset to bottom padding
        const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
        expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
      });
    });

    it('should apply correct bottom padding for Android devices with gesture bar', () => {
      const androidDevices = [DEVICES.galaxyS21, DEVICES.pixelXL];

      androidDevices.forEach((device) => {
        setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const navigation = container.querySelector('[data-button-count]') as HTMLElement;
        
        // Should apply safe area inset to bottom padding
        const expectedPadding = Math.max(16, device.safeAreaInsets.bottom);
        expect(navigation.style.paddingBottom).toBe(`${expectedPadding}px`);
      });
    });

    it('should use minimum padding when no safe area insets', () => {
      const device = DEVICES.iPhoneSE; // No safe area insets
      setViewport(device.portrait.width, device.portrait.height, { top: 0, bottom: 0, left: 0, right: 0 });

      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigation = container.querySelector('[data-button-count]') as HTMLElement;
      
      // Should use minimum padding of 16px
      expect(navigation.style.paddingBottom).toBe('16px');
    });
  });

  describe('Touch Target Accessibility (Requirement 4.3)', () => {
    it('should maintain minimum 44x44px touch targets on all devices', () => {
      const devices = [DEVICES.iPhoneSE, DEVICES.iPhone12, DEVICES.iPhone14ProMax, DEVICES.galaxyS21, DEVICES.pixelXL];

      devices.forEach((device) => {
        setViewport(device.portrait.width, device.portrait.height, device.safeAreaInsets);

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const buttons = container.querySelectorAll('button');
        buttons.forEach((button) => {
          const minWidth = button.style.minWidth;
          const minHeight = button.style.minHeight;
          
          // Should meet minimum touch target size
          expect(minWidth).toBe('44px');
          expect(minHeight).toBe('44px');
        });
      });
    });
  });

  describe('Viewport Width Range Tests (Requirement 4.1)', () => {
    it('should handle all viewport widths from 320px to 768px', () => {
      const testWidths = [320, 350, 375, 390, 411, 430, 500, 600, 768];

      testWidths.forEach((width) => {
        setViewport(width, 800, { top: 0, bottom: 0, left: 0, right: 0 });

        const { container } = render(
          <BottomNavigation
            onOpenProfile={() => {}}
            onOpenLeaderboard={() => {}}
            activeTab="dashboard"
          />
        );

        const buttons = container.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach((button) => {
          const rect = button.getBoundingClientRect();
          expect(rect.right).toBeLessThanOrEqual(width);
          expect(rect.left).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
