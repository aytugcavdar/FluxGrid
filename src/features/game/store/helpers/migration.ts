/**
 * Save data migration utilities
 * Handles backward compatibility for save data format changes
 */

import { createMiniEventState } from './miniEventSystem';
import { createProgressionState } from './progressionSystem';
import { migrateTierData } from './tierSystem';
import { EVENT_DURATIONS } from '../../constants';
import { ProgressionState } from '../../types';

const VALID_ENDLESS_EVENTS = new Set(['ICE_STORM', 'QUAKE', 'MIRROR', 'CHAOS', 'VOID']);

/**
 * Save data interface for migration
 */
export interface SaveData {
  score?: number;
  difficultyTier?: number;
  tier6GravityCharge?: number;
  activeEvent?: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | string | null;
  eventMovesRemaining?: number;
  miniEventState?: any;
  totalMovesPlayed?: number;
  runLinesCleared?: number;
  tierStartMove?: number;
  bonusRerolls?: number;
  bonusShatter?: number;
  bonusBomb?: number;
  progressionState?: ProgressionState;
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
 * Version 2 -> 3 changes:
 * - Initialize progressionState if missing
 * - Ensure COMBO_SHIELD and PIECE_BLESSING are in miniEventState
 * 
 * @param saveData - The save data to migrate
 * @returns Migrated save data with saveVersion = 3
 */
export function migrateSaveData(saveData: SaveData): SaveData {
  const currentVersion = saveData.saveVersion ?? 1;
  
  // No migration needed if already at current version
  if (currentVersion >= 3) {
    return saveData;
  }
  
  let migratedData = { ...saveData };

  if (migratedData.activeEvent && !VALID_ENDLESS_EVENTS.has(migratedData.activeEvent)) {
    migratedData.activeEvent = null;
    migratedData.eventMovesRemaining = 0;
  }
  
  // Version 1 -> 2 migration
  if (currentVersion < 2) {
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
    if (migratedData.tierStartMove === undefined) {
      migratedData.tierStartMove = migratedData.totalMovesPlayed;
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
    
    migratedData.saveVersion = 2;
  }
  
  // Version 2 -> 3 migration
  if (currentVersion < 3) {
    // Initialize progressionState if missing
    if (!migratedData.progressionState) {
      migratedData.progressionState = createProgressionState();
    }
    
    // Ensure COMBO_SHIELD and PIECE_BLESSING are in miniEventState
    if (migratedData.miniEventState) {
      const state = migratedData.miniEventState;
      
      // Add comboShieldActive if missing
      if (state.comboShieldActive === undefined) {
        state.comboShieldActive = false;
      }
    }
    
    migratedData.saveVersion = 3;
  }
  
  return migratedData;
}
