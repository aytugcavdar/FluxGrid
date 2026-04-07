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
    totalBombsExploded: number;  // Toplam değer
    totalIceBroken: number;       // Toplam değer
    currentLevelIndex: number;
  }
): Achievement[] {
  const { newScore, newCombo, totalBombsExploded, totalIceBroken, currentLevelIndex } = params;
  
  return achievements.map(ach => {
    if (ach.unlocked) return ach;
    let val = ach.currentValue;
    
    // SCORE category - tek oyundaki en yüksek skor
    if (ach.category === 'SCORE') {
      val = Math.max(val, newScore);
    }
    
    // COMBO category - tek oyundaki en yüksek kombo
    if (ach.category === 'COMBO') {
      val = Math.max(val, newCombo);
    }
    
    // SPECIAL_BLOCKS category - toplam değerleri kullan
    if (ach.category === 'SPECIAL_BLOCKS') {
      if (ach.id === 'bomb_10') val = totalBombsExploded;
      if (ach.id === 'ice_50') val = totalIceBroken;
      // Add other special block tracking as needed
    }
    
    // PROGRESSION category
    if (ach.category === 'PROGRESSION') {
      if (ach.id === 'level_10' || ach.id === 'level_25' || ach.id === 'level_50') {
        val = Math.max(val, currentLevelIndex);
      }
    }
    
    // Legacy achievement IDs (for backward compatibility)
    if (ach.id === 'score_10k' || ach.id === 'score_50k' || ach.id === 'score_100k') {
      val = Math.max(val, newScore);
    }
    if (ach.id === 'combo_5' || ach.id === 'combo_10' || ach.id === 'combo_15') {
      val = Math.max(val, newCombo);
    }
    if (ach.id === 'bomb_expert') {
      val = totalBombsExploded;
    }
    
    return { ...ach, currentValue: val, unlocked: val >= ach.targetValue };
  });
}

/**
 * Sync newly unlocked achievement to localStorage
 */
export function syncNewAchievement(
  previousAchievements: Achievement[],
  updatedAchievements: Achievement[]
): void {
  // Save updated achievements to localStorage
  try {
    localStorage.setItem('flux_achievements', JSON.stringify(updatedAchievements));
    
    // Log newly unlocked achievements
    updatedAchievements.forEach((ach, i) => {
      if (ach.unlocked && !previousAchievements[i]?.unlocked) {
        console.log(`[Achievement] Unlocked: ${ach.name} - ${ach.description}`);
      }
    });
  } catch (error) {
    console.error('[Achievement] Failed to save to localStorage:', error);
  }
}
