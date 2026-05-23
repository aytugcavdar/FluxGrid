/**
 * Difficulty scaling formulas for Timed Mode
 * All formulas are continuous and score-based
 */

import { DIFFICULTY_SCALING } from '../../constants/difficultyScaling';

/**
 * Calculate time bonus for line clears based on current score
 * Formula: max(0.5, 2.0 - (score / 5000) * 0.1)
 * 
 * @param score - Current game score
 * @param linesCleared - Number of lines cleared (for future multi-line bonuses)
 * @returns Bonus seconds per line cleared
 */
export function calculateTimeBonus(score: number, linesCleared: number): number {
  // Validate input
  if (!Number.isFinite(score) || score < 0) {
    score = 0; // Default to score 0 (maximum bonus)
  }
  
  const { MIN_BONUS, MAX_BONUS, DECAY_RATE, DECAY_DIVISOR } = DIFFICULTY_SCALING.TIME_BONUS;
  return Math.max(MIN_BONUS, MAX_BONUS - (score / DECAY_DIVISOR) * DECAY_RATE);
}

/**
 * Calculate combo bonus time based on current score
 * Formula: max(0.1, 0.5 - (score / 10000) * 0.05)
 * 
 * @param score - Current game score
 * @returns Bonus seconds per combo
 */
export function calculateComboBonus(score: number): number {
  // Validate input
  if (!Number.isFinite(score) || score < 0) {
    score = 0; // Default to score 0 (maximum bonus)
  }
  
  const { MIN_BONUS, MAX_BONUS, DECAY_RATE, DECAY_DIVISOR } = DIFFICULTY_SCALING.COMBO_BONUS;
  return Math.max(MIN_BONUS, MAX_BONUS - (score / DECAY_DIVISOR) * DECAY_RATE);
}

/**
 * Calculate easy piece spawn rate based on current score
 * Formula: max(0.1, 0.45 - (score / 20000) * 0.05)
 * Easy pieces: dot, h2, v2
 * 
 * @param score - Current game score
 * @returns Easy piece spawn probability (0.0 to 1.0)
 */
export function calculateEasyPieceRate(score: number): number {
  // Validate input
  if (!Number.isFinite(score) || score < 0) {
    score = 0; // Default to score 0 (maximum rate)
  }
  
  const { MIN_RATE, MAX_RATE, DECAY_RATE, DECAY_DIVISOR } = DIFFICULTY_SCALING.EASY_PIECE_RATE;
  return Math.max(MIN_RATE, MAX_RATE - (score / DECAY_DIVISOR) * DECAY_RATE);
}

/**
 * Check if passive time decay should be active
 * Activates at 50,000 score
 * 
 * @param score - Current game score
 * @returns True if decay should be active
 */
export function shouldApplyPassiveDecay(score: number): boolean {
  return score >= DIFFICULTY_SCALING.PASSIVE_DECAY.ACTIVATION_SCORE;
}

/**
 * Get passive decay rate (seconds per interval)
 * 
 * @returns Decay rate in seconds
 */
export function getPassiveDecayRate(): number {
  return DIFFICULTY_SCALING.PASSIVE_DECAY.DECAY_RATE;
}

/**
 * Get passive decay interval (milliseconds between decays)
 * 
 * @returns Interval in milliseconds
 */
export function getPassiveDecayInterval(): number {
  return DIFFICULTY_SCALING.PASSIVE_DECAY.DECAY_INTERVAL;
}
