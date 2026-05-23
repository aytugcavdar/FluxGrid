/**
 * Game Save System
 * Saves and restores game state when user exits and returns
 */

import { GridState, Piece, ProgressionState } from '../../types';
import { createMiniEventState } from './miniEventSystem';
import { GameMode } from '@shared/types';

export interface SavedGameState {
  // Core game state
  grid: GridState;
  pieces: Piece[];
  score: number;
  combo: number;
  
  // Game mode and settings
  gameMode: GameMode;
  difficultyTier: number;
  
  // Timed mode specific
  timeLeft: number;
  timedBoostMovesLeft: number;
  maxCombo: number;
  
  // Event system
  activeEvent: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;
  
  // Mini-events and progression
  miniEventState: ReturnType<typeof createMiniEventState>;
  progressionState: ProgressionState;
  totalMovesPlayed: number;
  tierStartMove: number;
  
  // Timestamp
  savedAt: number;
}

const SAVE_KEY = 'flux_game_save';
const MAX_SAVE_AGE = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save current game state to localStorage
 */
export function saveGameState(state: SavedGameState): boolean {
  try {
    const saveData = {
      ...state,
      savedAt: Date.now(),
      // Deep clone pieces to ensure they serialize properly
      pieces: JSON.parse(JSON.stringify(state.pieces)),
      // Deep clone grid to ensure it serializes properly
      grid: JSON.parse(JSON.stringify(state.grid)),
    };
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('[GameSave] Game state saved successfully');
    console.log('[GameSave] Saved pieces:', saveData.pieces);
    return true;
  } catch (error) {
    console.error('[GameSave] Failed to save game state:', error);
    return false;
  }
}

/**
 * Load saved game state from localStorage
 * Returns null if no valid save exists
 */
export function loadGameState(): SavedGameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      console.log('[GameSave] No saved game found');
      return null;
    }
    
    const saveData: SavedGameState = JSON.parse(saved);
    
    // Check if save is too old
    const age = Date.now() - saveData.savedAt;
    if (age > MAX_SAVE_AGE) {
      console.log('[GameSave] Save data expired, clearing');
      clearGameSave();
      return null;
    }
    
    // Validate that pieces exist and are valid
    if (!saveData.pieces || saveData.pieces.length === 0) {
      console.error('[GameSave] Invalid save data - no pieces');
      clearGameSave();
      return null;
    }
    
    // Validate that grid exists
    if (!saveData.grid || !Array.isArray(saveData.grid)) {
      console.error('[GameSave] Invalid save data - no grid');
      clearGameSave();
      return null;
    }
    
    console.log('[GameSave] Loaded saved game state');
    console.log('[GameSave] Loaded pieces:', saveData.pieces);
    console.log('[GameSave] Loaded grid size:', saveData.grid.length);
    return saveData;
  } catch (error) {
    console.error('[GameSave] Failed to load game state:', error);
    clearGameSave();
    return null;
  }
}

/**
 * Clear saved game state
 */
export function clearGameSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
    console.log('[GameSave] Cleared saved game state');
  } catch (error) {
    console.error('[GameSave] Failed to clear save:', error);
  }
}

/**
 * Check if a valid save exists
 */
export function hasSavedGame(): boolean {
  const saved = loadGameState();
  return saved !== null;
}
