/**
 * Monitoring Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/monitoring instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@/services/monitoring/sentryService'
 * - New: import { ... } from '@core/services/monitoring/sentryService'
 */

// Re-export from canonical location
export * from '../../core/services/monitoring/sentryService';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/monitoring is deprecated. ' +
    'Use @core/services/monitoring instead.'
  );
}
