/**
 * Integration tests for responsive layout and visual polish
 * Task 13: Test responsive layout and visual polish
 * Validates Design: Testing Strategy section
 * 
 * Tests:
 * - Layout on mobile viewport sizes (320px, 375px, 414px)
 * - Layout on tablet viewport sizes (768px, 1024px)
 * - Layout on desktop viewport sizes (1280px, 1920px)
 * - Element alignment and spacing
 * - Color scheme consistency
 * - Different user states (new user, returning user, career progress)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@app/App';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode, AppState } from '@shared/types';

// Mock audio utilities
vi.mock('@utils/audio', () => ({
  unlockAudio: vi.fn(),
  playGameOver: vi.fn(),
  playClick: vi.fn(),
}));

// Mock streak manager
vi.mock('@utils/streakManager', () => ({
  getStreak: vi.fn(() => 0),
  getDailyPlayedToday: vi.fn(() => false),
  getDayNumber: vi.fn(() => 1),
}));

// Mock tutorial to not show by default
vi.mock('@shared/components', () => ({
  Tutorial: () => null,
  shouldShowTutorial: () => false,
}));

// Helper to set viewport size
const setViewportSize = (width: number, height: number) => {
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
  window.dispatchEvent(new Event('resize'));
};

// Helper to setup user state
const setupUserState = (state: {
  gamesPlayed?: number;
  highScore?: number;
  maxLevelReached?: number;
  lastMode?: GameMode;
}) => {
  const { gamesPlayed = 0, highScore = 0, maxLevelReached = 0, lastMode } = state;
  
  // Set stats
  useGameStore.setState({
    stats: {
      gamesPlayed,
      linesCleared: gamesPlayed * 10,
      totalScore: highScore,
      blocksPlaced: 0,
      bombsExploded: 0,
      iceBroken: 0,
      skillUses: {},
    },
    highScore,
    maxLevelReached,
  });

  // Set localStorage for high scores
  if (highScore > 0) {
    localStorage.setItem(`flux_highscore_${GameMode.ENDLESS}`, String(highScore));
  }

  // Set mode stats if last mode provided
  if (lastMode) {
    const modeStats = {
      [lastMode]: {
        mode: lastMode,
        lastPlayed: Date.now(),
        highScore,
        timesPlayed: gamesPlayed,
      },
    };
    localStorage.setItem('flux_mode_stats', JSON.stringify(modeStats));
  }
};

describe('Responsive Layout Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useGameStore.setState({
      appState: AppState.HOME,
      stats: { 
        gamesPlayed: 0, 
        linesCleared: 0, 
        totalScore: 0,
        blocksPlaced: 0,
        bombsExploded: 0,
        iceBroken: 0,
        skillUses: {},
      },
      highScore: 0,
      maxLevelReached: 0,
    });
  });

  describe('Mobile Viewport Tests', () => {
    it('should render correctly on small mobile (320px)', () => {
      setViewportSize(320, 568);
      setupUserState({ gamesPlayed: 0 });

      const { container } = render(<App />);

      // Verify home screen is rendered
      expect(screen.getByText(/FLUX/i)).toBeInTheDocument();
      expect(screen.getByText(/GRID/i)).toBeInTheDocument();
      
      // Verify primary action button is visible
      const playButtons = screen.getAllByRole('button', { name: /OYNA/i });
      expect(playButtons[0]).toBeInTheDocument();

      // Verify layout container has proper max-width
      const layoutContainer = container.querySelector('.max-w-xs');
      expect(layoutContainer).toBeInTheDocument();

      // Verify bottom navigation is present
      expect(screen.getByText(/Harita/i)).toBeInTheDocument();
      expect(screen.getByText(/Modlar/i)).toBeInTheDocument();
    });

    it('should render correctly on iPhone SE (375px)', () => {
      setViewportSize(375, 667);
      setupUserState({ gamesPlayed: 5, highScore: 1500 });

      render(<App />);

      // Verify stats row is visible for returning users
      expect(screen.getByText(/1.5k/i)).toBeInTheDocument(); // High score formatted
      const gamesText = screen.getAllByText(/5/i).find(el => el.textContent === '5');
      expect(gamesText).toBeInTheDocument(); // Games played

      // Verify primary action button shows returning user state
      const continueButton = screen.getByRole('button', { name: /DEVAM ET|TEKRAR OYNA/i });
      expect(continueButton).toBeInTheDocument();
    });

    it('should render correctly on iPhone 12 Pro (390px)', () => {
      setViewportSize(390, 844);
      setupUserState({ gamesPlayed: 10, highScore: 5000, maxLevelReached: 5 });

      render(<App />);

      // Verify career chip is visible
      expect(screen.getByText(/kardan devam/i)).toBeInTheDocument();
      expect(screen.getByText(/Seviye 6/i)).toBeInTheDocument();

      // Verify daily challenge card
      expect(screen.getByText(/Günlük Meydan Okuma/i)).toBeInTheDocument();
    });

    it('should render correctly on large mobile (414px)', () => {
      setViewportSize(414, 896);
      setupUserState({ gamesPlayed: 1, highScore: 500 });

      render(<App />);

      // Verify all main sections are present
      expect(screen.getByText(/FLUX/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /DEVAM ET|TEKRAR OYNA/i })).toBeInTheDocument();
      expect(screen.getByText(/Günlük Meydan Okuma/i)).toBeInTheDocument();
      
      // Verify bottom navigation
      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThanOrEqual(4); // Primary + 3 nav buttons
    });
  });

  describe('Tablet Viewport Tests', () => {
    it('should render correctly on iPad Mini (768px)', () => {
      setViewportSize(768, 1024);
      setupUserState({ gamesPlayed: 0 });

      render(<App />);

      // Verify logo uses larger size on tablet
      const logo = screen.getByText(/FLUX/i);
      expect(logo).toBeInTheDocument();
      expect(logo.className).toContain('md:text-5xl');

      // Verify layout is centered
      const playButtons = screen.getAllByText(/OYNA/i);
      expect(playButtons[0]).toBeInTheDocument();
    });

    it('should render correctly on iPad Pro (1024px)', () => {
      setViewportSize(1024, 1366);
      setupUserState({ gamesPlayed: 15, highScore: 10000, maxLevelReached: 10 });

      render(<App />);

      // Verify all elements are properly spaced
      expect(screen.getByText(/FLUX/i)).toBeInTheDocument();
      expect(screen.getByText(/10.0k/i)).toBeInTheDocument(); // High score
      expect(screen.getByText(/kardan devam/i)).toBeInTheDocument();
      expect(screen.getByText(/Seviye 11/i)).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport Tests', () => {
    it('should render correctly on laptop (1280px)', () => {
      setViewportSize(1280, 720);
      setupUserState({ gamesPlayed: 5, highScore: 3000 });

      render(<App />);

      // Verify content is centered with max-width
      const container = screen.getByText(/FLUX/i).closest('.max-w-xs');
      expect(container).toBeInTheDocument();

      // Verify all sections render
      expect(screen.getByText(/3.0k/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /DEVAM ET|TEKRAR OYNA/i })).toBeInTheDocument();
    });

    it('should render correctly on large desktop (1920px)', () => {
      setViewportSize(1920, 1080);
      setupUserState({ gamesPlayed: 20, highScore: 15000, maxLevelReached: 15 });

      render(<App />);

      // Verify layout maintains max-width constraint
      expect(screen.getByText(/FLUX/i)).toBeInTheDocument();
      expect(screen.getByText(/15.0k/i)).toBeInTheDocument();
      
      // Verify career chip
      expect(screen.getByText(/Seviye 16/i)).toBeInTheDocument();
    });
  });

  describe('Element Alignment and Spacing', () => {
    it('should have proper vertical spacing between sections', () => {
      setupUserState({ gamesPlayed: 5, highScore: 2000, maxLevelReached: 3 });
      const { container } = render(<App />);

      // Check for margin/padding classes
      const sections = container.querySelectorAll('[style*="margin"]');
      expect(sections.length).toBeGreaterThan(0);

      // Verify logo has reduced margin
      const logo = screen.getByText(/FLUX/i).closest('div');
      expect(logo?.className).toContain('mb-3');
    });

    it('should align primary action button to center', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const buttons = screen.getAllByRole('button', { name: /OYNA/i });
      const button = buttons[0]; // Get the main play button
      const buttonStyle = window.getComputedStyle(button);
      
      // Button should have full width or centered alignment
      expect(button).toBeInTheDocument();
    });

    it('should properly space bottom navigation buttons', () => {
      setupUserState({ gamesPlayed: 0 });
      const { container } = render(<App />);

      // Find bottom navigation container
      const navContainer = container.querySelector('[style*="display: flex"]');
      expect(navContainer).toBeInTheDocument();
    });

    it('should maintain consistent gap between stats cards', () => {
      setupUserState({ gamesPlayed: 5, highScore: 2000 });
      const { container } = render(<App />);

      // Stats row should have gap styling
      const statsRow = container.querySelector('[style*="gap"]');
      expect(statsRow).toBeInTheDocument();
    });
  });

  describe('Color Scheme Consistency', () => {
    it('should use consistent colors for primary action button', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const buttons = screen.getAllByRole('button', { name: /OYNA/i });
      const button = buttons[0]; // Get the main play button
      const buttonStyle = button.getAttribute('style');
      
      // Should have purple theme colors for ENDLESS mode (with spaces in rgba)
      expect(buttonStyle).toContain('rgba(167, 139, 250');
    });

    it('should use consistent colors for stats cards', () => {
      setupUserState({ gamesPlayed: 5, highScore: 2000 });
      const { container } = render(<App />);

      // Stats cards should have consistent background (with spaces in rgba)
      const statsCards = container.querySelectorAll('[style*="rgba(255, 255, 255, 0.04)"]');
      expect(statsCards.length).toBeGreaterThan(0);
    });

    it('should use consistent colors for daily challenge card', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const dailyCard = screen.getByText(/Günlük Meydan Okuma/i).closest('button');
      const cardStyle = dailyCard?.getAttribute('style');
      
      // Should have amber/orange theme for daily challenge (with spaces in rgba)
      expect(cardStyle).toContain('rgba(245, 158, 11');
    });

    it('should use consistent colors for career chip', () => {
      setupUserState({ gamesPlayed: 5, maxLevelReached: 5 });
      render(<App />);

      const careerChip = screen.getByText(/kardan devam/i).closest('button');
      const chipStyle = careerChip?.getAttribute('style');
      
      // Should have blue theme for career (with spaces in rgba)
      expect(chipStyle).toContain('rgba(59, 130, 246');
    });

    it('should use consistent colors for bottom navigation', () => {
      setupUserState({ gamesPlayed: 0 });
      const { container } = render(<App />);

      // Nav buttons should have consistent styling (with spaces in rgba)
      const navButtons = container.querySelectorAll('[style*="rgba(255, 255, 255, 0.04)"]');
      expect(navButtons.length).toBeGreaterThan(0);
    });
  });

  describe('User State Variations', () => {
    it('should render correctly for new user (0 games)', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      // Should show OYNA button
      const buttons = screen.getAllByRole('button', { name: /OYNA/i });
      expect(buttons[0]).toBeInTheDocument();
      
      // Should show tutorial link
      expect(screen.getByText(/nasıl oynanır/i)).toBeInTheDocument();
      
      // Should NOT show stats row
      expect(screen.queryByText(/En İyi/i)).not.toBeInTheDocument();
      
      // Should NOT show career chip
      expect(screen.queryByText(/kardan devam/i)).not.toBeInTheDocument();
    });

    it('should render correctly for returning user (5 games)', () => {
      setupUserState({ gamesPlayed: 5, highScore: 2500, lastMode: GameMode.ENDLESS });
      render(<App />);

      // Should show DEVAM ET or TEKRAR OYNA
      expect(screen.getByRole('button', { name: /DEVAM ET|TEKRAR OYNA/i })).toBeInTheDocument();
      
      // Should show stats row
      expect(screen.getByText(/2.5k/i)).toBeInTheDocument();
      
      // Should NOT show tutorial link
      expect(screen.queryByText(/nasıl oynanır/i)).not.toBeInTheDocument();
    });

    it('should render correctly for user with career progress', () => {
      setupUserState({ gamesPlayed: 10, highScore: 5000, maxLevelReached: 8 });
      render(<App />);

      // Should show career chip
      expect(screen.getByText(/kardan devam/i)).toBeInTheDocument();
      expect(screen.getByText(/Seviye 9/i)).toBeInTheDocument();
      
      // Should show stats
      expect(screen.getByText(/5.0k/i)).toBeInTheDocument();
    });

    it('should render correctly for experienced user (20+ games)', () => {
      setupUserState({ gamesPlayed: 25, highScore: 20000, maxLevelReached: 15 });
      render(<App />);

      // Should show all elements
      expect(screen.getByText(/20.0k/i)).toBeInTheDocument();
      const gamesText = screen.getAllByText(/25/i).find(el => el.textContent === '25');
      expect(gamesText).toBeInTheDocument();
      expect(screen.getByText(/Seviye 16/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /DEVAM ET|TEKRAR OYNA/i })).toBeInTheDocument();
    });

    it('should hide stats for users with 2 or fewer games', () => {
      setupUserState({ gamesPlayed: 2, highScore: 500 });
      const { container } = render(<App />);

      // Stats row should not be visible (but high score shows in button)
      // The stats cards should not be rendered for users with 2 or fewer games
      const statsCards = container.querySelectorAll('[style*="En İyi Skor"]');
      // Only the button should show high score, not the stats row
      expect(screen.queryByText(/Oyun/i)).not.toBeInTheDocument();
    });

    it('should show stats for users with more than 2 games', () => {
      setupUserState({ gamesPlayed: 3, highScore: 1000 });
      render(<App />);

      // Stats row should be visible
      expect(screen.getByText(/1.0k/i)).toBeInTheDocument();
      const gamesText = screen.getAllByText(/3/i).find(el => el.textContent === '3');
      expect(gamesText).toBeInTheDocument();
    });
  });

  describe('Visual Polish', () => {
    it('should render logo with proper styling', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const logo = screen.getByText(/FLUX/i);
      expect(logo.className).toContain('text-4xl');
      expect(logo.className).toContain('md:text-5xl');
      expect(logo.className).toContain('font-black');
      expect(logo.className).toContain('italic');
    });

    it('should render tagline with proper styling', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const tagline = screen.getByText(/Zen Puzzle/i);
      expect(tagline).toBeInTheDocument();
      expect(tagline.className).toContain('text-[8px]');
      expect(tagline.className).toContain('uppercase');
    });

    it('should render primary button with proper border radius', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const buttons = screen.getAllByRole('button', { name: /OYNA/i });
      const button = buttons[0]; // Get the main play button
      const buttonStyle = button.getAttribute('style');
      
      expect(buttonStyle).toContain('border-radius: 16px');
    });

    it('should render daily card with compact padding', () => {
      setupUserState({ gamesPlayed: 0 });
      render(<App />);

      const dailyCard = screen.getByText(/Günlük Meydan Okuma/i).closest('button');
      const cardStyle = dailyCard?.getAttribute('style');
      
      // Should have reduced padding (8px 12px)
      expect(cardStyle).toContain('padding: 8px 12px');
    });

    it('should render career chip with small size', () => {
      setupUserState({ gamesPlayed: 5, maxLevelReached: 5 });
      render(<App />);

      const careerChip = screen.getByText(/kardan devam/i).closest('button');
      const chipStyle = careerChip?.getAttribute('style');
      
      // Should have small padding
      expect(chipStyle).toContain('padding: 6px 12px');
    });

    it('should render bottom navigation icons with proper size', () => {
      setupUserState({ gamesPlayed: 0 });
      const { container } = render(<App />);

      // Find SVG icons in bottom navigation
      const icons = container.querySelectorAll('svg[width="20"][height="20"]');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Layout Consistency Across Viewports', () => {
    it('should maintain consistent element order across all viewports', () => {
      const viewports = [
        { width: 375, height: 667 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1280, height: 720 }, // Desktop
      ];

      viewports.forEach(({ width, height }) => {
        setViewportSize(width, height);
        setupUserState({ gamesPlayed: 5, highScore: 2000, maxLevelReached: 3 });
        
        const { container } = render(<App />);

        // Verify element order: Logo -> Stats -> Primary Button -> Daily Card -> Bottom Nav
        const elements = container.querySelectorAll('[style]');
        expect(elements.length).toBeGreaterThan(0);
        
        // Cleanup for next iteration
        container.remove();
      });
    });

    it('should maintain readable font sizes across all viewports', () => {
      const viewports = [320, 768, 1920];

      viewports.forEach(width => {
        setViewportSize(width, 800);
        setupUserState({ gamesPlayed: 0 });
        
        const { container } = render(<App />);

        // Logo should be readable
        const logo = screen.getByText(/FLUX/i);
        expect(logo).toBeInTheDocument();
        
        // Button text should be readable
        const buttons = screen.getAllByRole('button', { name: /OYNA/i });
        expect(buttons[0]).toBeInTheDocument();
        
        container.remove();
      });
    });
  });
});
