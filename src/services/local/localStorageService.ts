/**
 * LocalStorageService - Centralized localStorage management
 * 
 * This service provides a unified interface for all localStorage operations,
 * including error handling, data validation, and fallback to in-memory storage.
 */

import { GameMode } from '@shared/types';
import type { GameStats } from '@shared/types';
import type { GridState, Piece, MiniEventState } from '@features/game/types';
import type { PassiveAbilityType } from '@features/abilities/types';

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  // Game data
  GAME_STATE: 'flux_game_state',
  HIGH_SCORES: 'flux_high_scores',
  STATS: 'flux_stats',
  
  // Abilities
  PASSIVE_ABILITIES: 'flux_passive_abilities',
  
  // Settings
  THEME: 'flux_theme',
  LANGUAGE: 'flux_language',
  MUTED: 'flux_muted',
  
  // Daily challenge
  DAILY_PLAYED: 'flux_daily_played',
  DAILY_STREAK: 'flux_daily_streak',
  DAILY_STREAK_DATE: 'flux_daily_streak_date',
  
  // Migration
  MIGRATION_DONE: 'flux_migration_done',
  
  // Deprecated keys (to be removed)
  DEPRECATED: [
    'flux_player_profile',
    'flux_level_progress',
    'flux_achievements',
    'flux_max_level',
    'flux_passive_unlocks',
    'flux_passive_equipped',
    'flux_highscores', // old format
  ],
} as const;

// ============================================================================
// Error Types
// ============================================================================

