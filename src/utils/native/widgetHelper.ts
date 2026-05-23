/**
 * Widget Helper - Syncs game data to native SharedPreferences for widgets.
 *
 * Widget Data Contract:
 * - widget_high_score_endless: High score for endless mode
 * - widget_high_score_timed: High score for timed mode
 * - widget_daily_streak: Current daily streak
 * - widget_last_updated: Last update timestamp
 */

import { Capacitor } from '@capacitor/core';

let Preferences: any = null;
const WIDGET_SCORE_MODES = ['endless', 'timed'] as const;

export function normalizeWidgetMode(gameMode: string): string {
  return gameMode.trim().toLowerCase();
}

function toWidgetScore(score: unknown): number {
  const numericScore = typeof score === 'number' ? score : Number(score);
  return Number.isFinite(numericScore) && numericScore > 0 ? Math.floor(numericScore) : 0;
}

function readScore(highScores: Record<string, number>, mode: string): number {
  const upperMode = mode.toUpperCase();
  return toWidgetScore(highScores[mode] ?? highScores[upperMode] ?? 0);
}

export function createWidgetHighScoreProjection(highScores: Record<string, number>): Record<string, number> {
  return WIDGET_SCORE_MODES.reduce<Record<string, number>>((projection, mode) => {
    projection[mode] = readScore(highScores, mode);
    return projection;
  }, {});
}

function getWidgetBridge(): { syncStats?: (endlessScore: number, timedScore: number, streak: number) => void; update?: () => void } | null {
  if (typeof window === 'undefined') return null;
  return (window as any).FluxGridWidget ?? null;
}

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
 * Sync high score to native SharedPreferences.
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

    // Native widgets read lowercase mode keys.
    const modeKey = normalizeWidgetMode(gameMode);
    const key = `widget_high_score_${modeKey}`;
    const legacyKey = `flux_high_score_${modeKey}`;
    const value = toWidgetScore(score).toString();

    await prefs.set({ key, value });
    await prefs.set({ key: legacyKey, value });

    console.log(`[Widget] Synced high score - Key: ${key}, Value: ${value}`);

    const result = await prefs.get({ key });
    console.log(`[Widget] Verification - Read back: ${result.value}`);
  } catch (error) {
    console.error('[Widget] Failed to sync high score:', error);
  }
}

/**
 * Sync streak to native SharedPreferences.
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

    const key = 'widget_daily_streak';
    const value = toWidgetScore(streak).toString();

    await prefs.set({ key, value });
    await prefs.set({ key: 'flux_daily_streak', value });

    console.log(`[Widget] Synced streak - Key: ${key}, Value: ${value}`);

    const result = await prefs.get({ key });
    console.log(`[Widget] Verification - Read back: ${result.value}`);
  } catch (error) {
    console.error('[Widget] Failed to sync streak:', error);
  }
}

/**
 * Sync all widget data.
 */
export async function syncAllWidgetData(highScores: Record<string, number>, streak: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping all data sync');
    return;
  }

  console.log('[Widget] Starting full sync...');
  console.log('[Widget] High Scores:', highScores);
  console.log('[Widget] Streak:', streak);

  try {
    const widgetHighScores = createWidgetHighScoreProjection(highScores);
    const widgetStreak = toWidgetScore(streak);
    const bridge = getWidgetBridge();

    if (typeof bridge?.syncStats === 'function') {
      bridge.syncStats(widgetHighScores.endless, widgetHighScores.timed, widgetStreak);
      console.log('[Widget] Synced stats via JavaScript bridge');
      return;
    }

    for (const [mode, score] of Object.entries(widgetHighScores)) {
      await syncHighScoreToWidget(mode, score);
    }

    await syncStreakToWidget(widgetStreak);

    const prefs = await getPreferences();
    if (prefs) {
      await prefs.set({
        key: 'widget_last_updated',
        value: Date.now().toString(),
      });
    }

    console.log('[Widget] Full sync completed');

    updateWidgets();
  } catch (error) {
    console.error('[Widget] Failed to sync all data:', error);
  }
}

/**
 * Update all widgets through the native JavaScript bridge.
 */
export function updateWidgets(): void {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Widget] Not on native platform, skipping update');
    return;
  }

  try {
    const bridge = getWidgetBridge();
    if (bridge?.update) {
      bridge.update();
      console.log('[Widget] Update triggered via JavaScript bridge');
    } else {
      console.warn('[Widget] FluxGridWidget bridge not available');
    }
  } catch (error) {
    console.error('[Widget] Failed to trigger update:', error);
  }
}
