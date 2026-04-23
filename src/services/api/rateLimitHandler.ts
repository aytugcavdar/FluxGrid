/**
 * API Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/api instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@/services/api/rateLimitHandler'
 * - New: import { ... } from '@core/services/api/rateLimitHandler'
 */

// Re-export from canonical location
export * from '../../core/services/api/rateLimitHandler';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/api is deprecated. ' +
    'Use @core/services/api instead.'
  );
}
