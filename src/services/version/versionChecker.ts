/**
 * Version Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/version instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@/services/version/versionChecker'
 * - New: import { ... } from '@core/services/version/versionChecker'
 */

// Re-export from canonical location
export * from '../../core/services/version/versionChecker';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/version is deprecated. ' +
    'Use @core/services/version instead.'
  );
}
