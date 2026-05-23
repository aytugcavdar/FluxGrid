/**
 * Difficulty scaling configuration for Timed Mode
 * All values are tunable for balance adjustments
 */

export const DIFFICULTY_SCALING = {
  // Time bonus for line clears (REDUCED for harder gameplay)
  // Formula: max(MIN_BONUS, MAX_BONUS - (score / DECAY_DIVISOR) * DECAY_RATE)
  TIME_BONUS: {
    MIN_BONUS: 0.3,        // Minimum seconds per line (at high scores) - REDUCED from 0.5
    MAX_BONUS: 1.5,        // Maximum seconds per line (at score 0) - REDUCED from 2.0
    DECAY_RATE: 0.1,       // Rate of decay per divisor unit
    DECAY_DIVISOR: 5000,   // Score divisor for decay calculation
  },

  // Combo bonus time
  // Formula: max(MIN_BONUS, MAX_BONUS - (score / DECAY_DIVISOR) * DECAY_RATE)
  COMBO_BONUS: {
    MIN_BONUS: 0.1,        // Minimum seconds per combo
    MAX_BONUS: 0.5,        // Maximum seconds per combo (at score 0)
    DECAY_RATE: 0.05,      // Rate of decay per divisor unit
    DECAY_DIVISOR: 10000,  // Score divisor for decay calculation
  },

  // Easy piece spawn rate (dot, h2, v2) - REDUCED for harder gameplay
  // Formula: max(MIN_RATE, MAX_RATE - (score / DECAY_DIVISOR) * DECAY_RATE)
  EASY_PIECE_RATE: {
    MIN_RATE: 0.05,        // Minimum easy piece rate (5%) - REDUCED from 10%
    MAX_RATE: 0.30,        // Maximum easy piece rate (30% at score 0) - REDUCED from 45%
    DECAY_RATE: 0.05,      // Rate of decay per divisor unit
    DECAY_DIVISOR: 20000,  // Score divisor for decay calculation
  },

  // Passive time decay at high scores (MORE AGGRESSIVE)
  PASSIVE_DECAY: {
    ACTIVATION_SCORE: 30000,  // Score threshold to activate decay - REDUCED from 50000
    DECAY_RATE: 0.5,          // Seconds deducted per interval
    DECAY_INTERVAL: 2000,     // Milliseconds between decays (2 seconds) - REDUCED from 3000
  },
} as const;
