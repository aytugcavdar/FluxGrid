/**
 * Animation Utilities for FluxGrid
 * Shared animation constants, easing functions, and utilities
 */

// ─── Animation Timing Constants ───

export const ANIMATION_DURATIONS = {
  // CHRONO Popup
  CHRONO_POPUP: 1400, // ms
  
  // Line Clear
  LINE_CLEAR_FLASH: 150, // ms
  LINE_CLEAR_COLLAPSE: 250, // ms
  LINE_CLEAR_TOTAL: 400, // ms
  
  // Game Over
  GAME_OVER_SHAKE: 300, // ms
  GAME_OVER_COLLAPSE: 800, // ms
  GAME_OVER_FADE: 300, // ms
  GAME_OVER_TOTAL: 1400, // ms
  
  // Event Start
  EVENT_BANNER: 500, // ms
  EVENT_FLASH: 300, // ms
  EVENT_TOTAL: 800, // ms
  
  // Tier Transition
  TIER_FLASH: 400, // ms
  
  // COMBO RUSH
  COMBO_RUSH_START: 800, // ms (reduced from 1500)
  COMBO_RUSH_END: 200, // ms (reduced from 300)
  COMBO_RUSH_FLASH: 500, // ms
} as const;

// ─── Easing Functions ───

/**
 * Ease-out quadratic easing
 * @param t Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

/**
 * Ease-in quadratic easing
 * @param t Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInQuad(t: number): number {
  return t * t;
}

/**
 * Ease-in-out quadratic easing
 * @param t Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Back-out easing (overshoots then settles)
 * @param t Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeBackOut(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Interpolation Functions ───

/**
 * Linear interpolation between two values
 * @param start Starting value
 * @param end Ending value
 * @param t Progress value between 0 and 1
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Color Utilities ───

/**
 * Convert hex color to RGB object
 * @param hex Hex color string (e.g., "#ff0000")
 * @returns RGB object with r, g, b values (0-1)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

/**
 * Interpolate between two colors
 * @param color1 Starting color (hex string)
 * @param color2 Ending color (hex string)
 * @param t Progress value between 0 and 1
 * @returns Interpolated color as hex string
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(lerp(c1.r, c2.r, t) * 255);
  const g = Math.round(lerp(c1.g, c2.g, t) * 255);
  const b = Math.round(lerp(c1.b, c2.b, t) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Animation State Management ───

/**
 * Animation cleanup utility
 * Clears timeouts and intervals to prevent memory leaks
 */
export class AnimationCleanup {
  private timeouts: Set<number> = new Set();
  private intervals: Set<number> = new Set();
  private rafIds: Set<number> = new Set();

  /**
   * Register a timeout for cleanup
   */
  setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      callback();
      this.timeouts.delete(id);
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  /**
   * Register an interval for cleanup
   */
  setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  /**
   * Register a requestAnimationFrame for cleanup
   */
  requestAnimationFrame(callback: () => void): number {
    const id = window.requestAnimationFrame(() => {
      callback();
      this.rafIds.delete(id);
    });
    this.rafIds.add(id);
    return id;
  }

  /**
   * Clear all registered timers and animation frames
   */
  cleanup(): void {
    this.timeouts.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.rafIds.forEach(id => window.cancelAnimationFrame(id));
    
    this.timeouts.clear();
    this.intervals.clear();
    this.rafIds.clear();
  }
}

// ─── Performance Utilities ───

/**
 * Check if device is low-end based on performance metrics
 */
export function isLowEndDevice(): boolean {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  // Check device memory (if available)
  if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
    return true;
  }
  
  return false;
}

/**
 * Throttle function calls to improve performance
 * @param func Function to throttle
 * @param delay Minimum delay between calls in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
