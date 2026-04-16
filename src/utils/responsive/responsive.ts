import { createTransformConfigSync, calculateDragOffset } from '../device/touchTransform';

// Canvas rect caching for performance
let cachedCanvasRect: DOMRect | null = null;
let cacheTime = 0;
const CACHE_VALIDITY_MS = 500;

// Drag offset caching for performance
let cachedDragOffset: number | null = null;
let lastScreenHeight: number = 0;

export const setCanvasRect = (rect: DOMRect): void => {
  cachedCanvasRect = rect;
  cacheTime = Date.now();
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
  
  // Desktop - no offset
  if (width >= 768 && navigator.maxTouchPoints === 0) {
    return 0;
  }
  
  // Check cache - if screen height hasn't changed, return cached value
  if (cachedDragOffset !== null && 
      lastScreenHeight === height &&
      !isNaN(cachedDragOffset) &&
      isFinite(cachedDragOffset)) {
    return cachedDragOffset;
  }
  
  // Cache miss or invalidated - recalculate
  const config = createTransformConfigSync();
  const offset = calculateDragOffset(config);
  
  // Update cache
  cachedDragOffset = -offset; // Return negative offset (drag point is above finger)
  lastScreenHeight = height;
  
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
