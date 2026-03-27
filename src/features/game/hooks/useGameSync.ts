import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { usePassiveAbilityStore } from '@features/abilities/store/passiveAbilityStore';
import { syncScore } from '../../../services/firebase/syncManager';

/**
 * Hook to sync game data to Firestore when game ends
 * 
 * This hook watches the isGameOver state and triggers Firestore sync
 * when the game ends, including score, stats, and abilities data.
 * 
 * IMPORTANT: Only syncs if user is logged in. If not logged in, scores
 * are only saved to localStorage.
 * 
 * Offline Support:
 * - When online: Syncs directly to Firestore
 * - When offline: Adds to pendingWrites queue for later sync
 */
export function useGameSync() {
  const { isGameOver, score, gameMode, stats, maxLevelReached } = useGameStore();
  const { user } = useAuthStore();
  const { passiveAbilities, equippedSlots } = usePassiveAbilityStore();
  
  // Track game start time to calculate session duration
  const gameStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Only sync when game is over
    if (!isGameOver) {
      return;
    }

    // If no user, skip Firestore sync (localStorage only)
    if (!user) {
      console.log('useGameSync: No user logged in, skipping Firestore sync');
      return;
    }

    const syncData = async () => {
      try {
        // Build passiveUnlocks array from unlocked abilities
        const passiveUnlocks: string[] = [];
        passiveAbilities.forEach((ability, type) => {
          if (ability.unlocked) {
            passiveUnlocks.push(type);
          }
        });

        // Build passiveEquipped array from equipped slots
        const passiveEquipped = equippedSlots.filter(slot => slot !== null) as string[];

        // Prepare abilities data
        const abilitiesData = {
          passiveUnlocks,
          passiveEquipped,
          maxUnlockedLevel: maxLevelReached
        };

        // Calculate session duration in seconds
        const sessionDurationSecs = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        
        console.log('useGameSync: Syncing game data', {
          score,
          gameMode,
          sessionDurationSecs,
          user: user.uid
        });

        // Check if online or offline
        if (navigator.onLine) {
          // Online: Sync directly to Firestore
          await syncScore(
            user.uid,
            gameMode,
            score,
            user.displayName || 'Oyuncu',
            user.photoURL || null,
            sessionDurationSecs,
            abilitiesData,
            stats // Pass stats to be synced
          );
          console.log('useGameSync: Successfully synced game data');
        } else {
          // Offline: Add to pending writes queue
          const { addToPendingWrites } = await import('../../../services/firebase/syncManager');
          await addToPendingWrites(user.uid, 'score', {
            mode: gameMode,
            score,
            displayName: user.displayName || 'Oyuncu',
            photoURL: user.photoURL || null,
            sessionDurationSecs,
            abilities: abilitiesData,
            stats // Include stats in pending writes
          });
          console.log('useGameSync: Added to pending writes (offline)');
        }
      } catch (error) {
        console.error('useGameSync: Failed to sync game data:', error);
      }
    };

    syncData();
  }, [isGameOver, user, score, gameMode, stats, maxLevelReached, passiveAbilities, equippedSlots]);

  return {};
}
