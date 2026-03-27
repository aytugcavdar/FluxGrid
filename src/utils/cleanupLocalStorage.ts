/**
 * localStorage keys that are allowed to remain after v3 migration
 * Only UI preferences should remain in localStorage
 * Requirements: 1.1, 1.4, 3.2
 */
export const ALLOWED_KEYS = [
  'flux_theme',
  'flux_language',
  'flux_muted',
  'ios_pwa_instructions_shown',
  'signin_dismiss_count'
];

/**
 * Cleanup deprecated localStorage keys
 * Run this once after migration to Firestore
 * Removes all game data keys, keeps only UI preferences
 * Requirements: 1.2, 1.3, 1.4, 1.7, 2.7, 3.2
 */
export function cleanupDeprecatedKeys() {
  const deprecatedKeys = [
    // Game data keys (moved to Firestore)
    'flux_highscores',
    'flux_stats',
    'flux_achievements',
    'flux_max_level',
    'flux_passive_unlocks',
    'flux_passive_equipped',
    'flux_player_profile',
    'flux_daily_streak',
    'flux_daily_streak_date',
    'flux_daily_played',
    'flux_highscore',
    'flux_daily_seed_cache',
    'flux_onboard_v1',
    'flux_mode_stats',
    // Legacy Firebase keys
    'firebase_last_sync',
    'firebase_migration_complete',
    'firebase_write_queue',
    'firebase_failed_queue',
    // Legacy PWA key (replaced with ios_pwa_instructions_shown)
    'pwa_installed',
  ];

  deprecatedKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove deprecated key: ${key}`, e);
    }
  });
}
