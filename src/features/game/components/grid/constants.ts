/**
 * Grid Constants
 * 3D layout and pool size configurations
 */

import { detectDeviceCapabilities, getPerformanceConfig } from '../../../../utils/platform/deviceCapability';

// Grid size (imported from parent types, but re-exported for convenience)
export const GRID_SIZE = 10;

// 3D Layout Constants
export const CELL_SIZE = 1.0;
export const CELL_SPACING = 0.05;
export const TOTAL_CELL_SIZE = CELL_SIZE + CELL_SPACING;
export const GRID_OFFSET = ((GRID_SIZE - 1) * TOTAL_CELL_SIZE) / 2;

// Pool Sizes
export const GHOST_POOL_SIZE = 25;
export const SKILL_OVERLAY_POOL_SIZE = 10;
export const GUIDED_HIGHLIGHT_POOL_SIZE = 25;

// Fragment pool sizing based on device tier
// Note: This is a synchronous function that may use cached or estimated values
// For accurate detection, use detectDeviceCapabilities() directly (async)
export function getFragmentPoolSize(): number {
  try {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory >= 8 && cores >= 8) {
      return 25; // high: 5 frags × 5 cells simultaneous
    } else if (memory >= 6 || cores >= 6) {
      return 20; // mid-high
    } else if (memory >= 4 || cores >= 4) {
      return 15; // mid: 3 frags × 5 cells
    } else if (memory >= 3 || cores >= 3) {
      return 6;  // mid-low: 2 frags × 3 cells
    } else {
      return 0;  // low / low-mid: no fragments
    }
  } catch {
    return 10;
  }
}

// Legacy constant for backward compatibility (will be replaced by getFragmentPoolSize())
const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();
export const FRAGMENT_POOL_SIZE = isNativeApp ? 25 : 50;
export const FRAGMENT_LIFETIME = 400; // ms

// Camera Constants
export const CAMERA_POSITION_Y = 15;
export const CAMERA_TARGET_Y = 0;
export const CAMERA_FOV = 0.8;

// Animation Constants - Optimized for faster gameplay
export const PLACEMENT_ANIMATION_DURATION = 150; // ms (was 300ms - 2x faster)
export const LINE_CLEAR_ANIMATION_DURATION = 300; // ms (was 600ms - 2x faster)
export const GAME_OVER_ANIMATION_DURATION = 800; // ms (was 1000ms - slightly faster)
export const COMBO_FLASH_DURATION = 100; // ms (was 200ms - 2x faster)

// New: Placement impact settings
export const PLACEMENT_IMPACT = {
  SCREEN_SHAKE_INTENSITY: 0.08, // Base shake intensity
  SCREEN_SHAKE_DURATION: 120, // ms
  PARTICLE_COUNT_BASE: 8, // Base particle count
  PARTICLE_COUNT_PER_BLOCK: 2, // Additional particles per block
  DROP_HEIGHT_MULTIPLIER: 0.015, // Shake multiplier based on drop height
  COMBO_MULTIPLIER: 0.05, // Additional shake per combo level
} as const;

// New: Line clear sweep settings
export const LINE_CLEAR_SWEEP = {
  SWEEP_DURATION: 250, // ms - sweep animation duration
  PARTICLE_TRAIL_COUNT: 12, // Particles per cleared cell
  FLASH_DURATION: 150, // ms - color flash duration
  CHAIN_DELAY: 80, // ms - delay between chain reactions
} as const;

// New: Combo milestone settings
export const COMBO_MILESTONES = {
  LEVEL_1: 3, // Small effect
  LEVEL_2: 5, // Medium effect
  LEVEL_3: 10, // Large effect
  LEVEL_4: 15, // Epic effect
  SHAKE_MULTIPLIERS: [1.0, 1.5, 2.5, 4.0], // Shake intensity per level
  PARTICLE_MULTIPLIERS: [1.0, 2.0, 3.5, 5.0], // Particle count per level
} as const;