export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  STORAGE_DISABLED = 'STORAGE_DISABLED',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class LocalStorageError extends Error {
  constructor(
    public type: StorageErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

// ============================================================================
// Data Interfaces
// ============================================================================

export interface GameState {
  // Core game state
  score: number;
  highScore: number;
  combo: number;
  flux: number;
  
  // Bonus Skills (Daily Reward System)
  bonusRerolls: number;
  bonusShatter: number;
  bonusBomb: number;
  
  // Grid state
  grid: GridState;
  pieces: Piece[];
  
  // Mode-specific state
  gameMode: GameMode;
  timeLeft: number;
  difficultyTier: number;
  
  // Event system state
  activeEvent: string | null;
  eventMovesRemaining: number;
  miniEventState: MiniEventState;
  totalMovesPlayed: number;
  
  // Metadata
  lastSaved: number;
  version: number;
}

export interface PassiveAbilityData {
  unlocked: PassiveAbilityType[];
  equipped: PassiveAbilityType[];
  maxLevel: number;
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
// Storage Manager
// ============================================================================

class StorageManager {
  private storage: Storage | InMemoryStorage;
  private isLocalStorageAvailable: boolean;
  
  constructor() {
    const result = this.initializeStorage();
    this.storage = result.storage;
    this.isLocalStorageAvailable = result.available;
  }
  
  private initializeStorage(): { storage: Storage | InMemoryStorage; available: boolean } {
    try {
      // Test localStorage availability
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return { storage: localStorage, available: true };
    } catch {
      // Fallback to in-memory storage
      console.warn('localStorage is not available. Using in-memory storage fallback.');
      return { storage: new InMemoryStorage(), available: false };
    }
  }
  
  getStorage(): Storage | InMemoryStorage {
    return this.storage;
  }
  
  isAvailable(): boolean {
    return this.isLocalStorageAvailable;
  }
}

// ============================================================================
// LocalStorageService
// ============================================================================

class LocalStorageServiceClass {
  private storageManager: StorageManager;
  
  constructor() {
    this.storageManager = new StorageManager();
  }
  
  // ========================================================================
  // Game State Management
  // ========================================================================
  
  saveGameState(state: GameState): void {
    try {
      const stateWithMetadata = {
        ...state,
        lastSaved: Date.now(),
        version: 1,
      };
      
      if (!this.validateGameState(stateWithMetadata)) {
        throw new LocalStorageError(
          StorageErrorType.VALIDATION_ERROR,
          'Invalid game state data'
        );
      }
      
      const serialized = JSON.stringify(stateWithMetadata);
      this.storageManager.getStorage().setItem(STORAGE_KEYS.GAME_STATE, serialized);
    } catch (error) {
      this.handleStorageError(error as Error);
    }
  }
  
  loadGameState(): GameState | null {
    try {
      const data = this.storageManager.getStorage().getItem(STORAGE_KEYS.GAME_STATE);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      if (!this.validateGameState(parsed)) {
        throw new LocalStorageError(
          StorageErrorType.CORRUPTED_DATA,
          'Game state data is corrupted'
        );
      }
      
      return parsed;
    } catch (error) {
      this.handleStorageError(error as Error);
      return null;
    }
  }
  
  // ========================================================================
  // High Scores Management
  // ========================================================================
  
  saveHighScore(mode: GameMode, score: number): void {
    try {
      const highScores = this.loadHighScores();
      
      // Only update if new score is higher
      if (!highScores[mode] || score > highScores[mode]) {
        highScores[mode] = score;
        
        const serialized = JSON.stringify(highScores);
        this.storageManager.getStorage().setItem(STORAGE_KEYS.HIGH_SCORES, serialized);
      }
    } catch (error) {
      this.handleStorageError(error as Error);
    }
  }
  
  loadHighScores(): Record<GameMode, number> {
    try {
      const data = this.storageManager.getStorage().getItem(STORAGE_KEYS.HIGH_SCORES);
      if (!data) {
        return this.getDefaultHighScores();
      }
      
      const parsed = JSON.parse(data);
      return { ...this.getDefaultHighScores(), ...parsed };
    } catch (error) {
      this.handleStorageError(error as Error);
      return this.getDefaultHighScores();
    }
  }
  
  private getDefaultHighScores(): Record<GameMode, number> {
    return {
      [GameMode.ENDLESS]: 0,
      [GameMode.TIMED]: 0,
      [GameMode.DAILY_CHALLENGE]: 0,
      [GameMode.ZEN]: 0,
    };
  }
  
  // ========================================================================
  // Statistics Management
  // ========================================================================
  
  saveStats(stats: GameStats): void {
    try {
      if (!this.validateStats(stats)) {
        throw new LocalStorageError(
          StorageErrorType.VALIDATION_ERROR,
          'Invalid statistics data'
        );
      }
      
      const serialized = JSON.stringify(stats);
      this.storageManager.getStorage().setItem(STORAGE_KEYS.STATS, serialized);
    } catch (error) {
      this.handleStorageError(error as Error);
    }
  }
  
  loadStats(): GameStats | null {
    try {
      const data = this.storageManager.getStorage().getItem(STORAGE_KEYS.STATS);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      if (!this.validateStats(parsed)) {
        throw new LocalStorageError(
          StorageErrorType.CORRUPTED_DATA,
          'Statistics data is corrupted'
        );
      }
      
      return parsed;
    } catch (error) {
      this.handleStorageError(error as Error);
      return null;
    }
  }
  
  // ========================================================================
  // Passive Abilities Management
  // ========================================================================
  
  savePassiveAbilities(abilities: PassiveAbilityData): void {
    try {
      if (!this.validatePassiveAbilities(abilities)) {
        throw new LocalStorageError(
          StorageErrorType.VALIDATION_ERROR,
          'Invalid passive abilities data'
        );
      }
      
      const serialized = JSON.stringify(abilities);
      this.storageManager.getStorage().setItem(STORAGE_KEYS.PASSIVE_ABILITIES, serialized);
    } catch (error) {
      this.handleStorageError(error as Error);
    }
  }
  
  loadPassiveAbilities(): PassiveAbilityData | null {
    try {
      const data = this.storageManager.getStorage().getItem(STORAGE_KEYS.PASSIVE_ABILITIES);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      if (!this.validatePassiveAbilities(parsed)) {
        throw new LocalStorageError(
          StorageErrorType.CORRUPTED_DATA,
          'Passive abilities data is corrupted'
        );
      }
      
      return parsed;
    } catch (error) {
      this.handleStorageError(error as Error);
      return null;
    }
  }
  
  // ========================================================================
  // Utility Methods
  // ========================================================================
  
  clearAllGameData(): void {
    try {
      const storage = this.storageManager.getStorage();
      
      // Remove game-related keys
      storage.removeItem(STORAGE_KEYS.GAME_STATE);
      storage.removeItem(STORAGE_KEYS.HIGH_SCORES);
      storage.removeItem(STORAGE_KEYS.STATS);
      storage.removeItem(STORAGE_KEYS.PASSIVE_ABILITIES);
      storage.removeItem(STORAGE_KEYS.DAILY_PLAYED);
      storage.removeItem(STORAGE_KEYS.DAILY_STREAK);
      storage.removeItem(STORAGE_KEYS.DAILY_STREAK_DATE);
      
      // Remove deprecated keys
      STORAGE_KEYS.DEPRECATED.forEach(key => {
        storage.removeItem(key);
      });
      
      // Preserve settings (theme, language, muted)
      // These are not removed
    } catch (error) {
      this.handleStorageError(error as Error);
    }
  }
  
  // ========================================================================
  // Validation Methods
  // ========================================================================
  
  private validateGameState(state: any): boolean {
    if (!state || typeof state !== 'object') return false;
    
    // Check required fields
    if (typeof state.score !== 'number') return false;
    if (typeof state.highScore !== 'number') return false;
    if (typeof state.combo !== 'number') return false;
    if (typeof state.flux !== 'number') return false;
    
    // Check value ranges
    if (state.score < 0 || state.score > 1000000000) return false;
    if (state.highScore < 0 || state.highScore > 1000000000) return false;
    if (state.combo < 0 || state.combo > 10000) return false;
    if (state.flux < 0 || state.flux > 1000000) return false;
    
    // Check data types
    if (!Array.isArray(state.grid)) return false;
    if (!Array.isArray(state.pieces)) return false;
    
    return true;
  }
  
  private validateStats(stats: any): boolean {
    if (!stats || typeof stats !== 'object') return false;
    
    // Check required fields
    if (typeof stats.blocksPlaced !== 'number') return false;
    if (typeof stats.linesCleared !== 'number') return false;
    if (typeof stats.totalScore !== 'number') return false;
    if (typeof stats.bombsExploded !== 'number') return false;
    if (typeof stats.iceBroken !== 'number') return false;
    if (typeof stats.gamesPlayed !== 'number') return false;
    
    // Check value ranges
    if (stats.blocksPlaced < 0) return false;
    if (stats.linesCleared < 0) return false;
    if (stats.totalScore < 0) return false;
    if (stats.bombsExploded < 0) return false;
    if (stats.iceBroken < 0) return false;
    if (stats.gamesPlayed < 0) return false;
    
    return true;
  }
  
  private validatePassiveAbilities(abilities: any): boolean {
    if (!abilities || typeof abilities !== 'object') return false;
    
    // Check required fields
    if (!Array.isArray(abilities.unlocked)) return false;
    if (!Array.isArray(abilities.equipped)) return false;
    if (typeof abilities.maxLevel !== 'number') return false;
    
    // Check value ranges
    if (abilities.maxLevel < 0 || abilities.maxLevel > 100) return false;
    
    return true;
  }
  
  // ========================================================================
  // Error Handling
  // ========================================================================
  
  handleStorageError(error: Error): void {
    if (error instanceof LocalStorageError) {
      console.error(`LocalStorageError [${error.type}]:`, error.message);
      
      switch (error.type) {
        case StorageErrorType.QUOTA_EXCEEDED:
          this.notifyUser('Storage full. Please clear some data.');
          break;
        case StorageErrorType.STORAGE_DISABLED:
          this.notifyUser('Storage disabled. Game will use temporary storage.');
          break;
        case StorageErrorType.CORRUPTED_DATA:
          console.warn('Corrupted data detected. Using default values.');
          break;
        case StorageErrorType.SERIALIZATION_ERROR:
          console.error('Failed to serialize data.');
          break;
        case StorageErrorType.VALIDATION_ERROR:
          console.error('Data validation failed.');
          break;
      }
    } else if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      this.notifyUser('Storage full. Please clear some data.');
    } else if (error.name === 'SecurityError') {
      console.error('localStorage access denied');
      this.notifyUser('Storage disabled. Game will use temporary storage.');
    } else if (error instanceof SyntaxError) {
      // JSON parse error - log but don't throw
      console.error('Failed to parse JSON data:', error);
    } else {
      console.error('Unexpected storage error:', error);
    }
  }
  
  private notifyUser(message: string): void {
    // This will be implemented later with a proper notification system
    // For now, just log to console
    console.warn('User notification:', message);
  }
  
  // ========================================================================
  // Storage Info
  // ========================================================================
  
  isStorageAvailable(): boolean {
    return this.storageManager.isAvailable();
  }
  
  getStorageUsage(): number {
    try {
      const storage = this.storageManager.getStorage();
      let total = 0;
      
      // For in-memory storage, iterate over the Map
      if (storage instanceof InMemoryStorage) {
        // Access the private data property through iteration
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            const value = storage.getItem(key);
            if (value) {
              total += key.length + value.length;
            }
          }
        }
      } else {
        // For localStorage, use Object.keys
        const keys = Object.keys(storage);
        for (const key of keys) {
          const value = storage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
      
      return total;
    } catch {
      return 0;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const LocalStorageService = new LocalStorageServiceClass();
