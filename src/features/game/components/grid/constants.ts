/**
 * Grid Constants
 * 3D layout and pool size configurations
 */

import { detectDeviceCapabilities, getPerformanceConfig } from '../../../../utils/deviceCapability';

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
export function getFragmentPoolSize(): number {
  const deviceCapabilities = detectDeviceCapabilities();
  const perfConfig = getPerformanceConfig(deviceCapabilities.tier);
  return perfConfig.fragmentPoolSize;
}

// Legacy constant for backward compatibility (will be replaced by getFragmentPoolSize())
const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();
export const FRAGMENT_POOL_SIZE = isNativeApp ? 25 : 50;
export const FRAGMENT_LIFETIME = 400; // ms

// Camera Constants
export const CAMERA_POSITION_Y = 15;
export const CAMERA_TARGET_Y = 0;
export const CAMERA_FOV = 0.8;

// Animation Constants
export const PLACEMENT_ANIMATION_DURATION = 300; // ms
export const LINE_CLEAR_ANIMATION_DURATION = 600; // ms
export const GAME_OVER_ANIMATION_DURATION = 1000; // ms
export const COMBO_FLASH_DURATION = 200; // ms;
