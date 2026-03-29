import type { Achievement } from '../../types';

/**
 * Update achievements based on game progress
 * Handles SCORE, COMBO, SPECIAL_BLOCKS, and PROGRESSION categories
 */
export function updateAchievements(
  achievements: Achievement[],
  params: {
    newScore: number;
    newCombo: number;
    bombsExploded: number;
    iceBroken: number;
    currentLevelIndex: number;
  }
): Achievement[] {
  const { newScore, newCombo, bombsExploded, iceBroken, currentLevelIndex } = params;
  
  return achievements.map(ach => {
    if (ach.unlocked) return ach;
    let val = ach.currentValue;
    
    // SCORE category
    if (ach.category === 'SCORE') {
      val = Math.max(val, newScore);
    }
    
    // COMBO category
    if (ach.category === 'COMBO') {
      val = Math.max(val, newCombo);
    }
    
    // SPECIAL_BLOCKS category
    if (ach.category === 'SPECIAL_BLOCKS') {
      if (ach.id === 'bomb_10') val += bombsExploded;
      if (ach.id === 'ice_50') val += iceBroken;
      // Add other special block tracking as needed
    }
    
    // PROGRESSION category
    if (ach.category === 'PROGRESSION') {
      if (ach.id === 'level_10' || ach.id === 'level_25' || ach.id === 'level_50') {
        val = Math.max(val, currentLevelIndex);
      }
    }
    
    // Legacy achievement IDs (for backward compatibility)
    if (ach.id === 'score_10k') val = Math.max(val, newScore);
    if (ach.id === 'combo_5') val = Math.max(val, newCombo);
    if (ach.id === 'bomb_expert') val += bombsExploded;
    
    return { ...ach, currentValue: val, unlocked: val >= ach.targetValue };
  });
}

/**
 * Sync newly unlocked achievement (no-op in local-first mode)
 */
export function syncNewAchievement(
  previousAchievements: Achievement[],
  updatedAchievements: Achievement[]
): void {
  // No-op: Firebase sync removed in local-first refactor
  // Achievements are now stored locally only
}
