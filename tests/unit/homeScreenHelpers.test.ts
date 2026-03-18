/**
 * Unit tests for home screen helper functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isNewUser,
  shouldShowStats,
  getAllModeStats,
  saveModeStats,
  updateModeStats,
  getLastPlayedMode,
  getHighestScoringMode,
  getModeHighScore,
  getPrimaryAction,
  getModeName,
  type ModeStats,
} from '@utils/homeScreenHelpers';
import { GameMode, GameStats } from '@shared/types';

describe('Home Screen Helpers', () => {
  beforeEach(() => {
    // localStorage is already mocked in tests/setup.ts and cleared after each test
  });

  describe('isNewUser', () => {
    it('returns true when gamesPlayed is 0', () => {
      const stats: GameStats = {
        gamesPlayed: 0,
        blocksPlaced: 0,
        linesCleared: 0,
        totalScore: 0,
        bombsExploded: 0,
        iceBroken: 0,
        skillUses: {},
      };
      expect(isNewUser(stats)).toBe(true);
    });

    it('returns false when gamesPlayed is greater than 0', () => {
      const stats: GameStats = {
        gamesPlayed: 5,
        blocksPlaced: 100,
        linesCleared: 20,
        totalScore: 1000,
        bombsExploded: 2,
        iceBroken: 5,
        skillUses: {},
      };
      expect(isNewUser(stats)).toBe(false);
    });
  });

  describe('shouldShowStats', () => {
    it('returns false when gamesPlayed is 0', () => {
      const stats: GameStats = {
        gamesPlayed: 0,
        blocksPlaced: 0,
        linesCleared: 0,
        totalScore: 0,
        bombsExploded: 0,
        iceBroken: 0,
        skillUses: {},
      };
      expect(shouldShowStats(stats)).toBe(false);
    });

    it('returns false when gamesPlayed is 2', () => {
      const stats: GameStats = {
        gamesPlayed: 2,
        blocksPlaced: 50,
        linesCleared: 10,
        totalScore: 500,
        bombsExploded: 1,
        iceBroken: 2,
        skillUses: {},
      };
      expect(shouldShowStats(stats)).toBe(false);
    });

    it('returns true when gamesPlayed is greater than 2', () => {
      const stats: GameStats = {
        gamesPlayed: 3,
        blocksPlaced: 100,
        linesCleared: 20,
        totalScore: 1000,
        bombsExploded: 2,
        iceBroken: 5,
        skillUses: {},
      };
      expect(shouldShowStats(stats)).toBe(true);
    });
  });

  describe('Mode Stats Management', () => {
    it('getAllModeStats returns empty object when no data exists', () => {
      const stats = getAllModeStats();
      expect(stats).toEqual({});
    });

    it('saveModeStats and getAllModeStats work together', () => {
      const modeStats: Record<string, ModeStats> = {
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: Date.now(),
          highScore: 1000,
          timesPlayed: 5,
        },
      };

      saveModeStats(modeStats);
      const retrieved = getAllModeStats();
      
      expect(retrieved[GameMode.ENDLESS]).toBeDefined();
      expect(retrieved[GameMode.ENDLESS].highScore).toBe(1000);
      expect(retrieved[GameMode.ENDLESS].timesPlayed).toBe(5);
    });

    it('updateModeStats creates new entry for first play', () => {
      updateModeStats(GameMode.ENDLESS, 500);
      
      const stats = getAllModeStats();
      expect(stats[GameMode.ENDLESS]).toBeDefined();
      expect(stats[GameMode.ENDLESS].highScore).toBe(500);
      expect(stats[GameMode.ENDLESS].timesPlayed).toBe(1);
    });

    it('updateModeStats updates existing entry', () => {
      updateModeStats(GameMode.ENDLESS, 500);
      updateModeStats(GameMode.ENDLESS, 800);
      
      const stats = getAllModeStats();
      expect(stats[GameMode.ENDLESS].highScore).toBe(800);
      expect(stats[GameMode.ENDLESS].timesPlayed).toBe(2);
    });

    it('updateModeStats keeps highest score', () => {
      updateModeStats(GameMode.ENDLESS, 1000);
      updateModeStats(GameMode.ENDLESS, 500);
      
      const stats = getAllModeStats();
      expect(stats[GameMode.ENDLESS].highScore).toBe(1000);
    });
  });

  describe('getLastPlayedMode', () => {
    it('returns null when no modes have been played', () => {
      expect(getLastPlayedMode()).toBeNull();
    });

    it('returns the most recently played mode', () => {
      const now = Date.now();
      
      saveModeStats({
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: now - 1000,
          highScore: 500,
          timesPlayed: 1,
        },
        [GameMode.TIMED]: {
          mode: GameMode.TIMED,
          lastPlayed: now,
          highScore: 300,
          timesPlayed: 1,
        },
      });

      expect(getLastPlayedMode()).toBe(GameMode.TIMED);
    });
  });

  describe('getHighestScoringMode', () => {
    it('returns null when no modes have been played', () => {
      expect(getHighestScoringMode()).toBeNull();
    });

    it('returns the mode with the highest score', () => {
      saveModeStats({
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: Date.now(),
          highScore: 1500,
          timesPlayed: 5,
        },
        [GameMode.TIMED]: {
          mode: GameMode.TIMED,
          lastPlayed: Date.now(),
          highScore: 800,
          timesPlayed: 3,
        },
      });

      expect(getHighestScoringMode()).toBe(GameMode.ENDLESS);
    });
  });

  describe('getModeHighScore', () => {
    it('returns 0 when mode has no high score', () => {
      const highScores = {};
      expect(getModeHighScore(GameMode.ENDLESS, highScores)).toBe(0);
    });

    it('returns the high score for the mode', () => {
      const highScores = {
        [GameMode.ENDLESS]: 1500,
        [GameMode.TIMED]: 800,
      };
      expect(getModeHighScore(GameMode.ENDLESS, highScores)).toBe(1500);
    });
  });

  describe('getPrimaryAction', () => {
    it('returns OYNA for new users', () => {
      const stats: GameStats = {
        gamesPlayed: 0,
        blocksPlaced: 0,
        linesCleared: 0,
        totalScore: 0,
        bombsExploded: 0,
        iceBroken: 0,
        skillUses: {},
      };
      const highScores = {};

      const action = getPrimaryAction(stats, highScores);
      
      expect(action.label).toBe('OYNA');
      expect(action.mode).toBe(GameMode.ENDLESS);
      expect(action.showTutorialLink).toBe(true);
    });

    it('returns last played mode for returning users', () => {
      const stats: GameStats = {
        gamesPlayed: 5,
        blocksPlaced: 100,
        linesCleared: 20,
        totalScore: 1000,
        bombsExploded: 2,
        iceBroken: 5,
        skillUses: {},
      };
      const highScores = {
        [GameMode.TIMED]: 800,
      };

      const now = Date.now();
      saveModeStats({
        [GameMode.TIMED]: {
          mode: GameMode.TIMED,
          lastPlayed: now,
          highScore: 800,
          timesPlayed: 3,
        },
      });

      const action = getPrimaryAction(stats, highScores);
      
      expect(action.mode).toBe(GameMode.TIMED);
      expect(action.score).toBe(800);
      expect(action.showTutorialLink).toBe(false);
    });

    it('returns TEKRAR OYNA when mode has a high score', () => {
      const stats: GameStats = {
        gamesPlayed: 5,
        blocksPlaced: 100,
        linesCleared: 20,
        totalScore: 1000,
        bombsExploded: 2,
        iceBroken: 5,
        skillUses: {},
      };
      const highScores = {
        [GameMode.ENDLESS]: 1500,
      };

      saveModeStats({
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: Date.now(),
          highScore: 1500,
          timesPlayed: 5,
        },
      });

      const action = getPrimaryAction(stats, highScores);
      
      expect(action.label).toBe('TEKRAR OYNA');
    });

    it('returns DEVAM ET when mode has no high score', () => {
      const stats: GameStats = {
        gamesPlayed: 5,
        blocksPlaced: 100,
        linesCleared: 20,
        totalScore: 1000,
        bombsExploded: 2,
        iceBroken: 5,
        skillUses: {},
      };
      const highScores = {};

      saveModeStats({
        [GameMode.ENDLESS]: {
          mode: GameMode.ENDLESS,
          lastPlayed: Date.now(),
          highScore: 0,
          timesPlayed: 1,
        },
      });

      const action = getPrimaryAction(stats, highScores);
      
      expect(action.label).toBe('DEVAM ET');
    });
  });

  describe('getModeName', () => {
    it('returns correct Turkish names for all modes', () => {
      expect(getModeName(GameMode.ENDLESS)).toBe('Sonsuz');
      expect(getModeName(GameMode.TIMED)).toBe('Zamanlı');
      expect(getModeName(GameMode.ZEN)).toBe('Zen');
      expect(getModeName(GameMode.DAILY_CHALLENGE)).toBe('Günlük');
      expect(getModeName(GameMode.CAREER)).toBe('Kariyer');
      expect(getModeName(GameMode.SURVIVAL)).toBe('Hayatta Kalma');
      // BLITZ and PUZZLE modes removed
    });
  });
});
