/**
 * Cleanup Legacy LocalStorage Keys
 * 
 * Removes deprecated localStorage keys that are no longer used in the app.
 * This helps reduce storage usage and prevent confusion from old data.
 * 
 * Call this once on app initialization to clean up user's localStorage.
 */

const LEGACY_KEYS_TO_REMOVE = [
  // Tutorial system (removed - now handled by tutorialStore)
  // Note: flux_tutorial_v2 is still used by tutorialStore, don't remove it
  'flux_onboard_v1',
  
  // Daily challenge system (removed)
  'flux_daily_played',
  'flux_daily_streak',
  'flux_daily_streak_date',
  'flux_daily_reward',
  
  // Do not remove flux_streak; it is still used by streakStore.
  
  // Profile/Level system (not used in UI)
  'flux_player_profile',
  'flux_level_progress',
  'flux_max_level',
  
  // Passive abilities (not implemented)
  'flux_passive_unlocks',
  'flux_passive_equipped',
  
  // Old high score format (replaced with fluxgrid_high_scores)
  'flux_highscore',
  'flux_survival_highscore',
  
  // Legacy widget keys (replaced with widget_* prefix)
  'flux_high_score_endless',
  'flux_high_score_timed',
  
  // PWA (not used)
  'pwa_installed',
];

/**
 * Clean up corrupted achievement data
 * Checks for mojibake characters and removes corrupted achievement data
 * Returns true if cleanup was performed
 */
export function cleanupCorruptedAchievements(): boolean {
  try {
    const achievementData = localStorage.getItem('flux_achievements');
    
    if (!achievementData) {
      return false;
    }
    
    // Check if data contains mojibake characters (UTF-8 encoding issues)
    // Use simple string check instead of parsing to avoid errors
    const hasMojibake = achievementData.includes('Ã') || 
                        achievementData.includes('Ä') || 
                        achievementData.includes('Å') ||
                        achievementData.includes('â');
    
    if (hasMojibake) {
      localStorage.removeItem('flux_achievements');
      return true;
    }
    
    return false;
  } catch (error) {
    // If there's an error, try to remove the corrupted data
    try {
      localStorage.removeItem('flux_achievements');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Remove all legacy localStorage keys
 * Safe to call multiple times - only removes keys that exist
 */
export function cleanupLegacyStorage(): void {
  let removedCount = 0;
  
  try {
    // First, clean up corrupted achievements
    if (cleanupCorruptedAchievements()) {
      removedCount++;
    }
    
    LEGACY_KEYS_TO_REMOVE.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });
    
    // Also clean up old cache keys (cache_*)
    const cacheKeysRemoved = cleanupOldCacheKeys();
    removedCount += cacheKeysRemoved;
  } catch (error) {
    // Silent fail
  }
}

/**
 * Clean up old cache keys (cache_* older than 30 days)
 * Returns number of keys removed
 */
function cleanupOldCacheKeys(): number {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  let removedCount = 0;
  
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        
        if (item) {
          try {
            const data = JSON.parse(item);
            if (data.timestamp && data.timestamp < thirtyDaysAgo) {
              localStorage.removeItem(key);
              removedCount++;
            }
          } catch {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return removedCount;
}

/**
 * Get current localStorage usage info
 * Useful for debugging and monitoring
 */
export function getStorageInfo(): {
  totalKeys: number;
  activeKeys: string[];
  estimatedSize: number;
} {
  const activeKeys: string[] = [];
  let estimatedSize = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        activeKeys.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          // Rough estimate: key + value length in bytes (UTF-16)
          estimatedSize += (key.length + value.length) * 2;
        }
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return {
    totalKeys: activeKeys.length,
    activeKeys: activeKeys.sort(),
    estimatedSize, // in bytes
  };
}

/**
 * Log current storage usage (for debugging)
 */
export function logStorageInfo(): void {
  const info = getStorageInfo();
  console.log('[Storage Info] 📊 Current Usage:');
  console.log(`  Total Keys: ${info.totalKeys}`);
  console.log(`  Estimated Size: ${(info.estimatedSize / 1024).toFixed(2)} KB`);
  console.log(`  Active Keys:`, info.activeKeys);
}
