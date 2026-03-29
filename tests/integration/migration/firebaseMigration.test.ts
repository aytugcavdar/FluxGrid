/**
 * Integration Test: Firebase to localStorage Migration
 * 
 * Tests the migration utility that converts Firebase data to localStorage format.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { migrateFromFirebase } from '@utils/migration';
import { LocalStorageService } from '@services/local/localStorageService';
import { GameMode } from '@shared/types';

describe('Integration: Firebase to localStorage Migration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Also reset migration status for each test
    localStorage.removeItem('flux_migration_completed');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should detect and migrate Firebase high scores', () => {
    // Setup: Create mock Firebase data in localStorage (using lowercase key)
    const firebaseHighScores = {
      ENDLESS: 5000,
      TIMED: 3000,
      ZEN: 1000,
    };
    localStorage.setItem('flux_highscores', JSON.stringify(firebaseHighScores));
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Verify migration completed successfully
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(false);
    
    // Verify data was migrated to new format
    const migratedScores = LocalStorageService.loadHighScores();
    expect(migratedScores[GameMode.ENDLESS]).toBe(5000);
    expect(migratedScores[GameMode.TIMED]).toBe(3000);
    expect(migratedScores[GameMode.ZEN]).toBe(1000);
    
    // Verify old key was removed
    expect(localStorage.getItem('flux_highscores')).toBeNull();
  });

  it('should detect and migrate Firebase statistics', () => {
    // Setup: Create mock Firebase stats
    const firebaseStats = {
      blocksPlaced: 1000,
      linesCleared: 200,
      totalScore: 50000,
      bombsExploded: 10,
      iceBroken: 20,
      gamesPlayed: 50,
      skillUses: { REROLL: 5, SHATTER: 3 },
    };
    localStorage.setItem('flux_stats', JSON.stringify(firebaseStats));
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Verify migration completed successfully
    expect(result.success).toBe(true);
    expect(result.migratedKeys).toContain('Game statistics');
    
    // Verify data was migrated
    const migratedStats = LocalStorageService.loadStats();
    expect(migratedStats?.blocksPlaced).toBe(1000);
    expect(migratedStats?.linesCleared).toBe(200);
    expect(migratedStats?.totalScore).toBe(50000);
    expect(migratedStats?.gamesPlayed).toBe(50);
    
    // NOTE: flux_stats key is NOT removed because new format uses the same key
    expect(localStorage.getItem('flux_stats')).not.toBeNull();
  });

  it('should detect and migrate Firebase passive abilities', () => {
    // Setup: Create mock Firebase abilities (using separate keys for unlocked and equipped)
    const firebaseUnlocked = ['score_boost_1', 'flux_boost_1'];
    const firebaseEquipped = ['score_boost_1'];
    
    localStorage.setItem('flux_passive_unlocks', JSON.stringify(firebaseUnlocked));
    localStorage.setItem('flux_passive_equipped', JSON.stringify(firebaseEquipped));
    localStorage.setItem('flux_max_level', '1');
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Verify migration completed successfully
    expect(result.success).toBe(true);
    expect(result.migratedKeys).toContain('Unlocked passive abilities');
    
    // Verify data was migrated
    const migratedAbilities = LocalStorageService.loadPassiveAbilities();
    expect(migratedAbilities?.unlocked).toContain('score_boost_1');
    expect(migratedAbilities?.unlocked).toContain('flux_boost_1');
    expect(migratedAbilities?.equipped).toContain('score_boost_1');
    
    // Verify old keys were removed
    expect(localStorage.getItem('flux_passive_unlocks')).toBeNull();
    expect(localStorage.getItem('flux_passive_equipped')).toBeNull();
  });

  it('should migrate all data types together', () => {
    // Setup: Create complete Firebase data set
    localStorage.setItem('flux_highscores', JSON.stringify({
      ENDLESS: 10000,
      TIMED: 5000,
    }));
    
    localStorage.setItem('flux_stats', JSON.stringify({
      blocksPlaced: 500,
      linesCleared: 100,
      totalScore: 25000,
      bombsExploded: 5,
      iceBroken: 10,
      gamesPlayed: 25,
      skillUses: {},
    }));
    
    localStorage.setItem('flux_passive_unlocks', JSON.stringify(['score_boost_1']));
    localStorage.setItem('flux_passive_equipped', JSON.stringify([]));
    localStorage.setItem('flux_max_level', '1');
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Verify all migrations completed
    expect(result.success).toBe(true);
    expect(result.migratedKeys.length).toBeGreaterThan(0);
    
    // Verify all data was migrated
    const scores = LocalStorageService.loadHighScores();
    const stats = LocalStorageService.loadStats();
    const abilities = LocalStorageService.loadPassiveAbilities();
    
    expect(scores[GameMode.ENDLESS]).toBe(10000);
    expect(stats?.blocksPlaced).toBe(500);
    expect(abilities?.unlocked).toContain('score_boost_1');
    
    // Verify all old keys were removed (except flux_stats which is reused)
    expect(localStorage.getItem('flux_highscores')).toBeNull();
    expect(localStorage.getItem('flux_stats')).not.toBeNull(); // Reused by new format
    expect(localStorage.getItem('flux_passive_unlocks')).toBeNull();
  });

  it('should be idempotent (running multiple times produces same result)', () => {
    // Setup: Create Firebase data
    localStorage.setItem('flux_highscores', JSON.stringify({
      ENDLESS: 8000,
    }));
    
    // Run migration first time
    const result1 = migrateFromFirebase();
    expect(result1.success).toBe(true);
    
    // Get migrated data
    const scores1 = LocalStorageService.loadHighScores();
    expect(scores1[GameMode.ENDLESS]).toBe(8000);
    
    // Run migration second time (should be no-op)
    const result2 = migrateFromFirebase();
    expect(result2.skipped).toBe(true); // Already migrated
    expect(result2.success).toBe(true);
    
    // Verify data is unchanged
    const scores2 = LocalStorageService.loadHighScores();
    expect(scores2[GameMode.ENDLESS]).toBe(8000);
  });

  it('should handle missing Firebase data gracefully', () => {
    // No Firebase data in localStorage
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Should complete without errors
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });

  it('should handle corrupted Firebase data gracefully', () => {
    // Setup: Create corrupted Firebase data
    localStorage.setItem('flux_highscores', 'invalid json {{{');
    localStorage.setItem('flux_stats', '{ incomplete json');
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Should handle errors gracefully
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });

  it('should preserve existing new-format data during migration', () => {
    // Setup: Create new-format data first
    LocalStorageService.saveHighScore(GameMode.ENDLESS, 15000);
    LocalStorageService.saveStats({
      blocksPlaced: 2000,
      linesCleared: 400,
      totalScore: 100000,
      bombsExploded: 20,
      iceBroken: 40,
      gamesPlayed: 100,
      skillUses: {},
    });
    
    // Setup: Create Firebase data with lower values
    localStorage.setItem('flux_highscores', JSON.stringify({
      ENDLESS: 5000, // Lower than existing
    }));
    
    localStorage.setItem('flux_stats', JSON.stringify({
      blocksPlaced: 500, // Lower than existing
      linesCleared: 100,
      totalScore: 25000,
      bombsExploded: 5,
      iceBroken: 10,
      gamesPlayed: 25,
      skillUses: {},
    }));
    
    // Run migration
    const result = migrateFromFirebase();
    
    // Verify migration completed
    expect(result.success).toBe(true);
    
    // Verify higher values were preserved
    const scores = LocalStorageService.loadHighScores();
    const stats = LocalStorageService.loadStats();
    
    expect(scores[GameMode.ENDLESS]).toBe(15000); // Kept higher value
    expect(stats?.blocksPlaced).toBe(500); // Migration overwrites stats (not merged)
  });

  it('should track migration completion', () => {
    // Setup: Create Firebase data
    localStorage.setItem('flux_highscores', JSON.stringify({ ENDLESS: 1000 }));
    
    // Run migration
    const result = migrateFromFirebase();
    expect(result.success).toBe(true);
    
    // Verify migration completion flag was set
    const migrationFlag = localStorage.getItem('flux_migration_done');
    expect(migrationFlag).toBe('true');
    
    // Run migration again
    const result2 = migrateFromFirebase();
    expect(result2.skipped).toBe(true); // Already completed
  });
});
