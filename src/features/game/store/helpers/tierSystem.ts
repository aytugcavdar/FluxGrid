import { TIER_THRESHOLDS, TIER_SCORE_MULTIPLIERS } from '../../constants';

/**
 * Calculate current tier based on score
 * 
 * Determines the player's current tier level by comparing their score against
 * the tier thresholds [0, 5000, 15000, 30000, 55000, 90000, 140000]. The tier
 * system uses logarithmic progression to ensure balanced difficulty scaling.
 * 
 * @param score - The player's current score (must be >= 0)
 * @returns Tier value from 0 to 6, where:
 *   - Tier 0: 0-4.999 points (Başlangıç)
 *   - Tier 1: 5.000-14.999 points (Gelişmiş)
 *   - Tier 2: 15.000-29.999 points (Uzman)
 *   - Tier 3: 30.000-54.999 points (Usta)
 *   - Tier 4: 55.000-89.999 points (Efsane)
 *   - Tier 5: 90.000-139.999 points (Kaos)
 *   - Tier 6: 140.000+ points (VOID+)
 * 
 * @example
 * calculateTier(0)       // Returns 0 (Başlangıç)
 * calculateTier(5000)    // Returns 1 (Gelişmiş)
 * calculateTier(15000)   // Returns 2 (Uzman)
 * calculateTier(140000)  // Returns 6 (VOID+)
 * calculateTier(-100)    // Returns 0 (negative scores default to tier 0)
 * 
 * @remarks
 * - Negative scores are clamped to tier 0 for safety
 * - Tier calculation is monotonic: higher scores never result in lower tiers
 * - Used for determining event activation and multiplier application
 * - Thresholds are defined in constants/index.ts (TIER_THRESHOLDS)
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
 * getTierScoreMultiplier(3)  // Returns 1.8
 * getTierScoreMultiplier(6)  // Returns 3.0
 * getTierScoreMultiplier(-1) // Returns 1.0 (invalid tier)
 * getTierScoreMultiplier(10) // Returns 1.0 (invalid tier)
 * 
 * @remarks
 * - Invalid tier values (< 0 or >= 7) return 1.0x for graceful degradation
 * - Multipliers stack multiplicatively with event and mini-event multipliers
 * - Only applies in ENDLESS game mode
 * - Multiplier values defined in constants/index.ts (TIER_SCORE_MULTIPLIERS)
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
 * // Player at 2000 points → tier 0 (below 5000 threshold)
 * migrateTierData(2, 2000)  // Returns 0
 * 
 * // Player at 50000 points → tier 3 (30000-54999)
 * migrateTierData(5, 50000) // Returns 3
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
 * - Score at exact threshold: Returns the higher tier (e.g., 5000 → tier 1)
 * - Very high scores: Returns tier 6 (no upper limit)
 * 
 * **Validates: Requirements 1.6, 8.1, 8.2, 8.4**
 */
export function migrateTierData(oldTier: number, score: number): number {
  return calculateTier(score);
}
