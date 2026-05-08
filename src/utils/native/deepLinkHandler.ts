/**
 * Deep Link Handler for App Shortcuts
 * Handles fluxgrid://mode/{mode} URLs
 */

import { GameMode } from '@shared/types';
import { App } from '@capacitor/app';

export interface DeepLinkData {
  mode?: GameMode;
  screen?: 'statistics' | 'settings';
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
 * Supported formats:
 * - fluxgrid://mode/endless
 * - fluxgrid://mode/timed
 * - fluxgrid://screen/statistics
 * - fluxgrid://screen/settings
 */
function parseDeepLink(url: string): DeepLinkData | null {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a fluxgrid:// URL
    if (urlObj.protocol !== 'fluxgrid:') {
      return null;
    }
    
    const host = urlObj.host;
    const path = urlObj.pathname.replace('/', '');
    
    // Parse mode deep links
    if (host === 'mode') {
      switch (path) {
        case 'endless':
          return { mode: GameMode.ENDLESS };
        case 'timed':
          return { mode: GameMode.TIMED };
        default:
          console.warn('[DeepLink] Unknown mode:', path);
          return null;
      }
    }
    
    // Parse screen deep links
    if (host === 'screen') {
      switch (path) {
        case 'statistics':
          return { screen: 'statistics' };
        case 'settings':
          return { screen: 'settings' };
        default:
          console.warn('[DeepLink] Unknown screen:', path);
          return null;
      }
    }
    
    console.warn('[DeepLink] Unknown host:', host);
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
