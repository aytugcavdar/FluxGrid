/**
 * Difficulty scaling configuration for Timed Mode
 * All values are tunable for balance adjustments
 */

export const DIFFICULTY_SCALING = {
  // TIMED mode uses whole-second rewards for clear mobile feedback.
  TIMED_CLEAR_BONUS: {
    SINGLE_LINE: 1,
    DOUBLE_LINE: 2,
    TRIPLE_LINE: 3,
    MULTI_LINE: 4,
    PERFECT_CLEAR: 2,
    COMBO_RUSH: 0,
    MAX_TIME_SECONDS: 60,
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
