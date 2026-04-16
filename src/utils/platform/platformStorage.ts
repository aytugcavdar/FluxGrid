/**
 * Platform-specific localStorage utility
 * 
 * Provides platform-specific key prefixing for localStorage to ensure
 * Android settings don't affect web/desktop settings and vice versa.
 * 
 * Requirements: 12.4, 12.5
 */

import { detectPlatform } from './platform';

/**
 * Get platform-specific localStorage key
 * 
 * @param key - Base key name
 * @returns Platform-specific key (e.g., 'android:fps-limit' or 'web:fps-limit')
 */
export function getPlatformKey(key: string): string {
  const platform = detectPlatform();
  return `${platform.platform}:${key}`;
}

/**
 * Get item from platform-specific localStorage
 * 
 * @param key - Base key name
 * @returns Stored value or null
 */
export function getPlatformItem(key: string): string | null {
  try {
    const platformKey = getPlatformKey(key);
    return localStorage.getItem(platformKey);
  } catch (error) {
    console.error(`[PlatformStorage] Failed to get item: ${key}`, error);
    return null;
  }
}

/**
 * Set item in platform-specific localStorage
 * 
 * @param key - Base key name
 * @param value - Value to store
 */
export function setPlatformItem(key: string, value: string): void {
  try {
    const platformKey = getPlatformKey(key);
    localStorage.setItem(platformKey, value);
  } catch (error) {
    console.error(`[PlatformStorage] Failed to set item: ${key}`, error);
  }
}

/**
 * Remove item from platform-specific localStorage
 * 
 * @param key - Base key name
 */
export function removePlatformItem(key: string): void {
  try {
    const platformKey = getPlatformKey(key);
    localStorage.removeItem(platformKey);
  } catch (error) {
    console.error(`[PlatformStorage] Failed to remove item: ${key}`, error);
  }
}
