/**
 * Ab-test Service (DEPRECATED)
 * 
 * @deprecated This file is deprecated. Use @core/services/ab-test instead.
 * This file is kept for backward compatibility and will be removed in a future version.
 * 
 * Migration path:
 * - Old: import { ... } from '@core/services/ab-test'
 * - New: import { ... } from '@core/services/ab-test'
 */

// Re-export from canonical location
export * from '../../core/services/ab-test/index';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[DEPRECATION] services/ab-test is deprecated. ' +
    'Use @core/services/ab-test instead.'
  );
}
