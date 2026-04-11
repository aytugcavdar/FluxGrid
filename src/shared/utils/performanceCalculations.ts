/**
 * Performance calculation utilities for analytics and metrics
 */

/**
 * Calculates the spectral index - a composite performance score (0-100)
 * 
 * @param highScore - User's highest score
 * @param winRate - Win rate percentage (0-100)
 * @param consistency - Consistency score (0-100)
 * @param totalGames - Total number of games played
 * @returns Spectral index (0-100) with 1 decimal place
 * 
 * Preconditions:
 * - highScore >= 0
 * - winRate: 0-100
 * - consistency: 0-100
 * - totalGames >= 0
 * 
 * Postconditions:
 * - Return value: 0-100 with 1 decimal place
 */
export function calculateSpectralIndex(
  highScore: number,
  winRate: number,
  consistency: number,
  totalGames: number
): number {
  // Validate inputs
  if (highScore < 0 || winRate < 0 || winRate > 100 || consistency < 0 || consistency > 100 || totalGames < 0) {
    console.warn('Invalid input to calculateSpectralIndex', { highScore, winRate, consistency, totalGames });
    return 0;
  }

  // Normalize high score (0-100 scale, max reference: 100000)
  const normalizedScore = Math.min(100, (highScore / 100000) * 100);

  // Weight factors
  const SCORE_WEIGHT = 0.4;
  const WIN_RATE_WEIGHT = 0.3;
  const CONSISTENCY_WEIGHT = 0.3;

  // Calculate weighted index
  let spectralIndex =
    normalizedScore * SCORE_WEIGHT +
    winRate * WIN_RATE_WEIGHT +
    consistency * CONSISTENCY_WEIGHT;

  // Apply experience bonus (max +10 for 100+ games)
  const experienceBonus = Math.min(10, totalGames / 10);
  spectralIndex += experienceBonus;

  // Clamp to 0-100
  spectralIndex = Math.max(0, Math.min(100, spectralIndex));

  // Round to 1 decimal
  return Math.round(spectralIndex * 10) / 10;
}

/**
 * Calculates consistency score based on score variance
 * 
 * @param scores - Array of scores
 * @returns Consistency score (0-100)
 * 
 * Preconditions:
 * - scores: array of numbers >= 0
 * - scores.length >= 2 (minimum 2 games for consistency)
 * 
 * Postconditions:
 * - Return value: 0-100
 */
export function calculateConsistency(scores: number[]): number {
  // Validate input
  if (!Array.isArray(scores) || scores.length < 2) {
    return 0; // Not enough data
  }

  // Filter out invalid scores
  const validScores = scores.filter(s => typeof s === 'number' && s >= 0 && !isNaN(s) && isFinite(s));
  
  if (validScores.length < 2) {
    return 0;
  }

  // Calculate mean
  const mean = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;

  // Calculate standard deviation
  const variance = validScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / validScores.length;
  const stdDev = Math.sqrt(variance);

  // Calculate coefficient of variation (CV)
  const cv = mean > 0 ? stdDev / mean : 0;

  // Convert to consistency score (0-100)
  // Lower CV = higher consistency
  // CV of 0 = 100 consistency, CV of 1+ = 0 consistency
  const consistency = Math.max(0, Math.min(100, (1 - cv) * 100));

  return Math.round(consistency);
}
