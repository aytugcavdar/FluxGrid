/**
 * Widget Helper - Syncs game data to native SharedPreferences for widgets
 * 
 * Widget Data Contract:
 * - widget_high_score_endless: High score for endless mode
 * - widget_high_score_timed: High score for timed mode
 * - widget_daily_streak: Current daily streak
 * - widget_last_updated: Last update timestamp
 */

import { Capacitor } from '@capacitor/core';

let Preferences: any = null;

async function getPreferences() {
  if (!Preferences && Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/preferences');
      Preferences = module.Preferences;
    } catch (error) {
      console.error('[Widget] Failed to load Preferences plugin:', error);
    }
  }
  return Preferences;
}

/**
 * Sync high score to native SharedPreferences
 */
export async function syncHighScoreToWidget(gameMode: string, score: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping sync');
    return;
  }
  
  try {
    const prefs = await getPreferences();
    if (!prefs) {
      console.error('[Widget] Preferences plugin not available');
      return;
    }
    
    // Use new widget projection key
    const key = `widget_high_score_${gameMode}`;
    const value = score.toString();
    
    // Save to native SharedPreferences with the key that widget expects
    await prefs.set({
      key: key,
      value: value,
    });
    
    console.log(`[Widget] ✅ Synced high score - Key: ${key}, Value: ${value}`);
    
    // Also save with legacy key for backward compatibility
    const legacyKey = `flux_high_score_${gameMode}`;
    await prefs.set({
      key: legacyKey,
      value: value,
    });
    
    // Verify it was saved
    const result = await prefs.get({ key: key });
    console.log(`[Widget] 🔍 Verification - Read back: ${result.value}`);
  } catch (error) {
    console.error('[Widget] ❌ Failed to sync high score:', error);
  }
}

/**
 * Sync streak to native SharedPreferences
 */
export async function syncStreakToWidget(streak: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping streak sync');
    return;
  }
  
  try {
    const prefs = await getPreferences();
    if (!prefs) {
      console.error('[Widget] Preferences plugin not available');
      return;
    }
    
    // Use new widget projection key
    const key = 'widget_daily_streak';
    const value = streak.toString();
    
    await prefs.set({
      key: key,
      value: value,
    });
    
    console.log(`[Widget] ✅ Synced streak - Key: ${key}, Value: ${value}`);
    
    // Also save with legacy key for backward compatibility
    const legacyKey = 'flux_daily_streak';
    await prefs.set({
      key: legacyKey,
      value: value,
    });
    
    // Verify it was saved
    const result = await prefs.get({ key: key });
    console.log(`[Widget] 🔍 Verification - Read back: ${result.value}`);
  } catch (error) {
    console.error('[Widget] ❌ Failed to sync streak:', error);
  }
}

/**
 * Sync all widget data
 */
export async function syncAllWidgetData(highScores: Record<string, number>, streak: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping all data sync');
    return;
  }
  
  console.log('[Widget] 📊 Starting full sync...');
  console.log('[Widget] High Scores:', highScores);
  console.log('[Widget] Streak:', streak);
  
  try {
    // Sync all high scores
    for (const [mode, score] of Object.entries(highScores)) {
      await syncHighScoreToWidget(mode, score);
    }
    
    // Sync streak
    await syncStreakToWidget(streak);
    
    // Save last updated timestamp
    const prefs = await getPreferences();
    if (prefs) {
      await prefs.set({
        key: 'widget_last_updated',
        value: Date.now().toString(),
      });
    }
    
    console.log('[Widget] ✅ Full sync completed');
    
    // Trigger widget update
    updateWidgets();
  } catch (error) {
    console.error('[Widget] ❌ Failed to sync all data:', error);
  }
}

/**
 * Update all widgets (call native bridge)
 */
export function updateWidgets(): void {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping update');
    return;
  }
  
  try {
    // Call native bridge to update widgets
    if ((window as any).FluxGridWidget) {
      (window as any).FluxGridWidget.update();
      console.log('[Widget] ✅ Update triggered via JavaScript bridge');
    } else {
      console.warn('[Widget] ⚠️ FluxGridWidget bridge not available');
    }
  } catch (error) {
    console.error('[Widget] ❌ Failed to trigger update:', error);
  }
}
