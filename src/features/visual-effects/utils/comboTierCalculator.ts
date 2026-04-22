/**
 * Combo Tier Calculator
 * 
 * Maps combo levels to animation tiers with visual properties
 */

import { ComboAnimationTier, AnimationTierLevel } from '../types/animationTypes';

// Tier thresholds
const TIER_THRESHOLDS = {
  LIGHT_MIN: 3,
  MEDIUM_MIN: 5,
  EPIC_MIN: 10,
} as const;

// Tier configurations
const TIER_CONFIGS: Record<AnimationTierLevel, Omit<ComboAnimationTier, 'level'>> = {
  light: {
    scale: 1.0,
    color: '#3b82f6', // Blue
    pulseFrequency: 1, // 1 Hz
    particlesPerSecond: 5,
  },
  medium: {
    scale: 1.2,
    color: '#eab308', // Yellow
    pulseFrequency: 2, // 2 Hz
    particlesPerSecond: 10,
  },
  epic: {
    scale: 1.5,
    color: '#ef4444', // Red
    pulseFrequency: 3, // 3 Hz
    particlesPerSecond: 20,
  },
};

/**
 * Get combo animation tier based on combo level
 * 
 * @param comboLevel - Current combo multiplier (e.g., 3, 5, 10)
 * @returns ComboAnimationTier with scale, color, pulse frequency, and particle rate
 */
export function getComboTier(comboLevel: number): ComboAnimationTier {
  let tierLevel: AnimationTierLevel;

  if (comboLevel >= TIER_THRESHOLDS.EPIC_MIN) {
    tierLevel = 'epic';
  } else if (comboLevel >= TIER_THRESHOLDS.MEDIUM_MIN) {
    tierLevel = 'medium';
  } else {
    tierLevel = 'light';
  }

  return {
    level: tierLevel,
    ...TIER_CONFIGS[tierLevel],
  };
}

/**
 * Get timer color based on time remaining
 * 
 * @param timeRemaining - Seconds remaining on combo timer
 * @returns Color state: 'green', 'yellow', or 'red'
 */
export function getTimerColor(timeRemaining: number): 'green' | 'yellow' | 'red' {
  if (timeRemaining > 4) {
    return 'green';
  } else if (timeRemaining > 2) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Get timer color hex value
 * 
 * @param colorState - Timer color state
 * @returns Hex color string
 */
export function getTimerColorHex(colorState: 'green' | 'yellow' | 'red'): string {
  const colors = {
    green: '#10b981',
    yellow: '#eab308',
    red: '#ef4444',
  };
  return colors[colorState];
}
