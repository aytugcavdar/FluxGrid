import { Milestone, ProgressionState } from '../../types';
import { MILESTONES, STREAK_MULTIPLIERS, TIER_THRESHOLDS } from '../../constants';

/**
 * Initialize progression state
 * 
 * @returns A new ProgressionState object with initial values
 * 
 * @remarks
 * **Validates: Requirements 6.1, 7.1**
 */
export function createProgressionState(): ProgressionState {
  return {
    currentStreak: 0,
    milestones: MILESTONES.map(m => ({ ...m })),
    lastMilestoneShown: null,
  };
}

/**
 * Update streak based on lines cleared
 * 
 * @param currentStreak - Current streak count
 * @param linesCleared - Number of lines cleared in this move
 * @param comboShieldPrevented - COMBO_SHIELD kullanıldı mı?
 * @returns Updated streak count
 * 
 * @remarks
 * **Validates: Requirements 6.1, 6.5**
 */
export function updateStreak(
  currentStreak: number,
  linesCleared: number,
  comboShieldPrevented: boolean  // COMBO_SHIELD kullanıldı mı?
): number {
  if (linesCleared > 0) {
    return currentStreak + 1;
  } else if (comboShieldPrevented) {
    // COMBO_SHIELD kullanıldı, streak korundu
    return currentStreak;
  } else {
    // Streak kırıldı
    return 0;
  }
}

/**
 * Get streak multiplier
 * 
 * @param streak - Current streak count
 * @returns Multiplier value (1.0, 2.0, 3.0, or 4.0)
 * 
 * @remarks
 * **Validates: Requirements 6.2, 6.3, 6.4**
 */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 4) return STREAK_MULTIPLIERS[4];
  return STREAK_MULTIPLIERS[streak as keyof typeof STREAK_MULTIPLIERS] || 1.0;
}

/**
 * Check and update milestones
 * Returns newly reached milestone or null
 * 
 * @param score - Current score
 * @param currentMilestones - Current milestone list
 * @returns Updated milestones and newly reached milestone
 * 
 * @remarks
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
 */
export function checkMilestones(
  score: number,
  currentMilestones: Milestone[]
): { milestones: Milestone[]; newMilestone: Milestone | null } {
  const updatedMilestones = currentMilestones.map(m => ({ ...m }));
  let newMilestone: Milestone | null = null;
  
  for (const milestone of updatedMilestones) {
    if (!milestone.reached && score >= milestone.threshold) {
      milestone.reached = true;
      newMilestone = milestone;
      break; // Sadece bir milestone aynı anda tetiklenir
    }
  }
  
  return { milestones: updatedMilestones, newMilestone };
}

/**
 * Calculate tier progress percentage
 * 
 * @param score - Current score
 * @param tier - Current tier (0-6)
 * @returns Progress percentage (0-100)
 * 
 * @remarks
 * **Validates: Requirements 5.3**
 */
export function getTierProgress(score: number, tier: number): number {
  if (tier >= 6) return 100; // Max tier
  
  const currentThreshold = TIER_THRESHOLDS[tier];
  const nextThreshold = TIER_THRESHOLDS[tier + 1];
  const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return Math.min(100, Math.max(0, progress));
}
