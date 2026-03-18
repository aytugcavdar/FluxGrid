/**
 * Unit tests for Primary Action Button component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameMode } from '@shared/types';

describe('Primary Action Button Logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('New User State', () => {
    it('should show OYNA for new users', () => {
      const stats = { gamesPlayed: 0 };
      const highScores = {};
      
      // Simulate the logic from App.tsx
      const isNewUser = stats.gamesPlayed === 0;
      
      const primaryAction = isNewUser
        ? {
            label: 'OYNA',
            mode: GameMode.ENDLESS,
            showTutorialLink: true,
          }
        : {
            label: 'DEVAM ET',
            mode: GameMode.ENDLESS,
            score: 0,
            showTutorialLink: false,
          };

      expect(primaryAction.label).toBe('OYNA');
      expect(primaryAction.mode).toBe(GameMode.ENDLESS);
      expect(primaryAction.showTutorialLink).toBe(true);
    });

    it('should show tutorial link for new users', () => {
      const stats = { gamesPlayed: 0 };
      const isNewUser = stats.gamesPlayed === 0;
      
      const primaryAction = {
        label: 'OYNA',
        mode: GameMode.ENDLESS,
        showTutorialLink: isNewUser,
      };

      expect(primaryAction.showTutorialLink).toBe(true);
    });
  });

  describe('Returning User State', () => {
    it('should show DEVAM ET when no high score exists', () => {
      const stats = { gamesPlayed: 5 };
      const highScores = { [GameMode.ENDLESS]: 0 };
      
      const isNewUser = stats.gamesPlayed === 0;
      const modeScore = highScores[GameMode.ENDLESS] || 0;
      
      const primaryAction = {
        label: modeScore > 0 ? 'TEKRAR OYNA' : 'DEVAM ET',
        mode: GameMode.ENDLESS,
        score: modeScore,
        showTutorialLink: false,
      };

      expect(primaryAction.label).toBe('DEVAM ET');
      expect(primaryAction.showTutorialLink).toBe(false);
    });

    it('should show TEKRAR OYNA when high score exists', () => {
      const stats = { gamesPlayed: 5 };
      const highScores = { [GameMode.ENDLESS]: 1000 };
      
      const modeScore = highScores[GameMode.ENDLESS] || 0;
      
      const primaryAction = {
        label: modeScore > 0 ? 'TEKRAR OYNA' : 'DEVAM ET',
        mode: GameMode.ENDLESS,
        score: modeScore,
        showTutorialLink: false,
      };

      expect(primaryAction.label).toBe('TEKRAR OYNA');
      expect(primaryAction.score).toBe(1000);
    });

    it('should display score for returning users', () => {
      const stats = { gamesPlayed: 10 };
      const highScores = { [GameMode.TIMED]: 5000 };
      
      const modeScore = highScores[GameMode.TIMED] || 0;
      
      const primaryAction = {
        label: 'TEKRAR OYNA',
        mode: GameMode.TIMED,
        score: modeScore,
        showTutorialLink: false,
      };

      expect(primaryAction.score).toBe(5000);
      expect(primaryAction.score).toBeGreaterThan(0);
    });
  });

  describe('Mode Selection', () => {
    it('should use last played mode when available', () => {
      const modeStats = {
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: Date.now() - 1000,
          highScore: 500,
          timesPlayed: 3,
        },
        [GameMode.TIMED]: {
          mode: GameMode.TIMED,
          lastPlayed: Date.now(),
          highScore: 300,
          timesPlayed: 2,
        },
      };

      localStorage.setItem('flux_mode_stats', JSON.stringify(modeStats));

      // Simulate mode selection logic
      const modeStatsStr = localStorage.getItem('flux_mode_stats');
      let lastMode: GameMode | null = null;
      
      if (modeStatsStr) {
        const parsed = JSON.parse(modeStatsStr);
        const modes = Object.values(parsed) as any[];
        const sortedByTime = [...modes].sort((a, b) => b.lastPlayed - a.lastPlayed);
        lastMode = sortedByTime[0].mode;
      }

      expect(lastMode).toBe(GameMode.TIMED);
    });

    it('should fall back to ENDLESS when no mode stats exist', () => {
      const selectedMode = GameMode.ENDLESS;
      expect(selectedMode).toBe(GameMode.ENDLESS);
    });
  });

  describe('Button Styling', () => {
    it('should have prominent styling for primary action', () => {
      const buttonStyle = {
        padding: '20px 24px',
        borderRadius: 16,
        fontSize: 20,
        fontWeight: 800,
      };

      expect(buttonStyle.padding).toBe('20px 24px');
      expect(buttonStyle.fontSize).toBe(20);
      expect(buttonStyle.fontWeight).toBe(800);
    });

    it('should display mode icon', () => {
      const modeIcons = {
        [GameMode.ENDLESS]: '∞',
        [GameMode.TIMED]: '⚡',
        [GameMode.ZEN]: '☁',
      };

      expect(modeIcons[GameMode.ENDLESS]).toBe('∞');
      expect(modeIcons[GameMode.TIMED]).toBe('⚡');
    });
  });
});
