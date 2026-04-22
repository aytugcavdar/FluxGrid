/**
 * FPS Limiter
 * 
 * Limits frame rate to prevent jank from variable FPS
 */

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // 16.67ms

let lastFrameTime = 0;

/**
 * Request animation frame with FPS limit
 */
export const requestAnimationFrameLimited = (callback: FrameRequestCallback): number => {
  return requestAnimationFrame((timestamp) => {
    const elapsed = timestamp - lastFrameTime;
    
    if (elapsed >= FRAME_TIME) {
      lastFrameTime = timestamp - (elapsed % FRAME_TIME);
      callback(timestamp);
    } else {
      // Skip this frame, request next one
      requestAnimationFrameLimited(callback);
    }
  });
};

/**
 * Set FPS limit for the entire app
 */
export const setFPSLimit = (fps: number) => {
  // Update CSS animation speed
  const style = document.createElement('style');
  style.textContent = `
    * {
      animation-timing-function: linear !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log(`[FPS Limiter] Set to ${fps} FPS`);
};
