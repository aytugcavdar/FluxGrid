import { Capacitor } from '@capacitor/core';

/**
 * Platform bilgisi interface'i
 */
export interface PlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  platform: string;
}

// Platform bilgisini cache'le
let cachedPlatformInfo: PlatformInfo | null = null;

/**
 * Cache'i temizle (test amaçlı)
 * @internal
 */
export function clearPlatformCache(): void {
  cachedPlatformInfo = null;
}

/**
 * Platform tespiti yap ve cache'le
 * Capacitor API kullanarak platformu tespit eder
 * 
 * @returns Platform bilgisi (Android, iOS, Web)
 */
export function detectPlatform(): PlatformInfo {
  // Cache'den dön
  if (cachedPlatformInfo) {
    return cachedPlatformInfo;
  }

  try {
    const platform = Capacitor.getPlatform();
    
    cachedPlatformInfo = {
      isAndroid: platform === 'android',
      isIOS: platform === 'ios',
      isWeb: platform === 'web',
      platform
    };

    console.log('[Platform] Detected:', cachedPlatformInfo);
    
    return cachedPlatformInfo;
  } catch (error) {
    console.warn('[Platform] Detection failed, defaulting to web', error);
    
    cachedPlatformInfo = {
      isAndroid: false,
      isIOS: false,
      isWeb: true,
      platform: 'web'
    };
    
    return cachedPlatformInfo;
  }
}

/**
 * Android platformunda mı kontrol et
 * 
 * @returns Android ise true, değilse false
 */
export function isAndroid(): boolean {
  const platformInfo = detectPlatform();
  return platformInfo.isAndroid;
}

/**
 * iOS platformunda mı kontrol et
 * 
 * @returns iOS ise true, değilse false
 */
export function isIOS(): boolean {
  const platformInfo = detectPlatform();
  return platformInfo.isIOS;
}

/**
 * Web platformunda mı kontrol et
 * 
 * @returns Web ise true, değilse false
 */
export function isWeb(): boolean {
  const platformInfo = detectPlatform();
  return platformInfo.isWeb;
}
