/**
 * Cleanup deprecated localStorage keys
 * Run this once on app initialization
 */
export function cleanupDeprecatedKeys() {
  const deprecatedKeys = [
    'firebase_last_sync',
    'firebase_migration_complete',
    'firebase_write_queue',
    'firebase_failed_queue',
    'signin_dismiss_count',
    'ios_pwa_instructions_shown',
    'flux_mode_stats',
  ];

  deprecatedKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove deprecated key: ${key}`, e);
    }
  });
}
