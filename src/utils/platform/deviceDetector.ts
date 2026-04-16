import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Device Detector Utility
 * 
 * Provides comprehensive device capability detection for performance optimization
 * and crash reporting. Combines Capacitor Device API with browser APIs.
 * 
 * @example
 * ```typescript
 * // Initialize device detection on app startup
 * const deviceInfo = await detectDeviceInfo();
 * console.log(formatDeviceInfo(deviceInfo));
 * 
 * // Check device tier for performance optimization
 * const tier = getDeviceTier(deviceInfo);
 * if (tier === 'low') {
 *   // Disable particle effects and shadows
 *   disableHeavyGraphics();
 * }
 * 
 * // Use cached info for subsequent checks
 * const cached = getCachedDeviceInfo();
 * if (cached && isLowEndDevice(cached)) {
 *   // Apply low-end optimizations
 * }
 * ```
 * 
 * @module deviceDetector
 * @see Requirements 5.5 (Performance Optimizations), 2.3 (Crash Reporting)
 */

/**
 * Device information interface
 * Contains comprehensive device capability and platform information
 */
export interface DeviceInfo {
  // Platform information
  platform: string;
  osVersion: string;
  manufacturer: string;
  model: string;
  isVirtual: boolean;
  
  // Hardware capabilities
  cpuCores: number;
  memoryGB: number;
  gpuRenderer: string | null;
  
  // Display information
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  
  // App information
  appVersion: string;
  webViewVersion: string;
}

/**
 * Cached device info to avoid repeated detection
 */
let cachedDeviceInfo: DeviceInfo | null = null;

/**
 * Clear device info cache (for testing purposes)
 * @internal
 */
export function clearDeviceInfoCache(): void {
  cachedDeviceInfo = null;
}

/**
 * Get GPU renderer information from WebGL context
 * Returns null if WebGL is not available or GPU info cannot be detected
 */
function getGPURenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return null;
    }
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return null;
    }
    
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return renderer || null;
  } catch (error) {
    console.warn('[DeviceDetector] GPU detection failed:', error);
    return null;
  }
}

/**
 * Get CPU core count
 * Uses navigator.hardwareConcurrency with fallback to 4 cores
 */
function getCPUCores(): number {
  return navigator.hardwareConcurrency || 4;
}

/**
 * Get device memory in GB
 * Uses navigator.deviceMemory with fallback to 4GB
 */
function getMemoryGB(): number {
  return (navigator as any).deviceMemory || 4;
}

/**
 * Parse OS version string to extract version number
 * Examples: "Android 13" -> "13", "iOS 16.5" -> "16.5"
 */
function parseOSVersion(osVersion: string): string {
  const match = osVersion.match(/[\d.]+/);
  return match ? match[0] : osVersion;
}

/**
 * Detect comprehensive device information
 * Combines Capacitor Device API with browser APIs for complete device profile
 * 
 * @returns Promise<DeviceInfo> Complete device information
 */
export async function detectDeviceInfo(): Promise<DeviceInfo> {
  // Return cached info if available
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  try {
    // Get device info from Capacitor Device API
    const [deviceId, deviceInfo, batteryInfo] = await Promise.all([
      Device.getId().catch(() => ({ identifier: 'unknown' })),
      Device.getInfo().catch(() => ({
        platform: 'web',
        operatingSystem: 'unknown',
        osVersion: 'unknown',
        manufacturer: 'unknown',
        model: 'unknown',
        isVirtual: false,
        webViewVersion: 'unknown'
      })),
      Device.getBatteryInfo().catch(() => null)
    ]);

    // Get hardware capabilities from browser APIs
    const cpuCores = getCPUCores();
    const memoryGB = getMemoryGB();
    const gpuRenderer = getGPURenderer();

    // Get display information
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const devicePixelRatio = window.devicePixelRatio || 1.0;

    // Get app version from package.json or environment
    const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

    // Parse OS version to extract version number
    const osVersion = parseOSVersion(deviceInfo.osVersion);

    cachedDeviceInfo = {
      platform: deviceInfo.platform,
      osVersion,
      manufacturer: deviceInfo.manufacturer,
      model: deviceInfo.model,
      isVirtual: deviceInfo.isVirtual,
      cpuCores,
      memoryGB,
      gpuRenderer,
      screenWidth,
      screenHeight,
      devicePixelRatio,
      appVersion,
      webViewVersion: deviceInfo.webViewVersion
    };

    console.log('[DeviceDetector] Device info detected:', cachedDeviceInfo);

    return cachedDeviceInfo;
  } catch (error) {
    console.error('[DeviceDetector] Failed to detect device info:', error);
    
    // Fallback to basic browser-based detection
    const fallbackInfo: DeviceInfo = {
      platform: Capacitor.getPlatform(),
      osVersion: 'unknown',
      manufacturer: 'unknown',
      model: 'unknown',
      isVirtual: false,
      cpuCores: getCPUCores(),
      memoryGB: getMemoryGB(),
      gpuRenderer: getGPURenderer(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio || 1.0,
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      webViewVersion: 'unknown'
    };

    cachedDeviceInfo = fallbackInfo;
    return fallbackInfo;
  }
}

/**
 * Get cached device info synchronously
 * Returns null if device info hasn't been detected yet
 * Call detectDeviceInfo() first to populate the cache
 */
export function getCachedDeviceInfo(): DeviceInfo | null {
  return cachedDeviceInfo;
}

/**
 * Check if device is low-end based on hardware capabilities
 * Low-end criteria: < 4GB RAM OR <= 4 CPU cores
 */
export function isLowEndDevice(deviceInfo: DeviceInfo): boolean {
  return deviceInfo.memoryGB < 4 || deviceInfo.cpuCores <= 4;
}

/**
 * Check if device is high-end based on hardware capabilities
 * High-end criteria: >= 6GB RAM AND > 4 CPU cores
 */
export function isHighEndDevice(deviceInfo: DeviceInfo): boolean {
  return deviceInfo.memoryGB >= 6 && deviceInfo.cpuCores > 4;
}

/**
 * Get device tier classification
 * Returns 'low', 'mid', or 'high' based on hardware capabilities
 */
export function getDeviceTier(deviceInfo: DeviceInfo): 'low' | 'mid' | 'high' {
  if (isLowEndDevice(deviceInfo)) {
    return 'low';
  } else if (isHighEndDevice(deviceInfo)) {
    return 'high';
  } else {
    return 'mid';
  }
}

/**
 * Format device info as a string for logging/debugging
 */
export function formatDeviceInfo(deviceInfo: DeviceInfo): string {
  return [
    `Platform: ${deviceInfo.platform} ${deviceInfo.osVersion}`,
    `Device: ${deviceInfo.manufacturer} ${deviceInfo.model}`,
    `CPU: ${deviceInfo.cpuCores} cores`,
    `RAM: ${deviceInfo.memoryGB}GB`,
    `GPU: ${deviceInfo.gpuRenderer || 'Unknown'}`,
    `Screen: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight} @${deviceInfo.devicePixelRatio}x`,
    `App: v${deviceInfo.appVersion}`,
    `WebView: ${deviceInfo.webViewVersion}`,
    `Virtual: ${deviceInfo.isVirtual ? 'Yes' : 'No'}`
  ].join('\n');
}
