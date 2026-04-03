/**
 * Animation Helpers
 * Easing functions and animation utilities
 */

/**
 * Apply spring curve to animation progress
 * @param progress - Animation progress (0-1)
 * @param curve - Spring curve [start, peak, end]
 * @returns Interpolated scale value
 */
export function applySpringCurve(progress: number, curve: [number, number, number]): number {
  const [start, peak, end] = curve;
  
  if (progress < 0.5) {
    // First half: interpolate from start to peak
    const t = progress * 2; // 0 to 1
    return start + (peak - start) * t;
  } else {
    // Second half: interpolate from peak to end
    const t = (progress - 0.5) * 2; // 0 to 1
    return peak + (end - peak) * t;
  }
}

/**
 * Calculate stagger delay for cell animations
 * @param cellIndex - Index of the cell
 * @param staggerDelay - Delay between cells in milliseconds
 * @returns Start time offset in milliseconds
 */
export function calculateStaggerDelay(cellIndex: number, staggerDelay: number): number {
  return cellIndex * staggerDelay;
}

/**
 * Ease out quad easing function
 * @param t - Progress (0-1)
 * @returns Eased value
 */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/**
 * Ease in quad easing function
 * @param t - Progress (0-1)
 * @returns Eased value
 */
export function easeInQuad(t: number): number {
  return t * t;
}

/**
 * Ease in-out quad easing function
 * @param t - Progress (0-1)
 * @returns Eased value
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
