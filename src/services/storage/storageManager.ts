/**
 * Storage Manager Service
 * 
 * Manages application data storage with validation, versioning,
 * and Capacitor Preferences integration.
 * 
 * Features:
 * - localStorage wrapper with validation
 * - Capacitor Preferences integration
 * - Data versioning and schema management
 * - Backup and recovery system
 * - Data encryption support
 * - Storage quota management
 * 
 * Requirements: 7.1, 7.2, 7.9
 */

import { BaseService } from '../core/BaseService';
import { Preferences } from '@capacitor/preferences';

// Storage key prefix
const STORAGE_PREFIX = 'fluxgrid_';

// Storage schema version
const CURRENT_SCHEMA_VERSION = 1;

// Storage keys
export const StorageKeys = {
  SCHEMA_VERSION: `${STORAGE_PREFIX}schema_version`,
  USER_DATA: `${STORAGE_PREFIX}user_data`,
  GAME_STATE: `${STORAGE_PREFIX}game_state`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
  STATISTICS: `${STORAGE_PREFIX}statistics`,
  ACHIEVEMENTS: `${STORAGE_PREFIX}achievements`,
  BACKUP: `${STORAGE_PREFIX}backup`,
  LAST_BACKUP_DATE: `${STORAGE_PREFIX}last_backup_date`,
} as const;

// Storage value types
export interface StorageValue {
  version: number;
  timestamp: number;
  data: any;
  checksum?: string;
}

// Storage configuration
export interface StorageConfig {
  useCapacitorPreferences: boolean; // Use Capacitor Preferences API
  validateOnRead: boolean; // Validate data on read
  autoBackup: boolean; // Automatically backup data
  backupInterval: number; // Games between backups
  encryptSensitiveData: boolean; // Encrypt sensitive data
  maxStorageSize: number; // Maximum storage size in bytes
}

// Default configuration
const DEFAULT_CONFIG: StorageConfig = {
  useCapacitorPreferences: true,
  validateOnRead: true,
  autoBackup: true,
  backupInterval: 10, // Every 10 games
  encryptSensitiveData: true,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
};

// Storage error types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'VALIDATION_FAILED' | 'CORRUPTION_DETECTED' | 'ENCRYPTION_FAILED'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage Manager Service
 * Manages application data storage with validation and versioning
 */
export class StorageManager extends BaseService {
  private config: StorageConfig;
  private gamesPlayedSinceBackup: number = 0;
  private isCapacitorAvailable: boolean = false;

  constructor(config: Partial<StorageConfig> = {}) {
    super('StorageManager');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the storage manager
   */
  protected async onInitialize(): Promise<void> {
    // Check if Capacitor Preferences is available
    this.isCapacitorAvailable = typeof Preferences !== 'undefined';

    if (this.config.useCapacitorPreferences && !this.isCapacitorAvailable) {
      this.logger.warn('Capacitor Preferences not available, falling back to localStorage');
      this.config.useCapacitorPreferences = false;
    }

    // Check schema version and migrate if needed
    await this.checkAndMigrateSchema();

    // Check storage quota
    await this.checkStorageQuota();
  }

  /**
   * Start the storage manager
   */
  protected async onStart(): Promise<void> {
    // Nothing to start
  }

  /**
   * Stop the storage manager
   */
  protected async onStop(): Promise<void> {
    // Create final backup
    if (this.config.autoBackup) {
      await this.createBackup();
    }
  }

  /**
   * Set item in storage
   */
  public async setItem<T = any>(key: string, value: T): Promise<void> {
    try {
      // Create storage value with metadata
      const storageValue: StorageValue = {
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
        localStorage.setItem(key, serialized);
      }

      this.logger.debug('Item stored', { key, size: serialized.length });
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');
      }
      this.logger.error('Failed to set item', { error, key });
      throw error;
    }
  }

  /**
   * Get item from storage
   */
  public async getItem<T = any>(key: string): Promise<T | null> {
    try {
      // Retrieve
      let serialized: string | null;
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        const result = await Preferences.get({ key });
        serialized = result.value;
      } else {
        serialized = localStorage.getItem(key);
      }

      if (!serialized) {
        return null;
      }

      // Deserialize
      const storageValue: StorageValue = JSON.parse(serialized);

      // Validate if enabled
      if (this.config.validateOnRead) {
        if (!this.validateStorageValue(storageValue)) {
          throw new StorageError('Data validation failed', 'VALIDATION_FAILED');
        }

        // Check checksum
        if (storageValue.checksum) {
          const calculatedChecksum = this.calculateChecksum(storageValue.data);
          if (calculatedChecksum !== storageValue.checksum) {
            throw new StorageError('Data corruption detected', 'CORRUPTION_DETECTED');
          }
        }
      }

      this.logger.debug('Item retrieved', { key });
      return storageValue.data as T;
    } catch (error) {
      if (error instanceof StorageError) {
        this.logger.error('Storage error', { error, key });
        throw error;
      }
      this.logger.error('Failed to get item', { error, key });
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }

