/**
 * Save data migration utilities
 * Handles backward compatibility for save data format changes
 */

import { createMiniEventState } from './miniEventSystem';
import { migrateTierData } from './tierSystem';
import { EVENT_DURATIONS } from '../../constants';
import { MiniEventState } from '../../types';

/**
 * Save data interface for migration
 */
export interface SaveData {
  score?: number;
  difficultyTier?: number;
  activeEvent?: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining?: number;
  miniEventState?: MiniEventState;
  totalMovesPlayed?: number;
  bonusRerolls?: number;
  bonusShatter?: number;
  bonusBomb?: number;
  saveVersion?: number;
  [key: string]: any; // Allow other fields to pass through
}

/**
 * Migrate save data from old version to current version
 * 
 * Version 1 -> 2 changes:
 * - Recalculate tier based on new thresholds
 * - Convert infinite event durations (999) to standardized durations
 * - Initialize miniEventState if missing
 * - Initialize totalMovesPlayed if missing
 * - Initialize bonus skill counters if missing (bonusRerolls, bonusShatter, bonusBomb)
 * 
 * @param saveData - The save data to migrate
 * @returns Migrated save data with saveVersion = 2
 */
export function migrateSaveData(saveData: SaveData): SaveData {
  const currentVersion = saveData.saveVersion ?? 1;
  
  // No migration needed if already at current version
  if (currentVersion >= 2) {
    return saveData;
  }
  
  // Version 1 -> 2 migration
  if (currentVersion < 2) {
    const migratedData = { ...saveData };
    
    // Recalculate tier based on current score and new thresholds
    if (migratedData.score !== undefined) {
      const oldTier = migratedData.difficultyTier ?? 0;
      migratedData.difficultyTier = migrateTierData(oldTier, migratedData.score);
    }
    
    // Convert infinite event durations (999) to standardized durations
    if (migratedData.eventMovesRemaining === 999 && migratedData.activeEvent) {
      const eventName = migratedData.activeEvent;
      if (eventName && EVENT_DURATIONS[eventName]) {
        migratedData.eventMovesRemaining = EVENT_DURATIONS[eventName];
      }
    }
    
    // Initialize miniEventState if missing
    if (!migratedData.miniEventState) {
      migratedData.miniEventState = createMiniEventState();
    }
    
    // Initialize totalMovesPlayed if missing
    if (migratedData.totalMovesPlayed === undefined) {
      migratedData.totalMovesPlayed = 0;
    }
    
    // Initialize bonus skill counters if missing
    if (migratedData.bonusRerolls === undefined) {
      migratedData.bonusRerolls = 0;
    }
    if (migratedData.bonusShatter === undefined) {
      migratedData.bonusShatter = 0;
    }
    if (migratedData.bonusBomb === undefined) {
      migratedData.bonusBomb = 0;
    }
    
    // Set saveVersion to 2
    migratedData.saveVersion = 2;
    
    return migratedData;
  }
  
  return saveData;
}
