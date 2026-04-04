import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export interface TouchPoint {
  x: number;
  y: number;
}

export interface TransformConfig {
  dpiDensity: number;
  statusBarHeight: number;
  baseOffsetDp: number;
}

/**
 * Create transform configuration with current device settings
 */
export async function createTransformConfig(): Promise<TransformConfig> {
  // DPI density from devicePixelRatio
  const dpiDensity = window.devicePixelRatio || 1.0;
  
  // Status bar height from StatusBar API (native only)
  let statusBarHeight = 0;
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await StatusBar.getInfo();
      statusBarHeight = info.height || 0;
    } catch (error) {
      console.warn('[TouchTransform] Failed to get status bar height:', error);
      // Fallback to typical Android status bar height
      statusBarHeight = 48;
    }
  }
  
  // Base offset in dp (finger height - block should be visible above finger)
  const baseOffsetDp = 16; // Reduced from 22 to 16 for better bottom row access
  
  return {
    dpiDensity,
    statusBarHeight,
    baseOffsetDp
  };
}

/**
 * Transform native touch coordinates to WebView coordinates
 * Applies DPI adjustment and status bar offset
 */
export function transformTouchCoordinate(
  nativePoint: TouchPoint,
  config: TransformConfig
): TouchPoint {
  // Apply status bar offset to Y coordinate
  const adjustedY = nativePoint.y - config.statusBarHeight;
  
  return {
    x: nativePoint.x,
    y: adjustedY
  };
}

/**
 * Calculate drag Y offset for piece dragging
 * Formula: fingerHeightDp * dpiDensity
 * Note: Status bar height is already handled by layout, don't add it here
 */
export function calculateDragOffset(config: TransformConfig): number {
  // Convert dp to pixels using DPI density
  const fingerHeightPx = config.baseOffsetDp * config.dpiDensity;
  
  // Don't add status bar height - it's already handled by the layout
  return fingerHeightPx;
}

/**
 * Synchronous version of createTransformConfig for immediate use
 * Uses cached status bar height or fallback
 */
export function createTransformConfigSync(): TransformConfig {
  const dpiDensity = window.devicePixelRatio || 1.0;
  
  // Use cached status bar height or fallback
  const statusBarHeight = Capacitor.isNativePlatform() ? 48 : 0;
  
  const baseOffsetDp = 16; // Reduced from 22 to 16 for better bottom row access
  
  return {
    dpiDensity,
    statusBarHeight,
    baseOffsetDp
  };
}
