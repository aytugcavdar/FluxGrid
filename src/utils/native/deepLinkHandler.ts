/**
 * Deep Link Handler for App Shortcuts
 * Handles fluxgrid://mode/{mode} URLs
 */

import { GameMode } from '@shared/types';
import { App } from '@capacitor/app';

export interface DeepLinkData {
  mode?: GameMode;
}

/**
 * Initialize deep link listener
 */
export function initializeDeepLinkHandler(
  onDeepLink: (data: DeepLinkData) => void
): void {
  // Listen for app URL open events
  App.addListener('appUrlOpen', (event) => {
    console.log('[DeepLink] App opened with URL:', event.url);
    
    const data = parseDeepLink(event.url);
    if (data) {
      onDeepLink(data);
    }
  });
  
  // Check if app was opened with a URL
  App.getLaunchUrl().then((result) => {
    if (result?.url) {
      console.log('[DeepLink] App launched with URL:', result.url);
      const data = parseDeepLink(result.url);
      if (data) {
        onDeepLink(data);
      }
    }
  });
}

/**
 * Parse deep link URL
 * Format: fluxgrid://mode/{endless|timed|zen}
 */
function parseDeepLink(url: string): DeepLinkData | null {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a fluxgrid:// URL
    if (urlObj.protocol !== 'fluxgrid:') {
      return null;
    }
    
    // Parse mode from path
    if (urlObj.host === 'mode') {
      const modePath = urlObj.pathname.replace('/', '');
      
      switch (modePath) {
        case 'endless':
          return { mode: GameMode.ENDLESS };
        case 'timed':
          return { mode: GameMode.TIMED };
        default:
          console.warn('[DeepLink] Unknown mode:', modePath);
          return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[DeepLink] Failed to parse URL:', error);
    return null;
  }
}

/**
 * Remove deep link listener
 */
export function removeDeepLinkHandler(): void {
  App.removeAllListeners();
}
