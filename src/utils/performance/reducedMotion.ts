/**
 * Reduced Motion Utilities
 * 
 * Requirements: 15.1-15.7
 * 
 * Features:
 * - System-level reduced motion detection
 * - Media query change listener
 * - Configuration helper for reduced animations
 * - localStorage persistence
 */

export interface ReducedMotionConfig {
  durationMultiplier: number;    // 0.4 (60% reduction)
  scaleMagnitude: number;         // 1.05 (reduced from 1.15)
  particlesEnabled: boolean;      // false
  flashEnabled: boolean;          // false
  simpleFadeEnabled: boolean;     // true
}

/**
 * Get reduced motion configuration
 * Requirements: 15.2, 15.3, 15.4, 15.5
 */
export function getReducedMotionConfig(): ReducedMotionConfig {
  return {
    durationMultiplier: 0.4,      // 60% reduction
    scaleMagnitude: 1.05,          // Reduced magnitude
    particlesEnabled: false,       // Disable particles
    flashEnabled: false,           // Disable flashes
    simpleFadeEnabled: true        // Use simple fade
  };
}

/**
 * Detect system-level reduced motion preference
 * Requirements: 15.1
 */
export function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Listen for reduced motion changes
 * Requirements: 15.1
 */
export function onReducedMotionChange(callback: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Get reduced motion preference from localStorage or system
 * Requirements: 15.6, 15.7
 */
export function getReducedMotionPreference(): boolean {
  // Check localStorage first (user override)
  try {
    const stored = localStorage.getItem('flux_reduced_motion');
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
    // Ignore localStorage errors
  }
  
  // Fall back to system preference
  return detectReducedMotion();
}

/**
 * Set reduced motion preference in localStorage
 * Requirements: 15.6, 15.7
 */
export function setReducedMotionPreference(enabled: boolean): void {
  try {
    localStorage.setItem('flux_reduced_motion', String(enabled));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * React hook for reduced motion
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(
    getReducedMotionPreference()
  );
  
  React.useEffect(() => {
    const cleanup = onReducedMotionChange(setPrefersReducedMotion);
    return cleanup;
  }, []);
  
  return prefersReducedMotion;
}

// For non-React usage
import React from 'react';
