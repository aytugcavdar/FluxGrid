import type { Achievement } from '../../types';
import { GameMode, type GameStats } from '@shared/types';

/**
 * Update achievements from the live game systems only.
 */
export function updateAchievements(
  achievements: Achievement[],
  params: {
    newScore: number;
    newCombo: number;
    previousCombo: number;
    totalBombsExploded: number;
    totalIceBroken: number;
    stats: GameStats;
    gameMode: GameMode;
    difficultyTier: number;
    isPerfectClear: boolean;
    colorBonus: boolean;
    chainCount: number;
  }
): Achievement[] {
  const {
    newScore,
    newCombo,
    previousCombo,
    totalBombsExploded,
    totalIceBroken,
    stats,
    gameMode,
    difficultyTier,
    isPerfectClear,
    colorBonus,
    chainCount,
  } = params;

  return achievements.map(ach => {
    let val = ach.currentValue;

    if (ach.category === 'SCORE') {
      val = Math.max(val, newScore);
    }

    if (ach.category === 'COMBO') {
      val = ach.id === 'combo_streak'
        ? (previousCombo < 5 && newCombo >= 5 ? val + 1 : val)
        : Math.max(val, newCombo);
    }

    if (ach.category === 'SPECIAL_BLOCKS') {
      if (ach.id.startsWith('bomb_')) val = totalBombsExploded;
      if (ach.id.startsWith('ice_')) val = totalIceBroken;
    }

    if (ach.category === 'PROGRESSION') {
      if (ach.id.startsWith('games_')) val = stats.gamesPlayed || 0;
      if (ach.id.startsWith('blocks_')) val = stats.blocksPlaced || 0;
      if (ach.id.startsWith('lines_')) val = stats.linesCleared || 0;
    }

    if (ach.category === 'SPEED') {
      if (ach.id.startsWith('timed_score_') && gameMode === GameMode.TIMED) val = Math.max(val, newScore);
      if (ach.id.startsWith('timed_combo_') && gameMode === GameMode.TIMED) val = Math.max(val, newCombo);
      if (ach.id === 'timed_lines_25') val = stats.timedTotalLines || 0;
      if (ach.id === 'sprint_boost_1k' || ach.id === 'sprint_master') {
        val = stats.timedSprintBonusTotal || 0;
      }
    }

    if (ach.category === 'MASTERY') {
      if (ach.id.startsWith('tier_') || ach.id === 'tier_master') {
        val = stats.endlessMaxTier || difficultyTier || 0;
      }
      if (ach.id.startsWith('event_') || ach.id === 'event_master') {
        val = stats.endlessEventCount || 0;
      }
      if (ach.id.startsWith('perfect_clear')) {
        val = stats.perfectClears || (isPerfectClear ? Math.max(val, 1) : val);
      }
      if (ach.id === 'color_bonus_10') {
        val = colorBonus ? val + 1 : val;
      }
      if (ach.id === 'record_breaker') {
        val = stats.recordsBroken || 0;
      }
    }

    if (ach.id === 'bomb_expert') {
      val = totalBombsExploded;
    }

    return { ...ach, currentValue: val, unlocked: ach.unlocked || val >= ach.targetValue };
  });
}

/**
 * Sync achievement progress to localStorage.
 */
export function syncNewAchievement(
  previousAchievements: Achievement[],
  updatedAchievements: Achievement[]
): void {
  try {
    localStorage.setItem('flux_achievements', JSON.stringify(updatedAchievements));

    updatedAchievements.forEach((ach, i) => {
      if (ach.unlocked && !previousAchievements[i]?.unlocked) {
        console.log(`[Achievement] Unlocked: ${ach.name}`);
      }
    });
  } catch (error) {
    console.error('[Achievement] Failed to save to localStorage:', error);
  }
}
