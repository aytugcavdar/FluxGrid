import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AdBanner } from '../AdBanner';
import { AdManager } from '@core/services/ads/AdManager';

// Mock AdManager
vi.mock('@utils/adManager', () => ({
  AdManager: {
    showBanner: vi.fn(),
    hideBanner: vi.fn(),
    isNoAdsActive: vi.fn(() => false),
  },
}));

// Mock tutorial store
vi.mock('@shared/store/tutorialStore', () => ({
  useTutorialStore: vi.fn(() => ({
    isActive: false,
  })),
}));

describe('AdBanner - Timing and Safe Area', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock native platform
    (window as any).Capacitor = {
      isNativePlatform: () => true,
    };
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { 
      value: 400, 
      writable: true,
      configurable: true 
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).Capacitor;
  });

  describe('Banner Display Timing', () => {
    it('should delay showBanner() call by 1500ms on native platform', async () => {
      render(<AdBanner position="bottom" />);
      
      // showBanner should not be called immediately
      expect(AdManager.showBanner).not.toHaveBeenCalled();
      
      // Fast-forward 1000ms - still should not be called
      vi.advanceTimersByTime(1000);
      expect(AdManager.showBanner).not.toHaveBeenCalled();
      
      // Fast-forward to 1500ms - now it should be called
      vi.advanceTimersByTime(500);
      expect(AdManager.showBanner).toHaveBeenCalledTimes(1);
    });

    it('should call hideBanner on unmount', () => {
      const { unmount } = render(<AdBanner position="bottom" />);
      
      // Advance timers to trigger showBanner
      vi.advanceTimersByTime(1500);
      expect(AdManager.showBanner).toHaveBeenCalled();
      
      // Unmount component
      unmount();
      
      // hideBanner should be called
      expect(AdManager.hideBanner).toHaveBeenCalledTimes(1);
    });

    it('should clear timeout on unmount before showBanner is called', () => {
      const { unmount } = render(<AdBanner position="bottom" />);
      
      // Unmount before 1500ms
      vi.advanceTimersByTime(500);
      unmount();
      
      // Advance timers past 1500ms
      vi.advanceTimersByTime(1500);
      
      // showBanner should not be called because timeout was cleared
      expect(AdManager.showBanner).not.toHaveBeenCalled();
      
      // But hideBanner should still be called
      expect(AdManager.hideBanner).toHaveBeenCalledTimes(1);
    });
  });

  describe('Platform Control', () => {
    it('should not show banner on web platform', () => {
      // Mock web platform
      delete (window as any).Capacitor;
      
      const { container } = render(<AdBanner position="bottom" />);
      
      // Advance timers
      vi.advanceTimersByTime(1500);
      
      // showBanner should not be called
      expect(AdManager.showBanner).not.toHaveBeenCalled();
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', { 
        value: 380, 
        writable: true,
        configurable: true 
      });
      
      const { container } = render(<AdBanner position="bottom" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no-ads is active', () => {
      // Mock no-ads active
      vi.mocked(AdManager.isNoAdsActive).mockReturnValue(true);
      
      const { container } = render(<AdBanner position="bottom" />);
      
      expect(container.firstChild).toBeNull();
    });
  });
});
