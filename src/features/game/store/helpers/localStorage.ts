/**
 * Safe localStorage operations with error handling
 */
import { safeExecute, ErrorCategory } from '../../../../utils/errorHandler';

// Debounce timers
let saveTimers: { [key: string]: NodeJS.Timeout } = {};

/**
 * Debounced localStorage save with error handling
 */
export const debouncedSave = (key: string, value: string, delay: number = 500) => {
  if (saveTimers[key]) clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(() => {
    safeExecute(
      () => localStorage.setItem(key, value),
      undefined,
      ErrorCategory.STORAGE,
      { key, operation: 'write' }
    );
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
