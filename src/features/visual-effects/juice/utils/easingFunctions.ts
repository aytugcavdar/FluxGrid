/**
 * Easing Functions for Juice Effects
 * 
 * Reusable easing functions for smooth animations.
 * All functions take input t in range [0, 1] and return output in range [0, 1].
 */

/**
 * Easing function type
 */
export type EasingFunction = (t: number) => number;

/**
 * Linear easing (no easing)
 * @param t Progress (0-1)
 * @returns Linear value
 */
export function linear(t: number): number {
  return t;
}

/**
 * Ease-out-sine easing
 * Used for: Ripple effect
 * Requirements: 5.5
 * 
 * @param t Progress (0-1)
 * @returns Eased value
 */
export function easeOutSine(t: number): number {
  return Math.sin(t * Math.PI / 2);
}

/**
 * Ease-in-back easing with overshoot
 * Used for: Implode animation
 * Requirements: 6.3
 * 
 * @param t Progress (0-1)
 * @param overshoot Overshoot factor (default 1.70158)
 * @returns Eased value
 */
export function easeInBack(t: number, overshoot: number = 1.70158): number {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

/**
 * Ease-in-out-sine easing
 * Used for: Grid pulse
 * Requirements: 7.3
 * 
 * @param t Progress (0-1)
 * @returns Eased value
 */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Ease-out-quad easing
 * Used for: General animations
 * 
 * @param t Progress (0-1)
 * @returns Eased value
 */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/**
 * Ease-in-quad easing
 * Used for: General animations
 * 
 * @param t Progress (0-1)
 * @returns Eased value
 */
export function easeInQuad(t: number): number {
  return t * t;
}

/**
 * Get easing function by name
 * @param name Easing function name
 * @returns Easing function
 */
export function getEasingFunction(name: string): EasingFunction {
  switch (name) {
    case 'linear':
      return linear;
    case 'easeOutSine':
      return easeOutSine;
    case 'easeInBack':
      return easeInBack;
    case 'easeInOutSine':
      return easeInOutSine;
    case 'easeOutQuad':
      return easeOutQuad;
    case 'easeInQuad':
      return easeInQuad;
    default:
      console.warn(`[EasingFunctions] Unknown easing function: ${name}, using linear`);
      return linear;
  }
}
