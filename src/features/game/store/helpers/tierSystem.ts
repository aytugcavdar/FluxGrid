import { ENDLESS_LOOP_THRESHOLDS, TIER_THRESHOLDS, TIER_SCORE_MULTIPLIERS } from '../../constants';

/**
 * Calculate current tier based on score
 * 
 * Determines the player's current tier level by comparing their score against
 * the tier thresholds [0, 15000, 40000, 80000, 130000, 190000, 260000]. The
 * first tier is a warm-up band before special block pressure starts.
 * 
 * @param score - The player's current score (must be >= 0)
 * @returns Tier value from 0 to 6, where:
 *   - Tier 0: 0-14999 points (Warm-up)
 *   - Tier 1: 15000-39999 points (Ice unlock)
 *   - Tier 2: 40000-79999 points (Bomb unlock)
 *   - Tier 3: 80000-129999 points (Quake)
 *   - Tier 4: 130000-189999 points (Ice storm)
 *   - Tier 5: 190000-259999 points (Strong quake)
 *   - Tier 6: 260000+ points (Fixed Grid)
 * 
 * @example
 * calculateTier(0)     // Returns 0 (Beginner)
 * calculateTier(15000) // Returns 1 (Ice unlock)
 * calculateTier(40000) // Returns 2 (Bomb unlock)
 * calculateTier(-100)  // Returns 0 (negative scores default to tier 0)
 * 
 * @remarks
 * - Negative scores are clamped to tier 0 for safety
 * - Tier calculation is monotonic: higher scores never result in lower tiers
 * - Used for determining event activation and multiplier application
 * 
 * **Validates: Requirements 1.3**
 */
export function calculateTier(score: number): number {
  if (score < 0) return 0;
  return TIER_THRESHOLDS.filter(t => score >= t).length - 1;
}

/**
 * Get tier score multiplier
 * 
 * Returns the score multiplier for a given tier level. Score multipliers
 * increase progressively to reward players for reaching higher tiers:
 * [1.0, 1.2, 1.5, 1.8, 2.2, 2.6, 3.0]
 * 
 * @param tier - The tier level (0-6)
 * @returns Score multiplier for the tier:
 *   - Tier 0: 1.0x (no bonus)
 *   - Tier 1: 1.2x
 *   - Tier 2: 1.5x
 *   - Tier 3: 1.8x
 *   - Tier 4: 2.2x
 *   - Tier 5: 2.6x
 *   - Tier 6: 3.0x
 *   - Invalid tier: 1.0x (safe default)
 * 
 * @example
 * getTierScoreMultiplier(0)  // Returns 1.0
 * getTierScoreMultiplier(3)  // Returns 1.6
 * getTierScoreMultiplier(6)  // Returns 3.0
 * getTierScoreMultiplier(-1) // Returns 1.0 (invalid tier)
 * getTierScoreMultiplier(10) // Returns 1.0 (invalid tier)
 * 
 * @remarks
 * - Invalid tier values (< 0 or >= 7) return 1.0x for graceful degradation
 * - Multipliers stack multiplicatively with event and mini-event multipliers
 * - Only applies in ENDLESS game mode
 * 
 * **Validates: Requirements 1.4**
 */
export function getTierScoreMultiplier(tier: number): number {
  if (tier < 0 || tier >= TIER_SCORE_MULTIPLIERS.length) return 1.0;
  return TIER_SCORE_MULTIPLIERS[tier] ?? 1.0;
}

export function calculateEndlessLoop(score: number): number {
  if (score < 0) return 0;
  return ENDLESS_LOOP_THRESHOLDS.filter(threshold => score >= threshold).length;
}

/**
 * Migrate old save data to new tier system
 * 
 * Recalculates the player's tier based on their current score and the new
 * tier thresholds. This ensures backward compatibility when loading save
 * files created before the tier system rebalance.
 * 
 * @param oldTier - The tier value from the old save data (unused, kept for API compatibility)
 * @param score - The player's current score from the save data
 * @returns The recalculated tier (0-6) based on new thresholds
 * 
 * @example
 * // Old system: tier 2 at 2000 points
 * // New system: 2000 points = tier 0
 * migrateTierData(2, 2000)  // Returns 0
 * 
 * // Player at 50000 points
 * migrateTierData(5, 50000) // Returns 2
 * 
 * @remarks
 * - The oldTier parameter is ignored; migration is purely score-based
 * - Player's score is preserved during migration (never modified)
 * - If score is negative, defaults to tier 0
 * - Migration is idempotent: running it multiple times produces same result
 * - Used during save data loading when saveVersion < 2
 * 
 * **Edge Cases:**
 * - Negative scores: Returns tier 0
 * - Score at exact threshold: Returns the higher tier (e.g., 1500 → tier 1)
 * - Very high scores: Returns tier 6 (no upper limit)
 * 
 * **Validates: Requirements 1.6, 8.1, 8.2, 8.4**
 */
export function migrateTierData(oldTier: number, score: number): number {
  return calculateTier(score);
}
