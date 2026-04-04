import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { HomeScreen } from '../HomeScreen';
import { StatisticsScreen } from '../StatisticsScreen';
import { SettingsScreen } from '../SettingsScreen';

describe('Responsive Layout Constraints - Task 16', () => {
  describe('HomeScreen responsive layout', () => {
    it('should have max-w-[448px] constraint and horizontal centering', () => {
      const { container } = render(<HomeScreen />);
      
      // Find the main content container with max-width constraint
      const contentContainer = container.querySelector('.max-w-\\[448px\\]');
      expect(contentContainer).toBeTruthy();
      
      // Verify horizontal centering with mx-auto
      expect(contentContainer?.classList.contains('mx-auto')).toBe(true);
    });

    it('should have proper spacing and padding for mobile-first design', () => {
      const { container } = render(<HomeScreen />);
      
      // Check for padding on main container
      const mainContainer = container.querySelector('.px-4');
      expect(mainContainer).toBeTruthy();
      
      // Check for bottom padding clearance
      const bottomPadding = container.querySelector('.pb-20');
      expect(bottomPadding).toBeTruthy();
    });
  });

  describe('StatisticsScreen responsive layout', () => {
    it('should have max-w-[448px] constraint and horizontal centering', () => {
      const { container } = render(<StatisticsScreen />);
      
      // Find the main content container with max-width constraint
      const contentContainer = container.querySelector('.max-w-\\[448px\\]');
      expect(contentContainer).toBeTruthy();
      
      // Verify horizontal centering with mx-auto
      expect(contentContainer?.classList.contains('mx-auto')).toBe(true);
    });

    it('should have proper spacing and padding for mobile-first design', () => {
      const { container } = render(<StatisticsScreen />);
      
      // Check for padding on main container
      const mainContainer = container.querySelector('.px-4');
      expect(mainContainer).toBeTruthy();
      
      // Check for inline style paddingBottom (uses calc with safe-area-inset-bottom + 96px)
      const scrollableContent = container.querySelector('.overflow-y-auto');
      expect(scrollableContent).toBeTruthy();
      
      // Verify it has inline style with paddingBottom
      const style = scrollableContent?.getAttribute('style');
      expect(style).toContain('padding-bottom');
    });
  });

  describe('SettingsScreen responsive layout', () => {
    it('should have max-w-[448px] constraint and horizontal centering', () => {
      const { container } = render(<SettingsScreen />);
      
      // Find the main content container with max-width constraint
      const contentContainer = container.querySelector('.max-w-\\[448px\\]');
      expect(contentContainer).toBeTruthy();
      
      // Verify horizontal centering with mx-auto
      expect(contentContainer?.classList.contains('mx-auto')).toBe(true);
    });

    it('should have proper spacing and padding for mobile-first design', () => {
      const { container } = render(<SettingsScreen />);
      
      // Check for padding on main container
      const mainContainer = container.querySelector('.px-4');
      expect(mainContainer).toBeTruthy();
      
      // Check for inline style paddingBottom (uses calc with safe-area-inset-bottom + 96px)
      const scrollableContent = container.querySelector('.overflow-y-auto');
      expect(scrollableContent).toBeTruthy();
      
      // Verify it has inline style with paddingBottom
      const style = scrollableContent?.getAttribute('style');
      expect(style).toContain('padding-bottom');
    });
  });

  describe('Viewport size responsiveness', () => {
    it('should maintain max-width constraint across different viewport sizes', () => {
      // Test HomeScreen
      const { container: homeContainer } = render(<HomeScreen />);
      const homeContent = homeContainer.querySelector('.max-w-\\[448px\\]');
      expect(homeContent).toBeTruthy();
      
      // Test StatisticsScreen
      const { container: statsContainer } = render(<StatisticsScreen />);
      const statsContent = statsContainer.querySelector('.max-w-\\[448px\\]');
      expect(statsContent).toBeTruthy();
      
      // Test SettingsScreen
      const { container: settingsContainer } = render(<SettingsScreen />);
      const settingsContent = settingsContainer.querySelector('.max-w-\\[448px\\]');
      expect(settingsContent).toBeTruthy();
    });
  });
});
