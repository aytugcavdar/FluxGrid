import { Capacitor } from '@capacitor/core';

// Lazy import StatusBar to avoid web platform errors
let StatusBar: any = null;
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar').then(module => {
    StatusBar = module.StatusBar;
  }).catch(err => {
    console.warn('[SafeAreaManager] StatusBar plugin not available:', err);
  });
}

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
  if (Capacitor.isNativePlatform() && StatusBar) {
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
 * 
 * Strategy: Set conservative defaults synchronously first, then update with actual values asynchronously
 * This prevents layout jumps on first render
 */
export function applySafeAreaCSS(): void {
  const root = document.documentElement;
  
  // 1. Set conservative defaults synchronously (prevents layout jump on first render)
  const isAndroid = /Android/i.test(navigator.userAgent);
  const defaultTop = isAndroid ? 48 : 44;
  const defaultBottom = isAndroid ? 24 : 20;
  
  root.style.setProperty('--safe-area-top', `${defaultTop}px`);
  root.style.setProperty('--safe-area-bottom', `${defaultBottom}px`);
  root.style.setProperty('--safe-area-left', '0px');
  root.style.setProperty('--safe-area-right', '0px');
  
  console.log('[SafeAreaManager] Set conservative defaults:', {
    top: defaultTop,
    bottom: defaultBottom
  });
  
  // 2. Query actual values asynchronously and update
  getSafeAreaInsets().then(insets => {
    root.style.setProperty('--safe-area-top', `${insets.top}px`);
    root.style.setProperty('--safe-area-bottom', `${insets.bottom}px`);
    root.style.setProperty('--safe-area-left', `${insets.left}px`);
    root.style.setProperty('--safe-area-right', `${insets.right}px`);
    
    console.log('[SafeAreaManager] Updated with actual insets:', insets);
  }).catch(error => {
    console.error('[SafeAreaManager] Failed to get actual insets:', error);
    // Defaults already set, continue using them
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
