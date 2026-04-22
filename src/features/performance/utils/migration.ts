/**
 * Migration Utilities
 * 
 * Handles backward compatibility and data migration
 */

import { useTutorialStore } from '../../tutorial/store/tutorialStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Migrate player data from old format to new format
 */
export function migratePlayerData(): void {
  console.log('[Migration] Starting player data migration...');
  
  // Check if player has existing save data
  const hasExistingSave = localStorage.getItem('flux_player_v1') !== null;
  
  if (hasExistingSave) {
    console.log('[Migration] Existing player detected');
    
    // Mark as returning player with all features unlocked
    const tutorialStore = useTutorialStore.getState();
    tutorialStore.markAsReturningPlayer();
    
    // Set games completed to 100 to unlock all features
    localStorage.setItem('flux_tutorial_v2', JSON.stringify({
      isActive: false,
      currentStep: 0,
      isCompleted: true,
      isReturningPlayer: true,
      gamesCompleted: 100,
      featuresUnlocked: ['comboTimer', 'basicSkills', 'allSkills', 'events', 'miniEvents'],
      metrics: {
        startTime: Date.now(),
        completionTime: Date.now(),
        stepDurations: [],
        skipped: false
      }
    }));
    
    console.log('[Migration] Player marked as returning player with all features unlocked');
  } else {
    console.log('[Migration] New player detected');
  }
  
  // Migrate settings
  migrateSettings();
  
  // Migrate tutorial state
  migrateTutorialState();
  
  console.log('[Migration] Player data migration complete');
}

/**
 * Migrate settings from old format to new format
 */
export function migrateSettings(): void {
  console.log('[Migration] Starting settings migration...');
  
  // Check for old performance_mode setting
  const oldSettings = localStorage.getItem('flux_settings_v1');
  
  if (oldSettings) {
    try {
      const parsed = JSON.parse(oldSettings);
      const settingsStore = useSettingsStore.getState();
      
      // Migrate performance_mode to new preset system
      if (parsed.performance_mode) {
        const presetMap: Record<string, 'low' | 'medium' | 'high'> = {
          'lite': 'low',
          'balanced': 'medium',
          'quality': 'high'
        };
        
        const newPreset = presetMap[parsed.performance_mode] || 'medium';
        settingsStore.setQualityPreset(newPreset);
        
        console.log(`[Migration] Migrated performance_mode: ${parsed.performance_mode} -> ${newPreset}`);
      }
      
      // Preserve existing settings
      if (parsed.sound !== undefined) {
        // Sound settings are handled elsewhere
        console.log('[Migration] Preserved sound settings');
      }
      
      if (parsed.music !== undefined) {
        // Music settings are handled elsewhere
        console.log('[Migration] Preserved music settings');
      }
      
      if (parsed.haptics !== undefined) {
        // Haptics settings are handled elsewhere
        console.log('[Migration] Preserved haptics settings');
      }
      
      if (parsed.theme !== undefined) {
        // Theme settings are handled elsewhere
        console.log('[Migration] Preserved theme settings');
      }
      
    } catch (error) {
      console.error('[Migration] Failed to parse old settings:', error);
    }
  }
  
  console.log('[Migration] Settings migration complete');
}

/**
 * Migrate tutorial state from old format to new format
 */
export function migrateTutorialState(): void {
  console.log('[Migration] Starting tutorial state migration...');
  
  // Check for old onboarding state
  const oldOnboarding = localStorage.getItem('flux_onboard_v1');
  
  if (oldOnboarding) {
    try {
      const parsed = JSON.parse(oldOnboarding);
      
      // If old onboarding was completed, mark new tutorial as completed
      if (parsed.completed) {
        const tutorialStore = useTutorialStore.getState();
        tutorialStore.complete();
        
        console.log('[Migration] Migrated completed onboarding state');
      }
      
      // Remove old onboarding data
      localStorage.removeItem('flux_onboard_v1');
      
    } catch (error) {
      console.error('[Migration] Failed to parse old onboarding state:', error);
    }
  }
  
  console.log('[Migration] Tutorial state migration complete');
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  // Check if any old data exists
  const hasOldPlayer = localStorage.getItem('flux_player_v1') !== null;
  const hasOldSettings = localStorage.getItem('flux_settings_v1') !== null;
  const hasOldOnboarding = localStorage.getItem('flux_onboard_v1') !== null;
  
  // Check if new data already exists
  const hasNewTutorial = localStorage.getItem('flux_tutorial_v2') !== null;
  const hasNewSettings = localStorage.getItem('flux_performance_v1') !== null;
  
  // Need migration if old data exists and new data doesn't
  return (hasOldPlayer || hasOldSettings || hasOldOnboarding) && (!hasNewTutorial || !hasNewSettings);
}

/**
 * Run migration if needed
 */
export function runMigrationIfNeeded(): void {
  if (needsMigration()) {
    console.log('[Migration] Migration needed, starting...');
    migratePlayerData();
  } else {
    console.log('[Migration] No migration needed');
  }
}
