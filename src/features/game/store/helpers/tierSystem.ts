import { TIER_THRESHOLDS, TIER_SCORE_MULTIPLIERS } from '../../constants';

/**
 * Calculate current tier based on score
 * 
 * Determines the player's current tier level by comparing their score against
 * the tier thresholds [0, 1500, 4000, 9000, 18000, 35000, 60000]. The tier
 * system uses logarithmic progression to ensure balanced difficulty scaling.
 * 
 * @param score - The player's current score (must be >= 0)
 * @returns Tier value from 0 to 6, where:
 *   - Tier 0: 0-1499 points (Beginner)
 *   - Tier 1: 1500-3999 points (Advanced)
 *   - Tier 2: 4000-8999 points (Expert)
 *   - Tier 3: 9000-17999 points (Master)
 *   - Tier 4: 18000-34999 points (Legend)
 *   - Tier 5: 35000-59999 points (Chaos)
 *   - Tier 6: 60000+ points (Void)
 * 
 * @example
 * calculateTier(0)     // Returns 0 (Beginner)
 * calculateTier(1500)  // Returns 1 (Advanced)
 * calculateTier(5000)  // Returns 2 (Expert)
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
 * [1.0, 1.15, 1.35, 1.6, 2.0, 2.5, 3.0]
 * 
 * @param tier - The tier level (0-6)
 * @returns Score multiplier for the tier:
 *   - Tier 0: 1.0x (no bonus)
 *   - Tier 1: 1.15x
 *   - Tier 2: 1.35x
 *   - Tier 3: 1.6x
 *   - Tier 4: 2.0x
 *   - Tier 5: 2.5x
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
 * // New system: 2000 points = tier 1 (threshold 1500-3999)
 * migrateTierData(2, 2000)  // Returns 1
 * 
 * // Player at 50000 points
 * migrateTierData(5, 50000) // Returns 5 (tier 5: 35000-59999)
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
