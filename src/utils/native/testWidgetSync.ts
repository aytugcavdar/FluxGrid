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
  const currentStreak = useStreakStore.getState().currentStreak;

  console.log('=== WIDGET SYNC TEST ===');
  console.log('High Scores:', state.highScores);
  console.log('Streak:', currentStreak);
  console.log('========================');

  syncAllWidgetData(state.highScores, currentStreak);
}

// Expose to window for easy testing.
if (typeof window !== 'undefined') {
  (window as any).testWidgetSync = testWidgetSync;
  console.log('Widget sync test available: window.testWidgetSync()');
}
