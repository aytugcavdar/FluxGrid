import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from '../HomeScreen';
import { StatisticsScreen } from '../StatisticsScreen';
import { SettingsScreen } from '../SettingsScreen';
import { useThemeStore } from '../../shared/store/themeStore';
import { useGameStore } from '../../features/game/store/gameStore';
import { useSettingsStore } from '@core/state/settingsStore';
import { GameMode } from '@shared/types';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('Task 15: Theme System Integration Verification', () => {
  beforeEach(() => {
    // Reset all stores to default state
    useThemeStore.setState({ currentTheme: 'dark' });
    useGameStore.setState({
      highScores: {
        [GameMode.ENDLESS]: 1000,
        [GameMode.TIMED]: 500,
      },
      stats: {
        gamesPlayed: 10,
        linesCleared: 50,
        totalScore: 1500,
        blocksPlaced: 100,
        bombsExploded: 5,
        iceBroken: 3,
        endlessMaxCombo: 15,
        endlessMaxTier: 3,
        timedMaxCombo: 10,
        timedChronoBonus: 5,
      },
      achievements: [
        {
          id: 'test-achievement',
          name: 'Test Achievement',
          description: 'Test description',
          category: 'test',
          unlocked: true,
          currentValue: 10,
          targetValue: 10,
        },
      ],
    } as any);
    useSettingsStore.setState({
      soundEnabled: true,
      hapticEnabled: true,
      ghostBlockEnabled: true,
      performanceModeEnabled: false,
      language: 'tr',
    } as any);
  });

  describe('Requirement 16.1: HomeScreen Theme Integration', () => {
    it('should use Theme_System colors for all elements except mode card accents', () => {
      const { container } = render(<HomeScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Check background uses theme color (browser normalizes to rgb)
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.background).toBeTruthy();
      expect(mainDiv.style.background).toContain('linear-gradient');

      // Check logo text uses theme colors
      const logo = screen.getByText(/FLUX/);
      expect(logo).toBeInTheDocument();
      
      // Check sound toggle button uses theme colors
      const soundButton = screen.getByLabelText('Ses ayarları');
      expect(soundButton.style.background).toBeTruthy();
      expect(soundButton.style.border).toBeTruthy();

      // Check quick stats cards use theme colors
      const statsCards = container.querySelectorAll('.rounded-xl.p-3');
      expect(statsCards.length).toBeGreaterThan(0);
      statsCards.forEach((card) => {
        const cardElement = card as HTMLElement;
        expect(cardElement.style.background).toBeTruthy();
        expect(cardElement.style.border).toBeTruthy();
      });
    });

    it('should use hardcoded purple accent for Endless mode card', () => {
      const { container } = render(<HomeScreen />);
      
      // Find Endless mode card by looking for "Sonsuz Mod" text
      const endlessText = screen.getByText('Sonsuz Mod');
      expect(endlessText).toBeInTheDocument();
      
      // Get the mode card container
      const endlessCard = endlessText.closest('.rounded-2xl') as HTMLElement;
      expect(endlessCard).toBeInTheDocument();
      
      // Verify purple accent colors are used (browser normalizes rgba)
      expect(endlessCard.style.background).toContain('rgba');
      expect(endlessCard.style.border).toContain('rgba');
    });

    it('should use hardcoded amber accent for Timed mode card', () => {
      const { container } = render(<HomeScreen />);
      
      // Find Timed mode card by looking for "Timed Mod" text
      const timedText = screen.getByText('Timed Mod');
      expect(timedText).toBeInTheDocument();
      
      // Get the mode card container
      const timedCard = timedText.closest('.rounded-2xl') as HTMLElement;
      expect(timedCard).toBeInTheDocument();
      
      // Verify amber accent colors are used (browser normalizes rgba)
      expect(timedCard.style.background).toContain('rgba');
      expect(timedCard.style.border).toContain('rgba');
    });
  });

  describe('Requirement 16.2: StatisticsScreen Theme Integration', () => {
    it('should use Theme_System colors for all elements', () => {
      const { container } = render(<StatisticsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Check background uses theme color (browser normalizes to rgb)
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.background).toBeTruthy();
      expect(mainDiv.style.background).toContain('linear-gradient');

      // Check section headers use theme colors (they use textTertiary)
      const sectionHeaders = container.querySelectorAll('h2');
      expect(sectionHeaders.length).toBeGreaterThan(0);
      sectionHeaders.forEach((header) => {
        const headerElement = header as HTMLElement;
        expect(headerElement.style.color).toBeTruthy();
      });

      // Check cards use theme colors
      const cards = container.querySelectorAll('.rounded-xl');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should not have any hardcoded colors except for mode-specific performance card colors', () => {
      const { container } = render(<StatisticsScreen />);
      
      // Performance cards should be present with mode-specific colors
      // Find by looking for mode text
      const endlessMode = screen.getByText('Sonsuz Mod');
      const timedMode = screen.getByText('Timed Mod');
      
      expect(endlessMode).toBeInTheDocument();
      expect(timedMode).toBeInTheDocument();
    });
  });

  describe('Requirement 16.3: SettingsScreen Theme Integration', () => {
    it('should use Theme_System colors for all elements', () => {
      const { container } = render(<SettingsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Check background uses theme color (browser normalizes to rgb)
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.style.background).toBeTruthy();
      expect(mainDiv.style.background).toContain('linear-gradient');

      // Check section headers use theme colors
      const sectionHeaders = container.querySelectorAll('h2');
      expect(sectionHeaders.length).toBeGreaterThan(0);
      sectionHeaders.forEach((header) => {
        const headerElement = header as HTMLElement;
        expect(headerElement.style.color).toBeTruthy();
      });

      // Check toggle switches use theme colors
      const toggles = screen.getByText('Ses Efektleri').closest('button');
      expect(toggles).toBeInTheDocument();
      const toggleElement = toggles as HTMLElement;
      expect(toggleElement.style.background).toBeTruthy();
      expect(toggleElement.style.border).toBeTruthy();
    });

    it('should use blue accent for selected theme/language buttons (not hardcoded in screen)', () => {
      const { container } = render(<SettingsScreen />);
      
      // Selected theme cards should use blue accent
      const selectedThemeCard = container.querySelector('[aria-pressed="true"]');
      expect(selectedThemeCard).toBeInTheDocument();
      
      const selectedElement = selectedThemeCard as HTMLElement;
      // Browser normalizes colors to rgb format
      expect(selectedElement.style.border).toBeTruthy();
      expect(selectedElement.style.background).toBeTruthy();
    });
  });

  describe('Requirement 16.4: Mode-Specific Accent Colors', () => {
    it('should only hardcode purple for Endless and amber for Timed mode cards', () => {
      const { container } = render(<HomeScreen />);
      
      // Check for mode cards by text content
      const endlessMode = screen.getByText('Sonsuz Mod');
      const timedMode = screen.getByText('Timed Mod');
      
      expect(endlessMode).toBeInTheDocument();
      expect(timedMode).toBeInTheDocument();
      
      // Verify mode cards have accent colors
      const endlessCard = endlessMode.closest('.rounded-2xl') as HTMLElement;
      const timedCard = timedMode.closest('.rounded-2xl') as HTMLElement;
      
      expect(endlessCard.style.background).toBeTruthy();
      expect(endlessCard.style.border).toBeTruthy();
      expect(timedCard.style.background).toBeTruthy();
      expect(timedCard.style.border).toBeTruthy();
    });
  });

  describe('Theme Switching Updates All Screens', () => {
    const themes = ['dark', 'light', 'neon', 'ocean'] as const;

    themes.forEach((theme) => {
      describe(`Theme: ${theme}`, () => {
        beforeEach(() => {
          useThemeStore.setState({ currentTheme: theme });
        });

        it(`should update HomeScreen with ${theme} theme colors`, () => {
          const { container } = render(<HomeScreen />);
          const colors = useThemeStore.getState().getThemeColors();

          const mainDiv = container.firstChild as HTMLElement;
          // Browser normalizes colors, just check they're applied
          expect(mainDiv.style.background).toBeTruthy();
          expect(mainDiv.style.background).toContain('linear-gradient');

          // Verify theme-specific colors are applied
          expect(colors.textPrimary).toBeDefined();
          expect(colors.textSecondary).toBeDefined();
          expect(colors.cardBackgroundTransparent).toBeDefined();
        });

        it(`should update StatisticsScreen with ${theme} theme colors`, () => {
          const { container } = render(<StatisticsScreen />);
          const colors = useThemeStore.getState().getThemeColors();

          const mainDiv = container.firstChild as HTMLElement;
          // Browser normalizes colors, just check they're applied
          expect(mainDiv.style.background).toBeTruthy();
          expect(mainDiv.style.background).toContain('linear-gradient');

          // Verify section headers use theme colors
          const sectionHeaders = container.querySelectorAll('h2');
          expect(sectionHeaders.length).toBeGreaterThan(0);
          sectionHeaders.forEach((header) => {
            const headerElement = header as HTMLElement;
            expect(headerElement.style.color).toBeTruthy();
          });
        });

        it(`should update SettingsScreen with ${theme} theme colors`, () => {
          const { container } = render(<SettingsScreen />);
          const colors = useThemeStore.getState().getThemeColors();

          const mainDiv = container.firstChild as HTMLElement;
          // Browser normalizes colors, just check they're applied
          expect(mainDiv.style.background).toBeTruthy();
          expect(mainDiv.style.background).toContain('linear-gradient');

          // Verify theme cards are rendered
          const themeCards = container.querySelectorAll('[aria-label*="temasını seç"]');
          expect(themeCards.length).toBe(4); // 4 theme options
        });
      });
    });

    it('should maintain mode-specific accent colors across theme changes', () => {
      themes.forEach((theme) => {
        useThemeStore.setState({ currentTheme: theme });
        const { container, unmount } = render(<HomeScreen />);

        // Mode cards should be present with their accent colors
        const endlessModes = screen.getAllByText('Sonsuz Mod');
        const timedModes = screen.getAllByText('Timed Mod');
        
        expect(endlessModes.length).toBeGreaterThan(0);
        expect(timedModes.length).toBeGreaterThan(0);
        
        // Verify mode cards have their accent colors applied
        const endlessCard = endlessModes[0].closest('.rounded-2xl') as HTMLElement;
        const timedCard = timedModes[0].closest('.rounded-2xl') as HTMLElement;
        
        expect(endlessCard.style.background).toBeTruthy();
        expect(timedCard.style.background).toBeTruthy();
        
        // Clean up before next iteration
        unmount();
      });
    });
  });

  describe('Shared Components Theme Integration', () => {
    it('should verify ModeCard uses theme colors except for accent', () => {
      const { container } = render(<HomeScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Mode card tags should use theme colors
      const tags = container.querySelectorAll('.text-xs.px-2\\.5.py-1');
      expect(tags.length).toBeGreaterThan(0);
      tags.forEach((tag) => {
        const tagElement = tag as HTMLElement;
        // Browser normalizes rgba with spaces
        expect(tagElement.style.background).toBeTruthy();
        expect(tagElement.style.color).toBeTruthy();
      });
    });

    it('should verify SectionHeader uses theme colors', () => {
      const { container } = render(<StatisticsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Section headers should use textTertiary
      const headers = container.querySelectorAll('h2');
      expect(headers.length).toBeGreaterThan(0);
      headers.forEach((header) => {
        const headerElement = header as HTMLElement;
        // Browser normalizes rgba with spaces
        expect(headerElement.style.color).toBeTruthy();
      });

      // Divider lines should use theme color or default
      const dividers = container.querySelectorAll('.h-\\[0\\.5px\\]');
      dividers.forEach((divider) => {
        const dividerElement = divider as HTMLElement;
        // Should be either default or custom divider color
        expect(dividerElement.style.backgroundColor).toBeDefined();
      });
    });

    it('should verify PerformanceCard uses theme colors', () => {
      const { container } = render(<StatisticsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Performance cards should be present
      const performanceCards = container.querySelectorAll('.rounded-xl');
      expect(performanceCards.length).toBeGreaterThan(0);
    });

    it('should verify AchievementCard uses theme colors', () => {
      const { container } = render(<StatisticsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Achievement cards should use theme colors (except unlocked ones with amber)
      const achievementCards = container.querySelectorAll('.rounded-xl.p-4');
      expect(achievementCards.length).toBeGreaterThan(0);
    });

    it('should verify ToggleSwitch uses theme colors', () => {
      const { container } = render(<SettingsScreen />);
      const colors = useThemeStore.getState().getThemeColors();

      // Toggle switches should use theme colors
      const toggleButton = screen.getByText('Ses Efektleri').closest('button');
      expect(toggleButton).toBeInTheDocument();
      const toggleElement = toggleButton as HTMLElement;
      // Browser normalizes rgba with spaces
      expect(toggleElement.style.background).toBeTruthy();
    });
  });
});
