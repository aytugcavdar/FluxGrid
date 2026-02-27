import { PersistenceSchema } from '../types';
import { PERSISTENCE_SETTINGS } from '../constants';

class PersistenceManager {
  private backupTimer: NodeJS.Timeout | null = null;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoBackup();
  }

  // Calculate checksum for data integrity
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  // Save data with versioning and checksum
  save(key: string, data: any): boolean {
    try {
      const dataString = JSON.stringify(data);
      const checksum = this.calculateChecksum(dataString);
      
      const schema: PersistenceSchema = {
        version: PERSISTENCE_SETTINGS.SCHEMA_VERSION,
        checksum,
        data,
        backups: this.getBackups(key)
      };
      
      localStorage.setItem(key, JSON.stringify(schema));
      return true;
    } catch (e) {
      console.error('Failed to save data', e);
      return false;
    }
  }

  // Save with debounce to prevent excessive writes
  saveDebounced(key: string, data: any) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      this.save(key, data);
    }, PERSISTENCE_SETTINGS.SAVE_DEBOUNCE);
  }

  // Load data with validation
  load<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const schema: PersistenceSchema = JSON.parse(stored);
      
      // Validate checksum
      const dataString = JSON.stringify(schema.data);
      const calculatedChecksum = this.calculateChecksum(dataString);
      
      if (calculatedChecksum !== schema.checksum) {
        console.error('Data corruption detected, attempting backup restore');
        return this.restoreFromBackup<T>(key);
      }
      
      // Migrate if needed
      if (schema.version < PERSISTENCE_SETTINGS.SCHEMA_VERSION) {
        const migrated = this.migrateSchema(schema.data, schema.version, PERSISTENCE_SETTINGS.SCHEMA_VERSION);
        this.save(key, migrated);
        return migrated as T;
      }
      
      return schema.data as T;
    } catch (e) {
      console.error('Failed to load data', e);
      return this.restoreFromBackup<T>(key);
    }
  }

  // Create backup
  createBackup(key: string) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return;
      
      const schema: PersistenceSchema = JSON.parse(stored);
      const backups = schema.backups || [];
      
      // Add new backup
      backups.push({
        timestamp: Date.now(),
        data: schema.data
      });
      
      // Keep only last N backups
      if (backups.length > PERSISTENCE_SETTINGS.MAX_BACKUPS) {
        backups.shift();
      }
      
      schema.backups = backups;
      localStorage.setItem(key, JSON.stringify(schema));
    } catch (e) {
      console.error('Failed to create backup', e);
    }
  }

  // Get all backups
  private getBackups(key: string): Array<{ timestamp: number; data: any }> {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      
      const schema: PersistenceSchema = JSON.parse(stored);
      return schema.backups || [];
    } catch (e) {
      return [];
    }
  }

  // Restore from most recent backup
  restoreFromBackup<T>(key: string): T | null {
    try {
      const backups = this.getBackups(key);
      if (backups.length === 0) return null;
      
      // Get most recent backup
      const latestBackup = backups[backups.length - 1];
      
      // Save restored data
      this.save(key, latestBackup.data);
      
      return latestBackup.data as T;
    } catch (e) {
      console.error('Failed to restore from backup', e);
      return null;
    }
  }

  // Schema migration
  private migrateSchema(data: any, fromVersion: number, toVersion: number): any {
    let migrated = data;
    
    // Migration logic for each version
    for (let v = fromVersion + 1; v <= toVersion; v++) {
      switch (v) {
        case 1:
          // Initial version
          break;
        case 2:
          // Add new fields for v2
          migrated = {
            ...migrated,
            abilities: migrated.abilities || { unlocked: [], equipped: [] }
          };
          break;
        // Add more migrations as needed
      }
    }
    
    return migrated;
  }

  // Auto backup
  private startAutoBackup() {
    this.backupTimer = setInterval(() => {
      // Backup all important keys
      const keys = ['flux_player_profile', 'flux_level_progress', 'flux_achievements'];
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          this.createBackup(key);
        }
      });
    }, PERSISTENCE_SETTINGS.BACKUP_INTERVAL);
  }

  // Storage quota management
  checkStorageQuota(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const item = localStorage.getItem(key);
          if (item) {
            used += item.length + key.length;
          }
        }
      }
      
      // Estimate available space (5MB typical limit)
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (e) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Clean old backups if quota exceeded
  cleanOldBackups() {
    const quota = this.checkStorageQuota();
    
    if (quota.percentage > 80) {
      const keys = ['flux_player_profile', 'flux_level_progress', 'flux_achievements'];
      
      keys.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (!stored) return;
          
          const schema: PersistenceSchema = JSON.parse(stored);
          if (schema.backups && schema.backups.length > 2) {
            // Keep only 2 most recent backups
            schema.backups = schema.backups.slice(-2);
            localStorage.setItem(key, JSON.stringify(schema));
          }
        } catch (e) {
          console.error('Failed to clean backups', e);
        }
      });
    }
  }

  // Clear all data
  clearAll() {
    const keys = ['flux_player_profile', 'flux_level_progress', 'flux_achievements', 'flux_stats'];
    keys.forEach(key => localStorage.removeItem(key));
  }

  // Export all data
  exportAll(): string {
    const data: any = {};
    const keys = ['flux_player_profile', 'flux_level_progress', 'flux_achievements', 'flux_stats'];
    
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        data[key] = JSON.parse(item);
      }
    });
    
    return JSON.stringify(data, null, 2);
  }

  // Import all data
  importAll(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);
      
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, JSON.stringify(data[key]));
      });
      
      return true;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  }

  destroy() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
  }
}

// Singleton instance
let persistenceInstance: PersistenceManager | null = null;

export function getPersistenceManager(): PersistenceManager {
  if (!persistenceInstance) {
    persistenceInstance = new PersistenceManager();
  }
  return persistenceInstance;
}

export function destroyPersistenceManager() {
  if (persistenceInstance) {
    persistenceInstance.destroy();
    persistenceInstance = null;
  }
}
