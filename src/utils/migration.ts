/**
 * Migration Utility - Migrate data from Firebase format to local-first format
 * 
 * This utility handles one-time migration of existing Firebase data stored in
 * localStorage to the new local-first format managed by LocalStorageService.
 */

import { LocalStorageService, STORAGE_KEYS } from '@services/local/localStorageService';
import { GameMode } from '@shared/types';
import type { GameStats } from '@shared/types';
import type { PassiveAbilityType } from '@features/abilities/types';

// ============================================================================
// Firebase Legacy Keys
// ============================================================================

const FIREBASE_LEGACY_KEYS = {
  HIGHSCORES: 'flux_highscores',
  HIGHSCORE: 'flux_highscore',
  STATS: 'flux_stats',
  PASSIVE_UNLOCKS: 'flux_passive_unlocks',
  PASSIVE_EQUIPPED: 'flux_passive_equipped',
  MAX_LEVEL: 'flux_max_level',
  PLAYER_PROFILE: 'flux_player_profile',
  ACHIEVEMENTS: 'flux_achievements',
  LEVEL_PROGRESS: 'flux_level_progress',
} as const;

// ============================================================================
// Migration Result
// ============================================================================

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  skipped: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse JSON data from localStorage
 */
function safeParseJSON<T>(data: string | null, defaultValue: T): T {
  if (!data) return defaultValue;
  
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn('Failed to parse JSON data:', error);
    return defaultValue;
  }
}

/**
 * Check if Firebase data exists in localStorage
 */
function hasFirebaseData(): boolean {
  const storage = localStorage;
  
  // Check for any Firebase legacy keys
  return (
    storage.getItem(FIREBASE_LEGACY_KEYS.HIGHSCORES) !== null ||
    storage.getItem(FIREBASE_LEGACY_KEYS.HIGHSCORE) !== null ||
    storage.getItem(FIREBASE_LEGACY_KEYS.STATS) !== null ||
    storage.getItem(FIREBASE_LEGACY_KEYS.PASSIVE_UNLOCKS) !== null ||
    storage.getItem(FIREBASE_LEGACY_KEYS.PASSIVE_EQUIPPED) !== null
  );
}

/**
 * Check if migration has already been completed
 */
function isMigrationComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.MIGRATION_DONE) === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  localStorage.setItem(STORAGE_KEYS.MIGRATION_DONE, 'true');
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate high scores from Firebase format to new format
 */
function migrateHighScores(): string[] {
  const migratedKeys: string[] = [];
  
  try {
    // Try to get high scores from old format
    const oldHighScoresStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.HIGHSCORES);
    const oldHighScoreStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.HIGHSCORE);
    
    if (oldHighScoresStr) {
      const oldHighScores = safeParseJSON<Record<string, number>>(oldHighScoresStr, {});
      
      // Migrate each mode's high score
      if (oldHighScores.ENDLESS) {
        LocalStorageService.saveHighScore(GameMode.ENDLESS, oldHighScores.ENDLESS);
        migratedKeys.push('ENDLESS high score');
      }
      
      if (oldHighScores.TIMED) {
        LocalStorageService.saveHighScore(GameMode.TIMED, oldHighScores.TIMED);
        migratedKeys.push('TIMED high score');
      }
      
      if (oldHighScores.DAILY_CHALLENGE) {
        LocalStorageService.saveHighScore(GameMode.DAILY_CHALLENGE, oldHighScores.DAILY_CHALLENGE);
        migratedKeys.push('DAILY_CHALLENGE high score');
      }
      
      if (oldHighScores.ZEN) {
        LocalStorageService.saveHighScore(GameMode.ZEN, oldHighScores.ZEN);
        migratedKeys.push('ZEN high score');
      }
    }
    
    // Also check for single high score (legacy format)
    if (oldHighScoreStr && !oldHighScoresStr) {
      const score = parseInt(oldHighScoreStr, 10);
      if (!isNaN(score)) {
        LocalStorageService.saveHighScore(GameMode.ENDLESS, score);
        migratedKeys.push('Legacy high score');
      }
    }
  } catch (error) {
    console.error('Failed to migrate high scores:', error);
    throw error;
  }
  
  return migratedKeys;
}

