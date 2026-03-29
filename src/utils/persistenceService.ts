/**
 * PersistenceService - Centralized localStorage management
 */

export const STORAGE_KEYS = {
  // Theme
  THEME: 'flux_theme',
  
  // Settings
  SOUND_ENABLED: 'flux_sound_enabled',
  HAPTIC_ENABLED: 'flux_haptic_enabled',
  GHOST_BLOCK: 'flux_ghost_block',
  PERFORMANCE_MODE: 'flux_performance_mode',
  LANGUAGE: 'flux_language',
  
  // Game Data
  HIGH_SCORES: 'flux_high_scores',
  STATS: 'flux_stats',
  ACHIEVEMENTS: 'flux_achievements',
  DAILY_STREAK: 'flux_daily_streak',
  
  // Legacy keys (for migration)
  GAME_STATE: 'flux_game_state',
} as const;

export class PersistenceService {
  /**
   * Save data to localStorage
   */
  static save<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Consider clearing old data.');
      }
    }
  }

  /**
   * Load data from localStorage
   */
  static load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove a specific key from localStorage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }

  /**
   * Clear all FluxGrid data from localStorage
   */
  static clear(): void {
    try {
      // Only clear FluxGrid keys (those starting with 'flux_')
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('flux_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; available: boolean } {
    if (!this.isAvailable()) {
      return { used: 0, available: false };
    }

    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }
      return { used, available: true };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: false };
    }
  }
}
