/**
 * Difficulty scaling formulas for Timed Mode
 * All formulas are continuous and score-based
 */

import { DIFFICULTY_SCALING } from '../../constants/difficultyScaling';

/**
 * Integer time rewards for TIMED mode.
 * Keeps the reward readable on mobile: +1s, +2s, +3s, +5s.
 */
export function getTimedClearBonusSeconds(
  linesCleared: number,
  isPerfectClear = false,
  comboRushActive = false
): number {
  if (!Number.isFinite(linesCleared) || linesCleared <= 0) {
    return 0;
  }

  const rewards = DIFFICULTY_SCALING.TIMED_CLEAR_BONUS;
  let bonus = 0;
  if (linesCleared === 1) bonus = rewards.SINGLE_LINE;
  else if (linesCleared === 2) bonus = rewards.DOUBLE_LINE;
  else if (linesCleared === 3) bonus = rewards.TRIPLE_LINE;
  else bonus = rewards.MULTI_LINE;

  if (isPerfectClear) bonus += rewards.PERFECT_CLEAR;
  if (comboRushActive) bonus += rewards.COMBO_RUSH;

  return bonus;
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