/**
 * Migrate statistics from Firebase format to new format
 */
function migrateStatistics(): string[] {
  const migratedKeys: string[] = [];
  
  try {
    const oldStatsStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.STATS);
    
    if (oldStatsStr) {
      const oldStats = safeParseJSON<Partial<GameStats>>(oldStatsStr, {});
      
      // Create new stats object with mode-specific fields initialized
      const newStats: GameStats = {
        blocksPlaced: oldStats.blocksPlaced || 0,
        linesCleared: oldStats.linesCleared || 0,
        totalScore: oldStats.totalScore || 0,
        bombsExploded: oldStats.bombsExploded || 0,
        iceBroken: oldStats.iceBroken || 0,
        gamesPlayed: oldStats.gamesPlayed || 0,
        skillUses: oldStats.skillUses || {},
        
        // Initialize mode-specific stats (new fields)
        endlessGamesPlayed: 0,
        endlessHighScore: 0,
        endlessMaxCombo: 0,
        endlessTotalLines: 0,
        endlessMaxTier: 0,
        endlessEventCount: 0,
        
        timedGamesPlayed: 0,
        timedHighScore: 0,
        timedMaxCombo: 0,
        timedTotalLines: 0,
        timedMaxDuration: 0,
        timedChronoBonus: 0,
        timedSprintBonusTotal: 0,
      };
      
      LocalStorageService.saveStats(newStats);
      migratedKeys.push('Game statistics');
    }
  } catch (error) {
    console.error('Failed to migrate statistics:', error);
    throw error;
  }
  
  return migratedKeys;
}

/**
 * Migrate passive abilities from Firebase format to new format
 */
function migratePassiveAbilities(): string[] {
  const migratedKeys: string[] = [];
  
  try {
    const oldUnlocksStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.PASSIVE_UNLOCKS);
    const oldEquippedStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.PASSIVE_EQUIPPED);
    const oldMaxLevelStr = localStorage.getItem(FIREBASE_LEGACY_KEYS.MAX_LEVEL);
    
    if (oldUnlocksStr || oldEquippedStr) {
      // Parse unlocked abilities (could be object or array)
      let unlocked: PassiveAbilityType[] = [];
      if (oldUnlocksStr) {
        const parsed = safeParseJSON<any>(oldUnlocksStr, {});
        
        // Handle different formats
        if (Array.isArray(parsed)) {
          unlocked = parsed;
        } else if (typeof parsed === 'object') {
          // If it's an object like { "FLUX_BOOST": true }, extract keys
          unlocked = Object.keys(parsed).filter(key => parsed[key]) as PassiveAbilityType[];
        }
        
        migratedKeys.push('Unlocked passive abilities');
      }
      
      // Parse equipped abilities
      let equipped: PassiveAbilityType[] = [];
      if (oldEquippedStr) {
        equipped = safeParseJSON<PassiveAbilityType[]>(oldEquippedStr, []);
        migratedKeys.push('Equipped passive abilities');
      }
      
      // Parse max level
      let maxLevel = 1;
      if (oldMaxLevelStr) {
        const parsed = parseInt(oldMaxLevelStr, 10);
        if (!isNaN(parsed)) {
          maxLevel = parsed;
          migratedKeys.push('Max level');
        }
      }
      
      // Save to new format
      LocalStorageService.savePassiveAbilities({
        unlocked,
        equipped,
        maxLevel,
      });
    }
  } catch (error) {
    console.error('Failed to migrate passive abilities:', error);
    throw error;
  }
  
  return migratedKeys;
}

