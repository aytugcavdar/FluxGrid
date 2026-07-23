import { GameMode, type GameStats } from '@shared/types';
import {
  mergeAchievementNotificationQueue,
  updateAchievements,
  syncNewAchievement,
} from './achievementSystem';
import { clearGameSave } from './gameSaveSystem';

type StoreGet = () => any;
type StoreSet = (partial: any) => void;
type SaveStats = (stats: GameStats) => void;

export function finalizeGameRun(get: StoreGet, set: StoreSet, saveStats: SaveStats): void {
  if (!get().isGameOver || get().gameOverFinalized) return;

  const { gameMode } = get();

  const currentStats = get().stats;
  const finalScore = get().score;
  const updatedStats: GameStats = {
    ...currentStats,
    gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
  };

  if (gameMode === GameMode.ENDLESS) {
    updatedStats.endlessHighScore = Math.max(currentStats.endlessHighScore || 0, finalScore);
    updatedStats.endlessGamesPlayed = (currentStats.endlessGamesPlayed || 0) + 1;
  } else if (gameMode === GameMode.TIMED) {
    updatedStats.timedHighScore = Math.max(currentStats.timedHighScore || 0, finalScore);
    updatedStats.timedGamesPlayed = (currentStats.timedGamesPlayed || 0) + 1;
  }

  const gameStartTime = get().timerStartTime;
  const gameDuration = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
  if (gameMode === GameMode.TIMED) {
    updatedStats.timedMaxDuration = Math.max(currentStats.timedMaxDuration || 0, gameDuration);
  }
  const finalMaxCombo = get().maxCombo;
  const finalLinesCleared = get().runLinesCleared || 0;
  const movesPlayed = get().totalMovesPlayed || 0;
  const hasClearedLine = finalMaxCombo > 0;
  const isMeaningfulRun = movesPlayed >= 5 || hasClearedLine || gameDuration >= 30;

  let badge: 'new-record' | 'perfect' | 'comeback' | 'speedrun' | undefined;
  const previousHighScore = gameMode === GameMode.ENDLESS
    ? (currentStats.endlessHighScore || 0)
    : (currentStats.timedHighScore || 0);

  if (finalScore > previousHighScore && previousHighScore > 0) badge = 'new-record';
  else if (get().perfectClearDetected) badge = 'perfect';
  else if (gameMode === GameMode.TIMED && gameStartTime && gameDuration < 30) badge = 'speedrun';

  if (badge === 'new-record') {
    updatedStats.recordsBroken = (currentStats.recordsBroken || 0) + 1;
  }

  const previousAchievements = get().achievements;
  const updatedAchievements = updateAchievements(previousAchievements, {
    newScore: finalScore, newCombo: get().maxCombo, previousCombo: get().maxCombo,
    totalBombsExploded: updatedStats.bombsExploded || 0,
    totalIceBroken: updatedStats.iceBroken || 0,
    stats: updatedStats, gameMode, difficultyTier: get().difficultyTier,
    isPerfectClear: false, colorBonus: false, chainCount: 0,
  });
  const currentQueue: string[] = get().achievementNotificationQueue || [];
  const notificationQueue = mergeAchievementNotificationQueue(
    currentQueue,
    previousAchievements,
    updatedAchievements
  );

  set({
    stats: updatedStats,
    achievements: updatedAchievements,
    achievementNotificationQueue: notificationQueue,
    unlockedAchievementId: get().unlockedAchievementId ?? notificationQueue[0] ?? null,
    gameOverFinalized: true,
  });
  saveStats(updatedStats);
  clearGameSave();
  syncNewAchievement(previousAchievements, updatedAchievements);

  const newLog = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    mode: gameMode,
    score: finalScore,
    timestamp: Date.now(),
    duration: gameDuration,
    linesCleared: finalLinesCleared,
    maxCombo: finalMaxCombo,
    badge,
    metadata: {
      tier: gameMode === GameMode.ENDLESS ? get().difficultyTier : undefined,
      statsVersion: 2,
    },
  };

  const updatedLogs = [newLog, ...(get().gameLogs || [])].slice(0, 100);
  set({ gameLogs: updatedLogs });
  try {
    localStorage.setItem('flux_game_logs', JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('[GameStore] Failed to save game logs:', error);
  }

  import('@core/services/ads/AdManager').then(({ AdManager }) => {
    AdManager.recordGameEnd();
  }).catch(console.error);

  Promise.all([
    import('@shared/store/streakStore'),
    import('@utils/native/widgetHelper'),
  ]).then(([{ useStreakStore }, { syncAllWidgetData }]) => {
    if (isMeaningfulRun) {
      useStreakStore.getState().recordGameCompleted();
    }
    const streakState = useStreakStore.getState();
    syncAllWidgetData(get().highScores, streakState.currentStreak, finalScore, streakState.todayPlayed);
  }).catch(console.error);

  import('@utils/native/dynamicShortcutHelper').then(({ saveRecentMode }) => {
    saveRecentMode(gameMode, finalScore);
  }).catch(console.error);

  try {
    localStorage.setItem('flux_achievements', JSON.stringify(get().achievements));
  } catch (error) {
    console.error('[Achievement] Failed to save on game end:', error);
  }
}
