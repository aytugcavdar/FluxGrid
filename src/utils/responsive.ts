// Canvas rect caching for performance
let cachedCanvasRect: DOMRect | null = null;
let cacheTime = 0;
const CACHE_VALIDITY_MS = 500;

export const setCanvasRect = (rect: DOMRect): void => {
  cachedCanvasRect = rect;
  cacheTime = Date.now();
};

export const getDragYOffset = (): number => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return 0;
  
  // Use cached canvas rect if available and valid
  const now = Date.now();
  if (cachedCanvasRect && (now - cacheTime) < CACHE_VALIDITY_MS) {
    // Calculate offset based on actual canvas position
    const screenHeight = window.innerHeight;
    if (screenHeight < 700) return -70;
    if (screenHeight < 800) return -90;
    return Math.min(-90, -screenHeight * 0.11);
  }
  
  // Fallback to screen-based calculation
  const screenHeight = window.innerHeight;
  if (screenHeight < 700) return -70;
  if (screenHeight < 800) return -90;
  return Math.min(-90, -screenHeight * 0.11);
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