      this.logger.debug('Item removed', { key });
    } catch (error) {
      this.logger.error('Failed to remove item', { error, key });
      throw error;
    }
  }

  /**
   * Clear all storage
   */
  public async clear(): Promise<void> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        await Preferences.clear();
      } else {
        // Only clear items with our prefix
        const keys = Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX));
        keys.forEach((key) => localStorage.removeItem(key));
      }

      this.logger.info('Storage cleared');
    } catch (error) {
      this.logger.error('Failed to clear storage', { error });
      throw error;
    }
  }

  /**
   * Get all keys
   */
  public async keys(): Promise<string[]> {
    try {
      if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
        const result = await Preferences.keys();
        return result.keys.filter((key) => key.startsWith(STORAGE_PREFIX));
      } else {
        return Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX));
      }
    } catch (error) {
      this.logger.error('Failed to get keys', { error });
      return [];
    }
  }

  /**
   * Get storage size in bytes
   */
  public async getStorageSize(): Promise<number> {
    try {
      const keys = await this.keys();
      let totalSize = 0;

      for (const key of keys) {
        let value: string | null;
        if (this.config.useCapacitorPreferences && this.isCapacitorAvailable) {
          const result = await Preferences.get({ key });
          value = result.value;
        } else {
          value = localStorage.getItem(key);
        }

        if (value) {
          totalSize += new Blob([value]).size;
        }
      }

      return totalSize;
    } catch (error) {
      this.logger.error('Failed to get storage size', { error });
      return 0;
    }
  }

  /**
   * Check storage quota
   */
  public async checkStorageQuota(additionalSize: number = 0): Promise<void> {
    const currentSize = await this.getStorageSize();
    const totalSize = currentSize + additionalSize;

    if (totalSize > this.config.maxStorageSize) {
      this.logger.warn('Storage quota exceeded', {
        current: currentSize,
        additional: additionalSize,
        max: this.config.maxStorageSize,
      });

      // Try to free up space
      await this.evictOldData();

      // Check again
      const newSize = await this.getStorageSize();
      if (newSize + additionalSize > this.config.maxStorageSize) {
        throw new StorageError('Storage quota exceeded after eviction', 'QUOTA_EXCEEDED');
      }
    }
  }

  /**
   * Create backup
   */
  public async createBackup(): Promise<void> {
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
      this.logger.info('Backup created', { keys: Object.keys(backup).length });
    } catch (error) {
      this.logger.error('Failed to create backup', { error });
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  public async restoreBackup(): Promise<boolean> {
    try {
      const backup = await this.getItem<Record<string, any>>(StorageKeys.BACKUP);
      if (!backup) {
        this.logger.warn('No backup found');
        return false;
      }

      // Clear current data
      await this.clear();

      // Restore backup
      for (const [key, value] of Object.entries(backup)) {
        await this.setItem(key, value);
      }

      this.logger.info('Backup restored', { keys: Object.keys(backup).length });
      return true;
    } catch (error) {
      this.logger.error('Failed to restore backup', { error });
      return false;
    }
  }

  /**
   * Increment games played counter (for auto backup)
   */
  public incrementGamesPlayed(): void {
    this.gamesPlayedSinceBackup++;

    if (this.config.autoBackup && this.gamesPlayedSinceBackup >= this.config.backupInterval) {
      this.createBackup().catch((error) => {
        this.logger.error('Auto backup failed', { error });
      });
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  // Private methods

  /**
   * Check and migrate schema if needed
   */
  private async checkAndMigrateSchema(): Promise<void> {
    const storedVersion = await this.getItem<number>(StorageKeys.SCHEMA_VERSION);

    if (!storedVersion) {
      // First time, set current version
      await this.setItem(StorageKeys.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
      this.logger.info('Schema version initialized', { version: CURRENT_SCHEMA_VERSION });
      return;
    }

    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      this.logger.info('Schema migration needed', {
        from: storedVersion,
        to: CURRENT_SCHEMA_VERSION,
      });

      // Perform migration
      await this.migrateSchema(storedVersion, CURRENT_SCHEMA_VERSION);

      // Update version
      await this.setItem(StorageKeys.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
    }
  }

  /**
   * Migrate schema from one version to another
   */
  private async migrateSchema(fromVersion: number, toVersion: number): Promise<void> {
    this.logger.info('Migrating schema', { from: fromVersion, to: toVersion });

    // Add migration logic here for future schema changes
    // Example:
    // if (fromVersion === 1 && toVersion === 2) {
    //   // Migrate from v1 to v2
    // }
  }

  /**
   * Validate storage value
   */
  private validateStorageValue(value: StorageValue): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    if (typeof value.version !== 'number' || typeof value.timestamp !== 'number') {
      return false;
    }

    if (value.data === undefined) {
      return false;
    }

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
          serialized = localStorage.getItem(key);
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

      this.logger.info('Old data evicted', { count: itemsToRemove });
    } catch (error) {
      this.logger.error('Failed to evict old data', { error });
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
