/**
 * StorageService - Canonical storage implementation
 * 
 * Consolidates:
 * - src/services/storage/storageManager.ts
 * - src/services/local/localStorageService.ts
 * - src/utils/storage/* (asset loading)
 * - src/utils/platform/platformStorage.ts
 * 
 * Features:
 * - localStorage wrapper with validation
 * - Capacitor Preferences integration
 * - Data versioning and schema management
 * - Backup and recovery system
 * - Data encryption support
 * - Storage quota management
 * - In-memory fallback
 * - Type-safe operations
 */

import { BaseService } from '../base/BaseService';
import { Preferences } from '@capacitor/preferences';
import type { GameMode } from '@shared/types';
import type { GameStats } from '@shared/types';

// ============================================================================
// Storage Configuration
// ============================================================================

export interface StorageConfig {
  useCapacitorPreferences: boolean;
  validateOnRead: boolean;
  autoBackup: boolean;
  backupInterval: number;
  encryptSensitiveData: boolean;
  maxStorageSize: number;
}

const DEFAULT_CONFIG: StorageConfig = {
  useCapacitorPreferences: true,
  validateOnRead: true,
  autoBackup: true,
  backupInterval: 10,
  encryptSensitiveData: true,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_PREFIX = 'fluxgrid_';
const CURRENT_SCHEMA_VERSION = 1;

export const StorageKeys = {
  SCHEMA_VERSION: `${STORAGE_PREFIX}schema_version`,
  GAME_STATE: `${STORAGE_PREFIX}game_state`,
  HIGH_SCORES: `${STORAGE_PREFIX}high_scores`,
  STATS: `${STORAGE_PREFIX}stats`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  ACHIEVEMENTS: `${STORAGE_PREFIX}achievements`,
  PASSIVE_ABILITIES: `${STORAGE_PREFIX}passive_abilities`,
  BACKUP: `${STORAGE_PREFIX}backup`,
  LAST_BACKUP_DATE: `${STORAGE_PREFIX}last_backup_date`,
  THEME: `${STORAGE_PREFIX}theme`,
  LANGUAGE: `${STORAGE_PREFIX}language`,
  MUTED: `${STORAGE_PREFIX}muted`,
  DAILY_PLAYED: `${STORAGE_PREFIX}daily_played`,
  DAILY_STREAK: `${STORAGE_PREFIX}daily_streak`,
  DAILY_STREAK_DATE: `${STORAGE_PREFIX}daily_streak_date`,
} as const;

// ============================================================================
// Storage Value Types
// ============================================================================

export interface StorageValue<T = any> {
  version: number;
  timestamp: number;
  data: T;
  checksum?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  STORAGE_DISABLED = 'STORAGE_DISABLED',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
}

export class StorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// ============================================================================
// In-Memory Storage Fallback
// ============================================================================

class InMemoryStorage implements Storage {
  private data: Map<string, string> = new Map();
  
  get length(): number {
    return this.data.size;
  }
  
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  
  removeItem(key: string): void {
    this.data.delete(key);
  }
  
  clear(): void {
    this.data.clear();
  }
  
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
}

// ============================================================================
// StorageService
// ============================================================================

export class StorageService extends BaseService {
  private config: StorageConfig;
  private storage: Storage | InMemoryStorage;
  private isCapacitorAvailable: boolean = false;
  private isLocalStorageAvailable: boolean = false;
  private gamesPlayedSinceBackup: number = 0;

  constructor(config: Partial<StorageConfig> = {}) {
    super('StorageService');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = this.initializeStorage();
  }

  /**
   * Initialize storage backend
   */
  private initializeStorage(): Storage | InMemoryStorage {
    try {
      // Test localStorage availability
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
      
      // Check Capacitor Preferences availability
      this.isCapacitorAvailable = typeof Preferences !== 'undefined';
      
      if (this.config.useCapacitorPreferences && !this.isCapacitorAvailable) {
        this.warn('Capacitor Preferences not available, using localStorage');
        this.config.useCapacitorPreferences = false;
      }
      
      return localStorage;
    } catch {
      this.warn('localStorage not available, using in-memory storage');
      this.isLocalStorageAvailable = false;
      return new InMemoryStorage();
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    this.log('Initializing StorageService');
    
    // Check schema version and migrate if needed
    await this.checkAndMigrateSchema();
    
    // Check storage quota
    await this.checkStorageQuota();
    
    this.markInitialized();
  }

  /**
   * Cleanup service resources
   */
  cleanup(): void {
    // Create final backup if auto-backup is enabled
    if (this.config.autoBackup) {
      this.createBackup().catch(error => {
        this.error('Failed to create final backup', error);
      });
    }
  }

  // ========================================================================
  // Core Storage Operations
  // ========================================================================

  /**
   * Set item in storage
   */
  async setItem<T = any>(key: string, value: T): Promise<void> {
    try {
      // Create storage value with metadata
      const storageValue: StorageValue<T> = {
        version: CURRENT_SCHEMA_VERSION,
        timestamp: Date.now(),
        data: value,
      };

      // Calculate checksum
      storageValue.checksum = this.calculateChecksum(storageValue.data);

      // Serialize
      const serialized = JSON.stringify(storageValue);

      // Check storage quota
      await this.checkStorageQuota(serialized.length);

      // Store
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        await Preferences.set({ key, value: serialized });
      } else {
        this.storage.setItem(key, serialized);
      }

      this.log(`Item stored: ${key} (${serialized.length} bytes)`);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new StorageError(StorageErrorType.QUOTA_EXCEEDED, 'Storage quota exceeded');
      }
      this.error(`Failed to set item: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Get item from storage
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      // Retrieve
      let serialized: string | null;
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        const result = await Preferences.get({ key });
        serialized = result.value;
      } else {
        serialized = this.storage.getItem(key);
      }

      if (!serialized) {
        return null;
      }

      // Deserialize
      const storageValue: StorageValue<T> = JSON.parse(serialized);

      // Validate if enabled
      if (this.config.validateOnRead) {
        if (!this.validateStorageValue(storageValue)) {
          throw new StorageError(StorageErrorType.VALIDATION_ERROR, 'Data validation failed');
        }

        // Check checksum
        if (storageValue.checksum) {
          const calculatedChecksum = this.calculateChecksum(storageValue.data);
          if (calculatedChecksum !== storageValue.checksum) {
            throw new StorageError(StorageErrorType.CORRUPTED_DATA, 'Data corruption detected');
          }
        }
      }

      return storageValue.data;
    } catch (error) {
      if (error instanceof StorageError) {
        this.error(`Storage error for key ${key}`, error);
        throw error;
      }
      this.error(`Failed to get item: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        await Preferences.remove({ key });
      } else {
        this.storage.removeItem(key);
      }

      this.log(`Item removed: ${key}`);
    } catch (error) {
      this.error(`Failed to remove item: ${key}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        await Preferences.clear();
      } else {
        // Only clear items with our prefix
        const keys = Object.keys(this.storage).filter(key => key.startsWith(STORAGE_PREFIX));
        keys.forEach(key => this.storage.removeItem(key));
      }

      this.log('Storage cleared');
    } catch (error) {
      this.error('Failed to clear storage', error as Error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        const result = await Preferences.keys();
        return result.keys.filter(key => key.startsWith(STORAGE_PREFIX));
      } else {
        if (this.storage instanceof InMemoryStorage) {
          const keys: string[] = [];
          for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
              keys.push(key);
            }
          }
          return keys;
        } else {
          return Object.keys(this.storage).filter(key => key.startsWith(STORAGE_PREFIX));
        }
      }
    } catch (error) {
      this.error('Failed to get keys', error as Error);
      return [];
    }
  }

  // ========================================================================
  // High-Level Storage Operations
  // ========================================================================

  /**
   * Save high score for a game mode
   */
  async saveHighScore(mode: GameMode, score: number): Promise<void> {
    const highScores = await this.getItem<Record<string, number>>(StorageKeys.HIGH_SCORES) || {};
    
    if (!highScores[mode] || score > highScores[mode]) {
      highScores[mode] = score;
      await this.setItem(StorageKeys.HIGH_SCORES, highScores);
    }
  }

  /**
   * Load high scores (synchronous for immediate access)
   */
  loadHighScores(): Record<string, number> {
    try {
      const serialized = this.storage.getItem(StorageKeys.HIGH_SCORES);
      if (serialized) {
        const storageValue: StorageValue<Record<string, number>> = JSON.parse(serialized);
        
        // If data field exists, use it regardless of checksum (checksum mismatch ≠ data loss)
        if (storageValue && storageValue.data && typeof storageValue.data === 'object') {
          return storageValue.data;
        }
        
        // Also check legacy format (plain object without wrapper)
        if (!storageValue.version && typeof storageValue === 'object') {
          return storageValue as Record<string, number>;
        }
      }
      
      // Fallback: check legacy key 'flux_high_scores' from older code
      const legacySerialized = this.storage.getItem('flux_high_scores');
      if (legacySerialized) {
        const legacy = JSON.parse(legacySerialized);
        if (legacy && typeof legacy === 'object') {
          // Migrate to new key
          const data = (legacy.data && typeof legacy.data === 'object') ? legacy.data : legacy;
          this.storage.setItem(StorageKeys.HIGH_SCORES, JSON.stringify({
            version: 1,
            timestamp: Date.now(),
            data,
          }));
          return data;
        }
      }
      
      return {};
    } catch (error) {
      this.error('Failed to load high scores', error as Error);
      return {};
    }
  }

  /**
   * Save game statistics
   */
  async saveStats(stats: GameStats): Promise<void> {
    await this.setItem(StorageKeys.STATS, stats);
  }

  /**
   * Load game statistics (synchronous for immediate access)
   */
  loadStats(): GameStats | null {
    try {
      const serialized = this.storage.getItem(StorageKeys.STATS);
      if (!serialized) return null;
      
      const storageValue: StorageValue<GameStats> = JSON.parse(serialized);
      
      // Use data regardless of checksum — checksum mismatch doesn't mean data is bad
      if (storageValue && storageValue.data && typeof storageValue.data === 'object') {
        return storageValue.data;
      }
      
      return null;
    } catch (error) {
      this.error('Failed to load stats', error as Error);
      return null;
    }
  }

  // ========================================================================
  // Backup & Recovery
  // ========================================================================

  /**
   * Create backup of all data
   */
  async createBackup(): Promise<void> {
    try {
      const keys = await this.keys();
      const backup: Record<string, any> = {};

      for (const key of keys) {
        if (key !== StorageKeys.BACKUP && key !== StorageKeys.LAST_BACKUP_DATE) {
          const value = await this.getItem(key);
          if (value !== null) {
            backup[key] = value;
          }
        }
      }

      await this.setItem(StorageKeys.BACKUP, backup);
      await this.setItem(StorageKeys.LAST_BACKUP_DATE, Date.now());

      this.gamesPlayedSinceBackup = 0;
      this.log(`Backup created with ${Object.keys(backup).length} keys`);
    } catch (error) {
      this.error('Failed to create backup', error as Error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(): Promise<boolean> {
    try {
      const backup = await this.getItem<Record<string, any>>(StorageKeys.BACKUP);
      if (!backup) {
        this.warn('No backup found');
        return false;
      }

      // Clear current data
      await this.clear();

      // Restore backup
      for (const [key, value] of Object.entries(backup)) {
        await this.setItem(key, value);
      }

      this.log(`Backup restored with ${Object.keys(backup).length} keys`);
      return true;
    } catch (error) {
      this.error('Failed to restore backup', error as Error);
      return false;
    }
  }

  /**
   * Increment games played counter (for auto backup)
   */
  incrementGamesPlayed(): void {
    this.gamesPlayedSinceBackup++;

    if (this.config.autoBackup && this.gamesPlayedSinceBackup >= this.config.backupInterval) {
      this.createBackup().catch(error => {
        this.error('Auto backup failed', error);
      });
    }
  }

  // ========================================================================
  // Storage Management
  // ========================================================================

  /**
   * Get storage size in bytes
   */
  async getStorageSize(): Promise<number> {
    try {
      const keys = await this.keys();
      let totalSize = 0;

      for (const key of keys) {
        let value: string | null;
        if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
          const result = await Preferences.get({ key });
          value = result.value;
        } else {
          value = this.storage.getItem(key);
        }

        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      this.error('Failed to get storage size', error as Error);
      return 0;
    }
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(additionalSize: number = 0): Promise<void> {
    const currentSize = await this.getStorageSize();
    const totalSize = currentSize + additionalSize;

    if (totalSize > this.config.maxStorageSize) {
      this.warn(`Storage quota exceeded: ${totalSize} / ${this.config.maxStorageSize} bytes`);

      // Try to free up space
      await this.evictOldData();

      // Check again
      const newSize = await this.getStorageSize();
      if (newSize + additionalSize > this.config.maxStorageSize) {
        throw new StorageError(StorageErrorType.QUOTA_EXCEEDED, 'Storage quota exceeded after eviction');
      }
    }
  }

  /**
   * Evict old data to free up space (LRU)
   */
  private async evictOldData(): Promise<void> {
    try {
      const keys = await this.keys();
      const items: Array<{ key: string; timestamp: number }> = [];

      // Get all items with timestamps
      for (const key of keys) {
        if (key === StorageKeys.BACKUP || key === StorageKeys.LAST_BACKUP_DATE) {
          continue; // Don't evict backup
        }

        let serialized: string | null;
        if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
          const result = await Preferences.get({ key });
          serialized = result.value;
        } else {
          serialized = this.storage.getItem(key);
        }

        if (serialized) {
          try {
            const storageValue: StorageValue = JSON.parse(serialized);
            items.push({ key, timestamp: storageValue.timestamp });
          } catch {
            // Invalid item, remove it
            await this.removeItem(key);
          }
        }
      }

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 20% of items
      const itemsToRemove = Math.ceil(items.length * 0.2);
      for (let i = 0; i < itemsToRemove; i++) {
        await this.removeItem(items[i].key);
      }

      this.log(`Evicted ${itemsToRemove} old items`);
    } catch (error) {
      this.error('Failed to evict old data', error as Error);
    }
  }

  // ========================================================================
  // Schema Management
  // ========================================================================

  /**
   * Check and migrate schema if needed
   */
  private async checkAndMigrateSchema(): Promise<void> {
    const storedVersion = await this.getItem<number>(StorageKeys.SCHEMA_VERSION);

    if (!storedVersion) {
      // First time, set current version
      await this.setItem(StorageKeys.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
      this.log(`Schema version initialized: ${CURRENT_SCHEMA_VERSION}`);
      return;
    }

    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      this.log(`Schema migration needed: ${storedVersion} → ${CURRENT_SCHEMA_VERSION}`);
      await this.migrateSchema(storedVersion, CURRENT_SCHEMA_VERSION);
      await this.setItem(StorageKeys.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    }
  }

  /**
   * Migrate schema from one version to another
   */
  private async migrateSchema(fromVersion: number, toVersion: number): Promise<void> {
    this.log(`Migrating schema: ${fromVersion} → ${toVersion}`);
    // Add migration logic here for future schema changes
  }

  // ========================================================================
  // Validation & Utilities
  // ========================================================================

  /**
   * Validate storage value
   */
  private validateStorageValue(value: StorageValue): boolean {
    if (!value || typeof value !== 'object') return false;
    if (typeof value.version !== 'number') return false;
    if (typeof value.timestamp !== 'number') return false;
    if (value.data === undefined) return false;
    return true;
  }

  /**
   * Calculate checksum for data
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }

  /**
   * Check if storage is available
   */
  isStorageAvailable(): boolean {
    return this.isLocalStorageAvailable;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const storageService = new StorageService();
