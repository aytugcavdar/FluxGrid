/**
 * Memory Optimization Utilities
 * Helps reduce memory usage and prevent memory leaks
 */

/**
 * Monitor memory usage (if available)
 */
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const usedMemoryMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMemoryMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMemoryMB = Math.round(memory.jsHeapSizeLimit / 1048576);
    
    console.log('[MemoryOptimizer] Memory usage:', {
      used: `${usedMemoryMB} MB`,
      total: `${totalMemoryMB} MB`,
      limit: `${limitMemoryMB} MB`,
      percentage: `${Math.round((usedMemoryMB / limitMemoryMB) * 100)}%`,
    });
    
    // Warn if memory usage is high
    if (usedMemoryMB / limitMemoryMB > 0.8) {
      console.warn('[MemoryOptimizer] High memory usage detected!');
    }
    
    return {
      used: usedMemoryMB,
      total: totalMemoryMB,
      limit: limitMemoryMB,
    };
  }
  
  return null;
};

/**
 * Request garbage collection (if available)
 */
export const requestGarbageCollection = () => {
  if ('gc' in window && typeof (window as any).gc === 'function') {
    console.log('[MemoryOptimizer] Requesting garbage collection...');
    (window as any).gc();
  }
};

/**
 * Clean up event listeners
 */
export const cleanupEventListeners = () => {
  // Remove all custom event listeners
  const events = [
    'tutorial-return-home',
    'fluxgrid-show-consent',
    'fluxgrid-consent-response',
    'pipModeChanged',
  ];
  
  events.forEach(event => {
    const listeners = (window as any)._eventListeners?.[event];
    if (listeners) {
      listeners.forEach((listener: EventListener) => {
        window.removeEventListener(event, listener);
      });
    }
  });
};

/**
 * Initialize memory optimization
 */
export const initializeMemoryOptimization = () => {
  // Monitor memory usage periodically (every 5 minutes)
  setInterval(() => {
    monitorMemoryUsage();
  }, 5 * 60 * 1000);
  
  // Log initial memory usage
  setTimeout(() => {
    monitorMemoryUsage();
  }, 5000);
};

/**
 * Optimize images by converting to WebP (if supported)
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get optimized image URL (WebP if supported)
 */
export const getOptimizedImageUrl = async (url: string): Promise<string> => {
  const webpSupported = await supportsWebP();
  
  if (webpSupported && !url.endsWith('.webp')) {
    // Try to get WebP version
    const webpUrl = url.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    // Check if WebP version exists
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(webpUrl);
      img.onerror = () => resolve(url);
      img.src = webpUrl;
    });
  }
  
  return url;
};
