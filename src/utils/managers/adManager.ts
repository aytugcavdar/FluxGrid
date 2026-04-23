/**
 * DEPRECATED - Use new location
 * 
 * @deprecated This location is deprecated. Use the new location instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from canonical location
export * from '../../core/services/ads/AdManager';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATION] src/utils/managers/adManager.ts is deprecated. Use src/core/services/ads/AdManager.ts instead.');
}
