import { useEffect, useRef } from 'react';
import { GameMode, GameStats, AppState } from '@shared/types';
import { useGameStore } from '@features/game/store/gameStore';
import { useAuthStore } from '@features/auth/store/authStore';
import { usePassiveAbilityStore } from '@features/abilities/store/passiveAbilityStore';
import { syncGameData, syncScore, syncDailyChallenge, addToPendingWrites } from '../../services/firebase/syncManager';
import { detectPlatform } from '../../services/firebase/types';
import { getStreak } from '@utils/streakManager';
import { increment } from 'firebase/firestore';

interface GameSyncParams {
  isGameOver: boolean;
  score: number;
  gameMode: GameMode;
  combo: number;
  stats: GameStats;
}

export function useGameSync(params: GameSyncParams): void {
  const { isGameOver, score, gameMode, combo, stats } = params;
  const { appState } = useGameStore();
  const gameStartTimeRef = useRef<number>(0);

  // Track game start time for session duration
  useEffect(() => {
    if (appState === AppState.GAME) {
      gameStartTimeRef.current = Date.now();
    }
  }, [appState]);

  // Sync game data to Firebase when game ends
  useEffect(() => {
    if (!isGameOver || score === 0) return;
    
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    const sessionDurationSecs = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    const today = new Date().toISOString().split('T')[0];
    
    // Get abilities data from stores
    const { maxLevelReached } = useGameStore.getState();
    const { equippedSlots, passiveAbilities } = usePassiveAbilityStore.getState();
    
    // Build passiveUnlocks array from unlocked abilities
    const passiveUnlocks: string[] = [];
    passiveAbilities.forEach((ability, type) => {
      if (ability.unlocked) {
        passiveUnlocks.push(type);
      }
    });
    
    // Build passiveEquipped array from equipped slots
    const passiveEquipped = equippedSlots.filter(slot => slot !== null) as string[];
    
    const abilitiesData = {
      passiveUnlocks,
      passiveEquipped,
      maxUnlockedLevel: maxLevelReached,
    };
    
    const statsPayload = {
      [`highScores.${gameMode}`]: score,
      'stats.gamesPlayed': stats.gamesPlayed,
      'stats.totalScore': stats.totalScore,
      'stats.linesCleared': stats.linesCleared,
      'stats.blocksPlaced': stats.blocksPlaced,
      'stats.bombsExploded': stats.bombsExploded,
      'stats.iceBroken': stats.iceBroken,
      'stats.highestCombo': Math.max(combo, 0),
      'stats.totalPlaytimeSecs': increment(sessionDurationSecs), // Increment instead of replace
      'stats.skillUses': stats.skillUses ?? {},
      lastPlatform: detectPlatform(),
      lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      lastSeenAt: Date.now(),
    };
    
    const syncPromises: Promise<void>[] = [
      syncGameData(user.uid, statsPayload).catch(err => {
        console.error('syncGameData failed:', err);
        addToPendingWrites(user.uid, 'stats', statsPayload).catch(() => {});
      }),
      
      syncScore(
        user.uid,
        gameMode,
        score,
        user.displayName || 'Oyuncu',
        user.photoURL || null,
        sessionDurationSecs,
        abilitiesData
      ).catch(err => {
        console.error('syncScore failed:', err);
        addToPendingWrites(user.uid, 'score', {
          mode: gameMode,
          score,
          sessionDurationSecs,
          abilities: abilitiesData,
        }).catch(() => {});
      }),
    ];
    
    // Günlük meydan okuma
    if (gameMode === GameMode.DAILY_CHALLENGE) {
      const currentStreak = getStreak();
      syncPromises.push(
        syncDailyChallenge(user.uid, today, score, 1, currentStreak)
          .catch(err => console.error('syncDailyChallenge failed:', err))
      );
    }
    
    Promise.allSettled(syncPromises).then(() => {
      // localStorage cache güncelle — sadece bu noktada
      try {
        const cached = JSON.parse(localStorage.getItem('flux_highscores') || '{}');
        if (score > (cached[gameMode] || 0)) {
          cached[gameMode] = score;
          localStorage.setItem('flux_highscores', JSON.stringify(cached));
        }
      } catch {}
    });
  }, [isGameOver, score, gameMode, combo, stats]);
}
