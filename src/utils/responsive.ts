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
