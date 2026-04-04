import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export interface SafeAreaInsets {
  top: number;    // pixels
  bottom: number; // pixels
  left: number;   // pixels
  right: number;  // pixels
}

/**
 * Get safe area insets from StatusBar API with CSS env() fallback
 * Returns insets in pixels
 */
export async function getSafeAreaInsets(): Promise<SafeAreaInsets> {
  const insets: SafeAreaInsets = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  // Only query StatusBar on native platforms
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await StatusBar.getInfo();
      
      // StatusBar height is the top inset
      if (info.height) {
        insets.top = info.height;
      }
    } catch (error) {
      console.warn('[SafeAreaManager] Failed to get StatusBar info:', error);
    }
  }

  // Fallback to CSS env() variables if available
  // These are set by the browser/WebView on devices with notches
  const computedStyle = getComputedStyle(document.documentElement);
  
  const cssTop = computedStyle.getPropertyValue('env(safe-area-inset-top)');
  const cssBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)');
  const cssLeft = computedStyle.getPropertyValue('env(safe-area-inset-left)');
  const cssRight = computedStyle.getPropertyValue('env(safe-area-inset-right)');
  
  // Parse CSS values (e.g., "48px" -> 48)
  if (cssTop && insets.top === 0) {
    insets.top = parseFloat(cssTop) || 0;
  }
  if (cssBottom) {
    insets.bottom = parseFloat(cssBottom) || 0;
  }
  if (cssLeft) {
    insets.left = parseFloat(cssLeft) || 0;
  }
  if (cssRight) {
    insets.right = parseFloat(cssRight) || 0;
  }

  // Conservative defaults if all methods fail (Android typical values)
  if (insets.top === 0 && Capacitor.isNativePlatform()) {
    insets.top = 48; // Typical status bar height on Android
  }
  if (insets.bottom === 0 && Capacitor.isNativePlatform()) {
    insets.bottom = 24; // Typical gesture bar height
  }

  return insets;
}

/**
 * Apply safe area insets as CSS custom properties to :root
 * This makes them available globally as var(--safe-area-top), etc.
 */
export function applySafeAreaCSS(): void {
  getSafeAreaInsets().then(insets => {
    const root = document.documentElement;
    
    root.style.setProperty('--safe-area-top', `${insets.top}px`);
    root.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-area-left', `${insets.left}px`);
    root.style.setProperty('--safe-area-right', `${insets.right}px`);
    
    console.log('[SafeAreaManager] Applied safe area insets:', insets);
  }).catch(error => {
    console.error('[SafeAreaManager] Failed to apply safe area CSS:', error);
  });
}

/**
 * Get safe area CSS variables as an object
 * Useful for inline styles
 */
export function getSafeAreaCSSVars(): Record<string, string> {
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    '--safe-area-top': computedStyle.getPropertyValue('--safe-area-top') || '0px',
    '--safe-area-bottom': computedStyle.getPropertyValue('--safe-area-bottom') || '0px',
    '--safe-area-left': computedStyle.getPropertyValue('--safe-area-left') || '0px',
    '--safe-area-right': computedStyle.getPropertyValue('--safe-area-right') || '0px',
  };
}
