/**
 * Safe localStorage operations with error handling
 */
import { safeExecute, ErrorCategory } from '../../../../utils/errorHandler';

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
