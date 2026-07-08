// Drag offset caching for performance
let cachedDragOffset: number | null = null;
let lastDragOffsetCacheKey = '';

export const setCanvasRect = (_rect: DOMRect): void => {
  // Kept as a lightweight hook for callers that update board measurements.
};

/**
 * Get screen orientation based on window dimensions
 * @returns 'portrait' if height > width, 'landscape' otherwise
 */
export const getOrientation = (): 'portrait' | 'landscape' => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * Determine if tablet layout should be used
 * @returns true when device is tablet AND landscape orientation
 */
export const shouldUseTabletLayout = (): boolean => {
  return getDeviceType() === 'tablet' && getOrientation() === 'landscape';
};

/**
 * Calculate padding needed to reach minimum touch target size
 * @param visualSize - The visual size of the element
 * @param minSize - Minimum touch target size (default: 52px per Apple HIG)
 * @returns Padding value to add on each side
 */
export const getTouchTargetPadding = (visualSize: number, minSize: number = 52): number => {
  if (visualSize >= minSize) return 0;
  return (minSize - visualSize) / 2;
};

export const getDragYOffset = (): number => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const hasTouch = navigator.maxTouchPoints > 0;
  
  // Desktop - no offset
  if (width >= 768 && !hasTouch) {
    return 0;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const orientation = height >= width ? 'portrait' : 'landscape';
  const isAndroid = /Android/i.test(navigator.userAgent);
  const cacheKey = `${width}x${height}:${hasTouch ? 1 : 0}:${pixelRatio}:${orientation}:${isAndroid ? 1 : 0}`;
  
  // Check cache - if screen profile hasn't changed, return cached value
  if (cachedDragOffset !== null && 
      lastDragOffsetCacheKey === cacheKey &&
      !isNaN(cachedDragOffset) &&
      isFinite(cachedDragOffset)) {
    return cachedDragOffset;
  }

  let offset: number;
  if (orientation === 'landscape') {
    offset = width >= 768 ? 28 : 32;
  } else if (width >= 768) {
    offset = 34;
  } else if (width <= 360 || height < 700) {
    offset = 56;
  } else if (height < 820) {
    offset = 62;
  } else {
    offset = 66;
  }

  if (isAndroid && width < 768) {
    offset += 4;
  }

  // Pointer coordinates are CSS pixels, so keep the offset in CSS px and
  // only use DPR as a tiny correction for very dense screens.
  if (pixelRatio >= 2.75 && width < 768) {
    offset += 2;
  }

  const clampedOffset = Math.max(28, Math.min(72, offset));

  // Update cache. Negative means the dragged piece is rendered above the finger.
  cachedDragOffset = -clampedOffset;
  lastDragOffsetCacheKey = cacheKey;
  
  return cachedDragOffset;
};

/**
 * Get safe area insets from CSS env() variables
 * Returns object with top, bottom, left, right values in pixels
 * Falls back to 0 if not supported
 * 
 * Safe area insets are used to avoid device-specific UI elements like:
 * - iOS notch and Dynamic Island
 * - Android gesture bars
 * - Rounded corners
 * 
 * @returns Object with top, bottom, left, right inset values
 */
export const getSafeAreaInsets = (): { 
  top: number; 
  bottom: number; 
  left: number; 
  right: number;
} => {
  // Try to read CSS env() variables from computed styles
  const style = getComputedStyle(document.documentElement);
  
  // Parse safe area inset values, fallback to 0 if not available
  // Use Math.max to ensure non-negative values
  const bottom = Math.max(0, parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10) || 0);
  const top = Math.max(0, parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10) || 0);
  const left = Math.max(0, parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10) || 0);
  const right = Math.max(0, parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10) || 0);
  
  return { top, bottom, left, right };
};

/**
 * Detect device type based on screen width and touch capability
 * 
 * @returns 'mobile' for phones (< 768px), 'tablet' for touch devices >= 768px, 'desktop' for non-touch >= 768px
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  const hasTouch = navigator.maxTouchPoints > 0;
  
  if (width < 768) return 'mobile';
  if (width >= 768 && hasTouch) return 'tablet';
  return 'desktop';
};
