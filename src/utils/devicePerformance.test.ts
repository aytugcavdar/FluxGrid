/**
 * DEPRECATED - Use new location
 * 
 * @deprecated This location is deprecated. Use the new location instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from canonical location
export * from '../core/utils/device/devicePerformance.test';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DEPRECATION] src/utils/devicePerformance.test.ts is deprecated. Use src/core/utils/device/devicePerformance.test.ts instead.');
}