/**
 * Clean up deprecated Firebase keys from localStorage
 */
function cleanupDeprecatedKeys(): string[] {
  const removedKeys: string[] = [];
  
  try {
    // Remove all deprecated Firebase keys
    // NOTE: flux_stats is NOT removed because new format uses the same key
    const keysToRemove = [
      FIREBASE_LEGACY_KEYS.HIGHSCORES,
      FIREBASE_LEGACY_KEYS.HIGHSCORE,
      // FIREBASE_LEGACY_KEYS.STATS, // DO NOT REMOVE - new format uses same key
      FIREBASE_LEGACY_KEYS.PASSIVE_UNLOCKS,
      FIREBASE_LEGACY_KEYS.PASSIVE_EQUIPPED,
      FIREBASE_LEGACY_KEYS.MAX_LEVEL,
      FIREBASE_LEGACY_KEYS.PLAYER_PROFILE,
      FIREBASE_LEGACY_KEYS.ACHIEVEMENTS,
      FIREBASE_LEGACY_KEYS.LEVEL_PROGRESS,
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removedKeys.push(key);
      }
    });
  } catch (error) {
    console.error('Failed to cleanup deprecated keys:', error);
    throw error;
  }
  
  return removedKeys;
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Migrate data from Firebase format to local-first format
 * 
 * This function:
 * 1. Checks if migration has already been completed
 * 2. Detects Firebase data in localStorage
 * 3. Migrates high scores, statistics, and passive abilities
 * 4. Cleans up deprecated keys
 * 5. Marks migration as complete
 * 
 * @returns MigrationResult with success status and details
 */
export function migrateFromFirebase(): MigrationResult {
  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    errors: [],
    skipped: false,
  };
  
  try {
    // Check if migration already completed
    if (isMigrationComplete()) {
      console.log('Migration already completed. Skipping.');
      result.skipped = true;
      result.success = true;
      return result;
    }
    
    // Check if Firebase data exists
    if (!hasFirebaseData()) {
      console.log('No Firebase data found. Marking migration as complete.');
      markMigrationComplete();
      result.skipped = true;
      result.success = true;
      return result;
    }
    
    console.log('Starting Firebase to local-first migration...');
    
    // Migrate high scores
    try {
      const highScoreKeys = migrateHighScores();
      result.migratedKeys.push(...highScoreKeys);
      console.log('✓ High scores migrated:', highScoreKeys);
    } catch (error) {
      const errorMsg = `Failed to migrate high scores: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
    
    // Migrate statistics
    try {
      const statsKeys = migrateStatistics();
      result.migratedKeys.push(...statsKeys);
      console.log('✓ Statistics migrated:', statsKeys);
    } catch (error) {
      const errorMsg = `Failed to migrate statistics: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
    
    // Migrate passive abilities
    try {
      const abilityKeys = migratePassiveAbilities();
      result.migratedKeys.push(...abilityKeys);
      console.log('✓ Passive abilities migrated:', abilityKeys);
    } catch (error) {
      const errorMsg = `Failed to migrate passive abilities: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
    
    // Clean up deprecated keys
    try {
      const removedKeys = cleanupDeprecatedKeys();
      console.log('✓ Deprecated keys removed:', removedKeys);
    } catch (error) {
      const errorMsg = `Failed to cleanup deprecated keys: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
    
    // Mark migration as complete (even if some parts failed)
    markMigrationComplete();
    
    result.success = result.errors.length === 0;
    
    if (result.success) {
      console.log('✓ Migration completed successfully!');
    } else {
      console.warn('⚠ Migration completed with errors:', result.errors);
    }
    
    return result;
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Reset migration status (for testing purposes)
 * WARNING: This will cause migration to run again on next app load
 */
export function resetMigrationStatus(): void {
  localStorage.removeItem(STORAGE_KEYS.MIGRATION_DONE);
  console.log('Migration status reset');
}
