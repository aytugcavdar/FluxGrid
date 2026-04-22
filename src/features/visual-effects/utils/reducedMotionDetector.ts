/**
 * Reduced Motion Detection Utility
 * 
 * Detects user's reduced motion preference from browser settings
 */

export function detectReducedMotion(): boolean {
  // Safe default: if detection fails, assume reduced motion for accessibility
  try {
    if (typeof window === 'undefined') {
      return true; // Server-side: default to reduced motion
    }

    if (!window.matchMedia) {
      return true; // No matchMedia support: default to reduced motion
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  } catch (error) {
    console.warn('[ReducedMotion] Detection failed, defaulting to reduced motion:', error);
    return true; // Error: default to reduced motion for safety
  }
}

export function onReducedMotionChange(callback: (prefersReducedMotion: boolean) => void): () => void {
  try {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {}; // No-op cleanup
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handler = (event: MediaQueryListEvent) => {
      callback(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // Legacy browsers
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }

    return () => {}; // No-op cleanup
  } catch (error) {
    console.warn('[ReducedMotion] Change listener setup failed:', error);
    return () => {}; // No-op cleanup
  }
}
