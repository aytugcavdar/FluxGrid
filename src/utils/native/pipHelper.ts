/**
 * Picture-in-Picture Helper
 * Manages PiP mode for Android
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if PiP is supported
 */
export function isPipSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Enter Picture-in-Picture mode
 */
export function enterPipMode(): void {
  if (!isPipSupported()) {
    console.log('[PiP] Not supported on this platform');
    return;
  }
  
  try {
    if ((window as any).FluxGridNative) {
      (window as any).FluxGridNative.enterPictureInPicture();
      console.log('[PiP] Entering PiP mode');
    } else {
      console.warn('[PiP] Native bridge not available');
    }
  } catch (error) {
    console.error('[PiP] Failed to enter PiP mode:', error);
  }
}

/**
 * Listen for PiP mode changes
 */
export function addPipModeListener(callback: (isInPipMode: boolean) => void): () => void {
  if (!isPipSupported()) {
    return () => {};
  }
  
  const handler = (event: CustomEvent) => {
    const { isInPipMode } = event.detail;
    callback(isInPipMode);
  };
  
  window.addEventListener('pipModeChanged', handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('pipModeChanged', handler as EventListener);
  };
}

/**
 * Check if currently in PiP mode
 */
export function isInPipMode(): boolean {
  // This will be set by the native code
  return (window as any).__isInPipMode === true;
}
