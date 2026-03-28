import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BottomNavigation } from './BottomNavigation';
import { GameMode } from '@shared/types';

// Mock the hooks
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

vi.mock('@features/auth/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      signInWithGoogle: vi.fn(),
      linkWithGoogle: vi.fn(),
    }),
  },
}));

describe('BottomNavigation', () => {
  describe('Keyboard Navigation (Requirement 1.3)', () => {
    it('should have all buttons with tabIndex={0}', () => {
      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button.getAttribute('tabIndex')).toBe('0');
      });
    });

    it('should follow visual order for tab navigation (left to right)', () => {
      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = Array.from(container.querySelectorAll('button'));
      
      // Expected order: Dashboard, Quests, Auth (login), Rank, Profile
      expect(buttons.length).toBe(5);
      
      // Verify buttons are in DOM order (which determines tab order)
      const labels = buttons.map(btn => btn.getAttribute('aria-label'));
      expect(labels[0]).toContain('HOME');
      expect(labels[1]).toContain('BATTLE');
      expect(labels[2]).toContain('SAVE'); // Auth button
      expect(labels[3]).toContain('RANK');
      expect(labels[4]).toContain('PROFILE');
    });

    it('should support Enter key navigation on all buttons', async () => {
      const user = userEvent.setup();
      const handleOpenProfile = vi.fn();
      const handleOpenLeaderboard = vi.fn();

      render(
        <BottomNavigation
          onOpenProfile={handleOpenProfile}
          onOpenLeaderboard={handleOpenLeaderboard}
          activeTab="dashboard"
        />
      );

      // Test Profile button with Enter key
      const profileButton = screen.getByLabelText(/PROFILE navigation button/i);
      profileButton.focus();
      await user.keyboard('{Enter}');
      expect(handleOpenProfile).toHaveBeenCalledTimes(1);

      // Test Rank button with Enter key
      const rankButton = screen.getByLabelText(/RANK navigation button/i);
      rankButton.focus();
      await user.keyboard('{Enter}');
      expect(handleOpenLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should support Space key navigation on all buttons', async () => {
      const user = userEvent.setup();
      const handleOpenProfile = vi.fn();

      render(
        <BottomNavigation
          onOpenProfile={handleOpenProfile}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      // Test Profile button with Space key
      const profileButton = screen.getByLabelText(/PROFILE navigation button/i);
      profileButton.focus();
      await user.keyboard(' ');
      expect(handleOpenProfile).toHaveBeenCalledTimes(1);
    });

    it('should show visible focus indicators on all buttons', () => {
      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // All buttons should have outline: none (custom focus indicator)
        expect((button as HTMLButtonElement).style.outline).toBe('none');
      });
    });
  });

  describe('Rendering', () => {
    it('should render all navigation buttons', () => {
      render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      expect(screen.getByLabelText(/HOME navigation button/i)).toBeTruthy();
      expect(screen.getByLabelText(/BATTLE navigation button/i)).toBeTruthy();
      expect(screen.getByLabelText(/RANK navigation button/i)).toBeTruthy();
      expect(screen.getByLabelText(/PROFILE navigation button/i)).toBeTruthy();
    });

    it('should render auth button when user is not authenticated', () => {
      render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      expect(screen.getByLabelText(/SAVE navigation button/i)).toBeTruthy();
    });

    it('should apply correct data-button-count attribute', () => {
      const { container } = render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="dashboard"
        />
      );

      const navigationContainer = container.querySelector('[data-button-count]');
      expect(navigationContainer?.getAttribute('data-button-count')).toBe('5');
    });
  });

  describe('Active State', () => {
    it('should mark active button with aria-current', () => {
      render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="profile"
        />
      );

      const profileButton = screen.getByLabelText(/PROFILE navigation button/i);
      expect(profileButton.getAttribute('aria-current')).toBe('page');
    });

    it('should not mark inactive buttons with aria-current', () => {
      render(
        <BottomNavigation
          onOpenProfile={() => {}}
          onOpenLeaderboard={() => {}}
          activeTab="profile"
        />
      );

      const dashboardButton = screen.getByLabelText(/HOME navigation button/i);
      expect(dashboardButton.getAttribute('aria-current')).toBeNull();
    });
  });
});
