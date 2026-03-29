/**
 * localStorage keys that are allowed to remain in local-first architecture
 * Includes UI preferences AND game data (no longer using Firebase)
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export const ALLOWED_KEYS = [
  // UI preferences
  'flux_theme',
  'flux_language',
  'flux_muted',
  'ios_pwa_instructions_shown',
  
  // Game data (local-first)
  'flux_highscore',
  'flux_highscores',
  'flux_stats',
  'flux_achievements',
  'flux_max_level',
  'flux_daily_streak',
  'flux_daily_streak_date',
  'flux_daily_played',
  'flux_daily_seed_cache',
  'flux_onboard_v1',
  'flux_passive_unlocks',
  'flux_passive_equipped',
  
  // LocalStorageService keys
  'flux_game_state',
  'flux_high_scores',
  'flux_passive_abilities',
  'flux_migration_done',
];

/**
 * Cleanup deprecated localStorage keys
 * Removes Firebase-related keys and auth-related keys
 * Preserves game data and UI preferences for local-first architecture
 * Requirements: 10.5, 10.6, 10.7
 */
export function cleanupDeprecatedKeys() {
  const deprecatedKeys = [
    // Firebase-related keys (no longer used)
    'firebase_last_sync',
    'firebase_migration_complete',
    'firebase_migration_v3_complete',
    'firebase_write_queue',
    'firebase_failed_queue',
    'flux_app_config',
    
    // Auth-related keys (auth removed)
    'signin_dismiss_count',
    
    // Legacy keys
    'pwa_installed',
    'flux_player_profile',
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
