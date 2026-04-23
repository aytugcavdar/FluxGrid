/**
 * Test Widget Sync - Development helper
 * Call this from browser console to test widget sync
 */

import { useGameStore } from '../../features/game/store/gameStore';
import { syncAllWidgetData } from './widgetHelper';

/**
 * Test widget sync with current game data
 * Usage: window.testWidgetSync()
 */
export function testWidgetSync() {
  const state = useGameStore.getState();
  
  console.log('=== WIDGET SYNC TEST ===');
  console.log('High Scores:', state.highScores);
  console.log('Streak:', state.progression.streak);
  console.log('========================');
  
  // Get daily challenge streak from localStorage (not in-game streak)
  const dailyStreak = parseInt(localStorage.getItem('flux_daily_streak') || '0');
  syncAllWidgetData(state.highScores, dailyStreak);
}

// Expose to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testWidgetSync = testWidgetSync;
  console.log('✅ Widget sync test available: window.testWidgetSync()');
}
