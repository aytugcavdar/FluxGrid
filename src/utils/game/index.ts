/**
 * DEPRECATED - Use new location
 * 
 * @deprecated This location is deprecated. Use the new location instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from canonical location
export * from '../features/game/utils/game';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATION] src/utils/game is deprecated. Use src/features/game/utils/game instead.');
}
