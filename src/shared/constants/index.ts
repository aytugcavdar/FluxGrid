/**
 * Shared constants used across features - Pure constants only, no feature dependencies
 */

// Touch Gesture Thresholds
export const GESTURE_THRESHOLDS = {
  TAP_MAX_DURATION: 300,
  LONG_PRESS_DURATION: 500,
  DRAG_MIN_DISTANCE: 10,
  PINCH_MIN_SCALE_CHANGE: 0.1,
  SWIPE_MIN_VELOCITY: 0.5,
  DOUBLE_TAP_MAX_INTERVAL: 300,
  MIN_TOUCH_TARGET_SIZE: 44,
};

// Responsive Breakpoints
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
};

// Performance Settings
export const PERFORMANCE_SETTINGS = {
  TARGET_FPS: 60,
  MIN_FPS: 30,
  MOBILE_PARTICLE_LIMIT: 50,
  DESKTOP_PARTICLE_LIMIT: 200,
  MEMORY_WARNING_THRESHOLD: 0.8,
  MEMORY_CRITICAL_THRESHOLD: 0.9,
};

// Persistence Settings
export const PERSISTENCE_SETTINGS = {
  SCHEMA_VERSION: 1,
  BACKUP_INTERVAL: 600000, // 10 minutes
  MAX_BACKUPS: 5,
  SAVE_DEBOUNCE: 1000, // 1 second
};

