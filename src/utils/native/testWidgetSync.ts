/**
 * Test Widget Sync - Development helper.
 * Call this from browser console to test widget sync.
 */

import { useGameStore } from '../../features/game/store/gameStore';
import { useStreakStore } from '../../shared/store/streakStore';
import { syncAllWidgetData } from './widgetHelper';

/**
 * Test widget sync with current game data.
 * Usage: window.testWidgetSync()
 */
export function testWidgetSync() {
  const state = useGameStore.getState();
  const streakState = useStreakStore.getState();

  console.log('=== WIDGET SYNC TEST ===');
  console.log('High Scores:', state.highScores);
  console.log('Last Score:', state.gameLogs?.[0]?.score ?? 0);
  console.log('Streak:', streakState.currentStreak);
  console.log('Today Played:', streakState.todayPlayed);
  console.log('========================');

  syncAllWidgetData(
    state.highScores,
    streakState.currentStreak,
    state.gameLogs?.[0]?.score ?? 0,
    streakState.todayPlayed
  );
}

// Expose to window for easy testing.
if (typeof window !== 'undefined') {
  (window as any).testWidgetSync = testWidgetSync;
  console.log('Widget sync test available: window.testWidgetSync()');
}
