/**
 * Gdpr Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/gdpr instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@core/services/gdpr'
 * - New: import { ... } from '@core/services/gdpr'
 */

// Re-export from canonical location
export * from '../../core/services/gdpr/gdprManager';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/gdpr is deprecated. ' +
    'Use @core/services/gdpr instead.'
  );
}
