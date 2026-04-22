import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Hook to sync game data to localStorage when game ends
 * 
 * This hook watches the isGameOver state and triggers localStorage sync
 * when the game ends, including score and stats data.
 * 
 * Offline Support:
 * - All data is saved to localStorage immediately
 */
export function useGameSync() {
  const { isGameOver, score, gameMode, stats, maxLevelReached } = useGameStore();
  
  // Track game start time to calculate session duration
  const gameStartTimeRef = useRef<number>(Date.now());
  const prevGameOverRef = useRef<boolean>(isGameOver);

  // Reset game start time when a new game starts (isGameOver: true -> false)
  useEffect(() => {
    if (prevGameOverRef.current === true && isGameOver === false) {
      gameStartTimeRef.current = Date.now();
    }
    prevGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    // Only sync when game is over
    if (!isGameOver) {
      return;
    }

    const syncData = async () => {
      try {
        // Save to localStorage
        try {
          localStorage.setItem('flux_highscores', JSON.stringify(useGameStore.getState().highScores));
          localStorage.setItem('flux_stats', JSON.stringify(stats));
        } catch (error) {
          console.error('useGameSync: Failed to save to localStorage:', error);
        }
      } catch (error) {
        console.error('useGameSync: Failed to sync game data:', error);
      }
    };

    syncData();
  }, [isGameOver, score, gameMode, stats, maxLevelReached]);

  return {};
}
