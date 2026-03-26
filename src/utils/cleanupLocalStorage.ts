/**
 * localStorage keys that are allowed to remain after v3 migration
 * Requirements: 1.1, 1.4
 */
export const ALLOWED_KEYS = [
  'flux_theme',
  'flux_language',
  'flux_muted',
  'pwa_installed'
];

/**
 * Cleanup deprecated localStorage keys
 * Run this once after migration
 * Requirements: 1.2, 1.3, 1.4
 */
export function cleanupDeprecatedKeys() {
  const deprecatedKeys = [
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
    'signin_dismiss_count',
    'ios_pwa_instructions_shown',
    'flux_mode_stats',
    'firebase_last_sync',
    'firebase_migration_complete',
    'firebase_write_queue',
    'firebase_failed_queue',
  ];

  deprecatedKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove deprecated key: ${key}`, e);
    }
  });
}
