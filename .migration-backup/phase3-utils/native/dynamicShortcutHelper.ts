/**
 * Dynamic Shortcut Helper
 * Manages dynamic shortcuts based on recently played modes
 */

import { Capacitor } from '@capacitor/core';

// Lazy load plugin
let DynamicShortcuts: any = null;

async function getDynamicShortcuts() {
  if (!DynamicShortcuts && Capacitor.isNativePlatform()) {
    try {
      // Note: This requires a custom Capacitor plugin
      // For now, we'll use native Android code
      return null;
    } catch (error) {
      console.error('[DynamicShortcuts] Failed to load plugin:', error);
      return null;
    }
  }
  return DynamicShortcuts;
}

/**
 * Check if dynamic shortcuts are supported
 */
export function isDynamicShortcutsSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Update dynamic shortcuts based on recently played modes
 * This will be called from native Android code
 */
export interface RecentMode {
  mode: 'ENDLESS' | 'TIMED' | 'ZEN';
  lastPlayed: number;
  highScore: number;
}

/**
 * Save recently played mode to localStorage
 * Native code will read this to update shortcuts
 */
export function saveRecentMode(mode: string, score: number): void {
  if (!isDynamicShortcutsSupported()) {
    return;
  }
  
  try {
    const recentModes = getRecentModes();
    
    // Update or add mode
    const existingIndex = recentModes.findIndex(m => m.mode === mode);
    const modeData: RecentMode = {
      mode: mode as any,
      lastPlayed: Date.now(),
      highScore: score,
    };
    
    if (existingIndex >= 0) {
      recentModes[existingIndex] = modeData;
    } else {
      recentModes.push(modeData);
    }
    
    // Sort by last played (most recent first)
    recentModes.sort((a, b) => b.lastPlayed - a.lastPlayed);
    
    // Keep only top 3
    const top3 = recentModes.slice(0, 3);
    
    localStorage.setItem('fluxgrid_recent_modes', JSON.stringify(top3));
    
    // Notify native code to update shortcuts
    notifyNativeToUpdateShortcuts();
    
    console.log('[DynamicShortcuts] Recent modes updated:', top3);
  } catch (error) {
    console.error('[DynamicShortcuts] Failed to save recent mode:', error);
  }
}

/**
 * Get recently played modes
 */
export function getRecentModes(): RecentMode[] {
  try {
    const stored = localStorage.getItem('fluxgrid_recent_modes');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[DynamicShortcuts] Failed to get recent modes:', error);
  }
  return [];
}

/**
 * Notify native Android code to update shortcuts
 * This sends a message that MainActivity can listen to
 */
function notifyNativeToUpdateShortcuts(): void {
  // Post message to native code
  if ((window as any).FluxGridNative) {
    (window as any).FluxGridNative.updateDynamicShortcuts();
  }
}

/**
 * Clear recent modes
 */
export function clearRecentModes(): void {
  localStorage.removeItem('fluxgrid_recent_modes');
  notifyNativeToUpdateShortcuts();
}
