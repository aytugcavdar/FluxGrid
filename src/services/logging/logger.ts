/**
 * Logging Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/logging instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@/services/logging/logger'
 * - New: import { ... } from '@core/services/logging/logger'
 */

// Re-export from canonical location
export * from '../../core/services/logging/logger';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/logging is deprecated. ' +
    'Use @core/services/logging instead.'
  );
}
