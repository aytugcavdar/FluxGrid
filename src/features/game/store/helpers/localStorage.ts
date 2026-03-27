/**
 * Safe localStorage operations with error handling
 */
import { safeExecute, ErrorCategory } from '../../../../utils/errorHandler';
import { MiniEventState, MiniEventType } from '../../types';
import { createMiniEventState } from './miniEventSystem';

// Debounce timers
let saveTimers: { [key: string]: ReturnType<typeof setTimeout> } = {};

// Allowed localStorage keys (only these can be saved)
const ALLOWED_KEYS = [
  'flux_theme',
  'flux_language',
  'flux_muted',
  'flux_onboard_v1',
  'flux_daily_played',
  'flux_daily_streak_date',
  'pwa_installed',
  'flux_highscore', // offline cache only
  'flux_survival_highscore',
  'flux_mode_stats',
  // Firebase cache keys (read-only, updated by Firebase sync)
  'flux_stats',
  'flux_achievements',
  'flux_max_level',
  'flux_daily_streak',
  'flux_highscores',
  'flux_player_profile',
  'flux_level_progress',
  'flux_passive_unlocks',
  'flux_passive_equipped',
];

/**
 * Debounced localStorage save with error handling and requestIdleCallback optimization
 * Only allows saving to whitelisted keys
 */
export const debouncedSave = (key: string, value: string, delay: number = 500) => {
  // Block saves to non-whitelisted keys
  if (!ALLOWED_KEYS.includes(key)) {
    console.warn(`[localStorage] Blocked save to non-whitelisted key: ${key}`);
    return;
  }

  if (saveTimers[key]) clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        safeExecute(
          () => localStorage.setItem(key, value),
          undefined,
          ErrorCategory.STORAGE,
          { key, operation: 'write' }
        );
      }, { timeout: 2000 });
    } else {
      safeExecute(
        () => localStorage.setItem(key, value),
        undefined,
        ErrorCategory.STORAGE,
        { key, operation: 'write' }
      );
    }
    delete saveTimers[key];
  }, delay);
};

/**
 * Safe localStorage get with fallback
 */
export const safeLocalStorageGet = (key: string, defaultValue: string): string => {
  return safeExecute(
    () => localStorage.getItem(key) || defaultValue,
    defaultValue,
    ErrorCategory.STORAGE,
    { key, operation: 'read' }
  );
};

/**
 * Safe parseInt with NaN handling
 */
export const safeParseInt = (value: string, defaultValue: number = 0): number => {
  return safeExecute(
    () => {
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    },
    defaultValue,
    ErrorCategory.VALIDATION,
    { value, type: 'parseInt' }
  );
};

/**
 * Safe JSON parse with error handling
 */
export const safeJSONParse = <T>(value: string, defaultValue: T): T => {
  return safeExecute(
    () => JSON.parse(value),
    defaultValue,
    ErrorCategory.STORAGE,
    { operation: 'JSON.parse' }
  );
};

/**
 * Serializable version of MiniEventState for localStorage
 * Converts Set to array for JSON serialization
 */
interface SerializableMiniEventState {
  activeEvents: MiniEventType[];
  moveCounters: {
    [MiniEventType.FLUX_SURGE]: number;
    [MiniEventType.SCORE_RUSH]: number;
    [MiniEventType.CLEAR_BONUS]: number;
  };
  lastActivation: {
    [MiniEventType.FLUX_SURGE]: number;
    [MiniEventType.SCORE_RUSH]: number;
    [MiniEventType.CLEAR_BONUS]: number;
  };
}

/**
 * Serialize MiniEventState for localStorage
 * Converts Set<MiniEventType> to array for JSON compatibility
 * 
 * @param miniEventState - The mini-event state to serialize
 * @returns Serializable version with Set converted to array
 */
export function serializeMiniEventState(miniEventState: MiniEventState): SerializableMiniEventState {
  return {
    activeEvents: Array.from(miniEventState.activeEvents),
    moveCounters: { ...miniEventState.moveCounters },
    lastActivation: { ...miniEventState.lastActivation },
  };
}

/**
 * Deserialize MiniEventState from localStorage
 * Converts array back to Set<MiniEventType>
 * 
 * @param serialized - The serialized mini-event state (or undefined if missing)
 * @returns MiniEventState with Set restored, or default state if missing
 */
export function deserializeMiniEventState(serialized?: SerializableMiniEventState): MiniEventState {
  if (!serialized) {
    return createMiniEventState();
  }
  
  return {
    activeEvents: new Set(serialized.activeEvents),
    moveCounters: { ...serialized.moveCounters },
    lastActivation: { ...serialized.lastActivation },
  };
}

/**
 * Serialize game state for localStorage
 * Handles miniEventState Set serialization and totalMovesPlayed
 * 
 * @param gameState - Partial game state to serialize
 * @returns Serialized game state ready for localStorage
 */
export function serializeGameState(gameState: {
  miniEventState?: MiniEventState;
  totalMovesPlayed?: number;
  [key: string]: any;
}): any {
  const serialized: any = { ...gameState };
  
  // Serialize miniEventState if present
  if (gameState.miniEventState) {
    serialized.miniEventState = serializeMiniEventState(gameState.miniEventState);
  }
  
  // Ensure totalMovesPlayed is included
  if (gameState.totalMovesPlayed !== undefined) {
    serialized.totalMovesPlayed = gameState.totalMovesPlayed;
  }
  
  return serialized;
}

/**
 * Deserialize game state from localStorage
 * Handles miniEventState Set deserialization and totalMovesPlayed defaults
 * 
 * @param serialized - Serialized game state from localStorage
 * @returns Game state with miniEventState Set restored and defaults applied
 */
export function deserializeGameState(serialized: any): {
  miniEventState: MiniEventState;
  totalMovesPlayed: number;
  [key: string]: any;
} {
  const deserialized = { ...serialized };
  
  // Deserialize miniEventState (or use default if missing)
  deserialized.miniEventState = deserializeMiniEventState(serialized.miniEventState);
  
  // Initialize totalMovesPlayed with default if missing
  if (deserialized.totalMovesPlayed === undefined) {
    deserialized.totalMovesPlayed = 0;
  }
  
  return deserialized;
}
