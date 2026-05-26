/**
 * Dynamic Shortcut Helper
 * Manages dynamic shortcuts based on recently played modes
 */

import { Capacitor } from '@capacitor/core';

type NativeShortcutBridge = Window & {
  FluxGridNative?: {
    updateDynamicShortcuts?: () => void;
  };
};

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
  mode: 'ENDLESS' | 'TIMED';
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
    const normalizedMode = normalizeShortcutMode(mode);
    if (!normalizedMode) return;

    const recentModes = getRecentModes();
    
    // Update or add mode
    const existingIndex = recentModes.findIndex(m => m.mode === normalizedMode);
    const existingHighScore = existingIndex >= 0 ? recentModes[existingIndex].highScore : 0;
    const modeData: RecentMode = {
      mode: normalizedMode,
      lastPlayed: Date.now(),
      highScore: Math.max(toShortcutScore(score), existingHighScore),
    };
    
    if (existingIndex >= 0) {
      recentModes[existingIndex] = modeData;
    } else {
      recentModes.push(modeData);
    }
    
    // Sort by last played (most recent first)
    recentModes.sort((a, b) => b.lastPlayed - a.lastPlayed);
    
    // Keep supported launch shortcuts small and ordered by recency.
    const recentShortcuts = recentModes.slice(0, 2);
    
    localStorage.setItem('fluxgrid_recent_modes', JSON.stringify(recentShortcuts));
    
    // Notify native code to update shortcuts
    notifyNativeToUpdateShortcuts();
    
    console.log('[DynamicShortcuts] Recent modes updated:', recentShortcuts);
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
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item): RecentMode | null => {
          const mode = normalizeShortcutMode(item?.mode);
          if (!mode) return null;

          return {
            mode,
            lastPlayed: toShortcutTimestamp(item?.lastPlayed),
            highScore: toShortcutScore(item?.highScore),
          };
        })
        .filter((item): item is RecentMode => item !== null)
        .sort((a, b) => b.lastPlayed - a.lastPlayed);
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
  if (typeof window === 'undefined') return;

  // Post message to native code
  const bridge = (window as NativeShortcutBridge).FluxGridNative;
  bridge?.updateDynamicShortcuts?.();
}

/**
 * Clear recent modes
 */
export function clearRecentModes(): void {
  localStorage.removeItem('fluxgrid_recent_modes');
  notifyNativeToUpdateShortcuts();
}

function normalizeShortcutMode(mode: unknown): RecentMode['mode'] | null {
  const normalizedMode = String(mode ?? '').trim().toUpperCase();
  if (normalizedMode === 'ENDLESS' || normalizedMode === 'TIMED') {
    return normalizedMode;
  }
  return null;
}

function toShortcutScore(score: unknown): number {
  const numericScore = typeof score === 'number' ? score : Number(score);
  return Number.isFinite(numericScore) && numericScore > 0 ? Math.floor(numericScore) : 0;
}

function toShortcutTimestamp(timestamp: unknown): number {
  const numericTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  return Number.isFinite(numericTimestamp) && numericTimestamp > 0 ? numericTimestamp : 0;
}
