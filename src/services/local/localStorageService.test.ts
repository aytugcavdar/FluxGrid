/**
 * Unit tests for LocalStorageService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService, STORAGE_KEYS, StorageErrorType, LocalStorageError } from './localStorageService';
import { GameMode } from '@shared/types';
import type { GameStats } from '@shared/types';
import { PassiveAbilityType } from '@features/abilities/types';
import type { PassiveAbilityData, GameState } from './localStorageService';

describe('LocalStorageService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Storage Keys', () => {
    it('should have all required storage keys defined', () => {
      expect(STORAGE_KEYS.GAME_STATE).toBe('flux_game_state');
      expect(STORAGE_KEYS.HIGH_SCORES).toBe('flux_high_scores');
      expect(STORAGE_KEYS.STATS).toBe('flux_stats');
      expect(STORAGE_KEYS.PASSIVE_ABILITIES).toBe('flux_passive_abilities');
      expect(STORAGE_KEYS.DEPRECATED).toBeInstanceOf(Array);
    });
  });

  describe('High Scores Management', () => {
    it('should save and load high scores', () => {
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      const highScores = LocalStorageService.loadHighScores();
      
      expect(highScores[GameMode.ENDLESS]).toBe(1000);
    });

    it('should only update high score if new score is higher', () => {
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 500);
      
      const highScores = LocalStorageService.loadHighScores();
      expect(highScores[GameMode.ENDLESS]).toBe(1000);
    });

    it('should update high score if new score is higher', () => {
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 500);
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      
      const highScores = LocalStorageService.loadHighScores();
      expect(highScores[GameMode.ENDLESS]).toBe(1000);
    });

    it('should maintain separate high scores for different modes', () => {
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      LocalStorageService.saveHighScore(GameMode.TIMED, 500);
      
      const highScores = LocalStorageService.loadHighScores();
      expect(highScores[GameMode.ENDLESS]).toBe(1000);
      expect(highScores[GameMode.TIMED]).toBe(500);
    });

    it('should return default high scores when no data exists', () => {
      const highScores = LocalStorageService.loadHighScores();
      
      expect(highScores[GameMode.ENDLESS]).toBe(0);
      expect(highScores[GameMode.TIMED]).toBe(0);
      expect(highScores[GameMode.ZEN]).toBe(0);
      expect(highScores[GameMode.DAILY_CHALLENGE]).toBe(0);
    });
  });

  describe('Statistics Management', () => {
    it('should save and load statistics', () => {
      const stats: GameStats = {
        blocksPlaced: 100,
        linesCleared: 50,
        totalScore: 5000,
        bombsExploded: 10,
        iceBroken: 5,
        gamesPlayed: 3,
        skillUses: { REROLL: 2, SHATTER: 1 },
      };

      LocalStorageService.saveStats(stats);
      const loaded = LocalStorageService.loadStats();
      
      expect(loaded).toEqual(stats);
    });

    it('should return null when no statistics exist', () => {
      const stats = LocalStorageService.loadStats();
      expect(stats).toBeNull();
    });

    it('should reject invalid statistics', () => {
      const invalidStats = {
        blocksPlaced: -1, // Invalid: negative value
        linesCleared: 50,
        totalScore: 5000,
        bombsExploded: 10,
        iceBroken: 5,
        gamesPlayed: 3,
        skillUses: {},
      };

      // Should not throw, but should handle gracefully
      LocalStorageService.saveStats(invalidStats as GameStats);
      
      // Should return null because validation failed
      const loaded = LocalStorageService.loadStats();
      expect(loaded).toBeNull();
    });
  });

  describe('Passive Abilities Management', () => {
    it('should save and load passive abilities', () => {
      const abilities: PassiveAbilityData = {
        unlocked: [PassiveAbilityType.FLUX_BOOST, PassiveAbilityType.SCORE_MULTIPLIER],
        equipped: [PassiveAbilityType.FLUX_BOOST],
        maxLevel: 3,
      };

      LocalStorageService.savePassiveAbilities(abilities);
      const loaded = LocalStorageService.loadPassiveAbilities();
      
      expect(loaded).toEqual(abilities);
    });

    it('should return null when no passive abilities exist', () => {
      const abilities = LocalStorageService.loadPassiveAbilities();
      expect(abilities).toBeNull();
    });

    it('should reject invalid passive abilities', () => {
      const invalidAbilities = {
        unlocked: 'not-an-array', // Invalid: should be array
        equipped: [],
        maxLevel: 3,
      };

      LocalStorageService.savePassiveAbilities(invalidAbilities as any);
      
      const loaded = LocalStorageService.loadPassiveAbilities();
      expect(loaded).toBeNull();
    });
  });

  describe('Clear All Game Data', () => {
    it('should clear all game-related data', () => {
      // Set up some data
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      const stats: GameStats = {
        blocksPlaced: 100,
        linesCleared: 50,
        totalScore: 5000,
        bombsExploded: 10,
        iceBroken: 5,
        gamesPlayed: 3,
        skillUses: {},
      };
      LocalStorageService.saveStats(stats);
      
      // Set a non-game setting
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      
      // Clear game data
      LocalStorageService.clearAllGameData();
      
      // Game data should be cleared
      const highScores = LocalStorageService.loadHighScores();
      expect(highScores[GameMode.ENDLESS]).toBe(0);
      
      const loadedStats = LocalStorageService.loadStats();
      expect(loadedStats).toBeNull();
      
      // Non-game settings should be preserved
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
    });

    it('should remove deprecated keys', () => {
      // Set deprecated keys
      STORAGE_KEYS.DEPRECATED.forEach(key => {
        localStorage.setItem(key, 'old-data');
      });
      
      LocalStorageService.clearAllGameData();
      
      // Deprecated keys should be removed
      STORAGE_KEYS.DEPRECATED.forEach(key => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted JSON data gracefully', () => {
      // Set corrupted data
      localStorage.setItem(STORAGE_KEYS.STATS, 'not-valid-json{');
      
      const stats = LocalStorageService.loadStats();
      expect(stats).toBeNull();
    });

    it('should handle missing required fields', () => {
      const incompleteStats = {
        blocksPlaced: 100,
        // Missing other required fields
      };
      
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(incompleteStats));
      
      const stats = LocalStorageService.loadStats();
      expect(stats).toBeNull();
    });
  });

  describe('Storage Availability', () => {
    it('should report storage availability', () => {
      const isAvailable = LocalStorageService.isStorageAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should calculate storage usage', () => {
      // Save some data first
      LocalStorageService.saveHighScore(GameMode.ENDLESS, 1000);
      LocalStorageService.saveHighScore(GameMode.TIMED, 500);
      
      const stats: GameStats = {
        blocksPlaced: 100,
        linesCleared: 50,
        totalScore: 5000,
        bombsExploded: 10,
        iceBroken: 5,
        gamesPlayed: 3,
        skillUses: {},
      };
      LocalStorageService.saveStats(stats);
      
      const usage = LocalStorageService.getStorageUsage();
      // Usage should be a non-negative number
      expect(typeof usage).toBe('number');
      expect(usage).toBeGreaterThanOrEqual(0);
    });
  });
});
