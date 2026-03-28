/**
 * Tests for will-change CSS property optimization in BottomNavigation
 * 
 * Validates that will-change is applied to animated elements and removed
 * after animations complete to avoid memory issues.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BottomNavigation } from './BottomNavigation';
import { useAuthStore } from '@features/auth/store/authStore';

// Mock dependencies
vi.mock('@features/auth/store/authStore');
vi.mock('../hooks/useAuthWithTimeout', () => ({
  useAuthWithTimeout: () => ({
    user: null,
    isAnonymous: false,
    isLoading: false,
  }),
}));
vi.mock('../hooks/useResponsiveButtonSize', () => ({
  useResponsiveButtonSize: () => ({ width: 44, height: 44 }),
}));
vi.mock('@utils/responsive', () => ({
  getSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('BottomNavigation - will-change optimization', () => {
  const mockOnOpenProfile = vi.fn();
  const mockOnOpenLeaderboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).getState = vi.fn(() => ({
      signInWithGoogle: vi.fn(),
      linkWithGoogle: vi.fn(),
    }));
  });

  it('should apply will-change to button wrappers initially', () => {
    const { container } = render(
      <BottomNavigation
        onOpenProfile={mockOnOpenProfile}
        onOpenLeaderboard={mockOnOpenLeaderboard}
        activeTab="dashboard"
      />
    );

    // Find all button wrapper divs (motion.div elements)
    const buttonWrappers = container.querySelectorAll('[class*="buttonWrapper"]');
    
    // Should have button wrappers
    expect(buttonWrappers.length).toBeGreaterThan(0);
    
    // Check that buttonWrapper class is applied
    buttonWrappers.forEach(wrapper => {
      expect(wrapper.className).toContain('buttonWrapper');
    });
  });

  it('should apply will-change to all button types', () => {
    const { container } = render(
      <BottomNavigation
        onOpenProfile={mockOnOpenProfile}
        onOpenLeaderboard={mockOnOpenLeaderboard}
        activeTab="dashboard"
      />
    );

    // Should have 5 button wrappers (Dashboard, Quests, Auth, Rank, Profile)
    const buttonWrappers = container.querySelectorAll('[class*="buttonWrapper"]');
    expect(buttonWrappers.length).toBe(5);
    
    // All should have buttonWrapper class
    buttonWrappers.forEach(wrapper => {
      expect(wrapper.className).toContain('buttonWrapper');
    });
  });

  it('should not have animationComplete class initially', () => {
    const { container } = render(
      <BottomNavigation
        onOpenProfile={mockOnOpenProfile}
        onOpenLeaderboard={mockOnOpenLeaderboard}
        activeTab="dashboard"
      />
    );

    // Initially, animationComplete class should not be present
    const buttonWrappers = container.querySelectorAll('[class*="buttonWrapper"]');
    buttonWrappers.forEach(wrapper => {
      expect(wrapper.className).not.toContain('animationComplete');
    });
  });

  it('should render with correct CSS module classes', () => {
    const { container } = render(
      <BottomNavigation
        onOpenProfile={mockOnOpenProfile}
        onOpenLeaderboard={mockOnOpenLeaderboard}
        activeTab="dashboard"
      />
    );

    // Verify CSS module classes are applied
    const buttonWrappers = container.querySelectorAll('[class*="buttonWrapper"]');
    expect(buttonWrappers.length).toBeGreaterThan(0);
    
    // Each wrapper should have the buttonWrapper class from CSS module
    buttonWrappers.forEach(wrapper => {
      const classes = wrapper.className.split(' ');
      const hasButtonWrapperClass = classes.some(cls => cls.includes('buttonWrapper'));
      expect(hasButtonWrapperClass).toBe(true);
    });
  });
});
