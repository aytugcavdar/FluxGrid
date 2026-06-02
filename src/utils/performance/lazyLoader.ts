/**
 * Lazy Loading Utilities
 * Optimizes app startup time by deferring non-critical imports
 */

/**
 * Lazy load heavy libraries after initial render
 */
export const lazyLoadHeavyLibraries = () => {
  // Defer loading of heavy libraries
  setTimeout(() => {
    // Preload Framer Motion (used in animations)
    import('framer-motion').catch(err => {
      console.error('[LazyLoader] Failed to preload framer-motion:', err);
    });
    
    // Preload i18next (used in translations)
    import('react-i18next').catch(err => {
      console.error('[LazyLoader] Failed to preload react-i18next:', err);
    });
  }, 100);
};

/**
 * Preload critical game assets
 */
export const preloadCriticalAssets = () => {
  // Preload critical images
  const criticalImages = [
    '/icon-192.svg',
    '/icon-512.svg',
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

/**
 * Lazy load non-critical services
 */
export const lazyLoadServices = () => {
  setTimeout(() => {
    // Preload analytics
    import('../../services/monitoring/performanceMonitoring').catch(err => {
      console.error('[LazyLoader] Failed to preload performance monitoring:', err);
    });
    
    // Preload the shared haptic manager used by gameplay and settings.
    import('../../utils/audio/haptics').catch(err => {
      console.error('[LazyLoader] Failed to preload haptics:', err);
    });
  }, 500);
};

/**
 * Initialize lazy loading
 */
export const initializeLazyLoading = () => {
  // Wait for initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      lazyLoadHeavyLibraries();
      preloadCriticalAssets();
      lazyLoadServices();
    });
  } else {
    lazyLoadHeavyLibraries();
    preloadCriticalAssets();
    lazyLoadServices();
  }
};
