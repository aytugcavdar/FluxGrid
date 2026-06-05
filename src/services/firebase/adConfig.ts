/**
 * Firebase Remote Config and Analytics for AdMob
 * 
 * Provides cloud-based configuration for ad parameters and analytics tracking
 */

import { isFirebaseConfigured, getFirebaseRemoteConfig, getFirebaseAnalytics } from './firebaseConfig';

// Ad Configuration Interface
export interface AdConfig {
  interstitial_frequency: number;
  rewarded_daily_limit: number;
  banner_enabled: boolean;
  interstitial_enabled: boolean;
  rewarded_enabled: boolean;
  ad_free_grace_period_games: number;
}

// Default configuration values
const DEFAULT_AD_CONFIG: AdConfig = {
  interstitial_frequency: 3,
  rewarded_daily_limit: 3,
  banner_enabled: true,
  interstitial_enabled: true,
  rewarded_enabled: true,
  ad_free_grace_period_games: 0,
};

// Current cached configuration
let cachedConfig: AdConfig = { ...DEFAULT_AD_CONFIG };
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 3600 * 1000; // 1 hour

/**
 * Check if Firebase is available
 */
function isFirebaseAvailable(): boolean {
  return isFirebaseConfigured();
}

/**
 * Fetch and activate ad configuration from Firebase Remote Config
 * 
 * @returns Promise<AdConfig> - Ad configuration object
 */
export async function fetchAndActivateAdConfig(): Promise<AdConfig> {
  console.log('[AdConfig] Fetching remote config...');
  
  // Check cache first
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION_MS) {
    console.log('[AdConfig] Using cached config');
    return cachedConfig;
  }
  
  // Check if Firebase is available
  if (!isFirebaseAvailable()) {
    console.warn('[AdConfig] Firebase not available, using default config');
    return DEFAULT_AD_CONFIG;
  }
  
  try {
    // Get Remote Config instance
    const remoteConfig = getFirebaseRemoteConfig();
    
    // Dynamically import Remote Config functions
    const { fetchAndActivate, getValue } = await import('firebase/remote-config');
    
    // Set cache expiration to 1 hour
    remoteConfig.settings.minimumFetchIntervalMillis = CACHE_DURATION_MS;
    
    // Fetch and activate
    await fetchAndActivate(remoteConfig);
    
    const getBooleanValue = (key: string, fallback: boolean): boolean => {
      const value = getValue(remoteConfig, key);
      return value.getSource() === 'static' ? fallback : value.asBoolean();
    };

    // Get values
    const config: AdConfig = {
      interstitial_frequency: getValue(remoteConfig, 'interstitial_frequency').asNumber() || DEFAULT_AD_CONFIG.interstitial_frequency,
      rewarded_daily_limit: getValue(remoteConfig, 'rewarded_daily_limit').asNumber() || DEFAULT_AD_CONFIG.rewarded_daily_limit,
      banner_enabled: getBooleanValue('banner_enabled', DEFAULT_AD_CONFIG.banner_enabled),
      interstitial_enabled: getBooleanValue('interstitial_enabled', DEFAULT_AD_CONFIG.interstitial_enabled),
      rewarded_enabled: getBooleanValue('rewarded_enabled', DEFAULT_AD_CONFIG.rewarded_enabled),
      ad_free_grace_period_games: getValue(remoteConfig, 'ad_free_grace_period_games').asNumber() || DEFAULT_AD_CONFIG.ad_free_grace_period_games,
    };
    
    // Update cache
    cachedConfig = config;
    lastFetchTime = now;
    
    console.log('[AdConfig] Remote config fetched successfully:', config);
    return config;
  } catch (error) {
    console.error('[AdConfig] Failed to fetch remote config:', error);
    
    // Return cached config or default on error
    return cachedConfig;
  }
}

/**
 * Get current ad configuration (from cache)
 * 
 * @returns AdConfig - Current ad configuration
 */
export function getAdConfig(): AdConfig {
  return { ...cachedConfig };
}

/**
 * Ad event types for Firebase Analytics
 */
export type AdEventName = 
  | 'ad_impression'
  | 'ad_rewarded_complete'
  | 'ad_rewarded_skip'
  | 'ad_interstitial_show';

/**
 * Log ad event to Firebase Analytics
 * 
 * @param eventName - Name of the ad event
 * @param params - Event parameters
 */
export async function logAdEvent(
  eventName: AdEventName,
  params: Record<string, any> = {}
): Promise<void> {
  // Check if Firebase is available
  if (!isFirebaseAvailable()) {
    console.warn('[AdConfig] Firebase not available, skipping analytics');
    return;
  }
  
  try {
    // Get Analytics instance
    const analytics = getFirebaseAnalytics();
    if (!analytics) {
      console.warn('[AdConfig] Analytics not available');
      return;
    }
    
    // Dynamically import Analytics functions
    const { logEvent } = await import('firebase/analytics');
    
    // Add common parameters
    const enrichedParams = {
      ...params,
      platform: 'android',
      timestamp: Date.now(),
    };
    
    // Log event
    logEvent(analytics, eventName, enrichedParams);
    
    console.log(`[AdConfig] Analytics event logged: ${eventName}`, enrichedParams);
  } catch (error) {
    console.error('[AdConfig] Failed to log analytics event:', error);
  }
}
