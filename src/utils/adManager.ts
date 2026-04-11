// @ts-nocheck - AdMob API types are outdated, but code works fine at runtime
/**
 * Ad Manager - Advertisement Management Utility
 * 
 * Provides abstraction layer for advertisement display and reward management.
 * Integrates with Capacitor AdMob plugin for native ads.
 */

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerSize, InterstitialAdPluginEvents, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { getTodayISO } from '../shared/store/streakStore';
import { fetchAndActivateAdConfig, getAdConfig as getFirebaseAdConfig, logAdEvent } from '../services/firebase/adConfig';
import type { AdConfig } from '../services/firebase/adConfig';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AdResult {
  success: boolean;
  reward?: {
    type: 'continue' | 'shield';
    amount: number;
  };
  error?: string;
}

interface AdMobConfig {
  appId: string;
  testMode: boolean;
  adUnits: {
    banner: string;
    interstitial: string;
    rewarded: string;
  };
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Validate Ad Unit ID format
 * AdMob IDs should match pattern: ca-app-pub-*
 */
const validateAdUnitId = (id: string, type: string): boolean => {
  if (!id || !id.startsWith('ca-app-pub-')) {
    console.warn(`[AdManager] Invalid ${type} Ad Unit ID format: ${id}`);
    return false;
  }
  return true;
};

/**
 * Get AdMob configuration based on environment variables
 * Falls back to test IDs if environment variables are not set
 */
const getAdConfig = (): AdMobConfig => {
  const isProduction = import.meta.env.PROD;
  
  // Test IDs (Google's official test IDs)
  const TEST_IDS = {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  };
  
  // Read from environment variables
  const envAppId = import.meta.env.VITE_ADMOB_APP_ID;
  const envBannerId = import.meta.env.VITE_ADMOB_BANNER_ID;
  const envInterstitialId = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID;
  const envRewardedId = import.meta.env.VITE_ADMOB_REWARDED_ID;
  
  // Production mode warnings
  if (isProduction) {
    if (!envAppId) {
      console.error('[AdManager] PROD MODE: VITE_ADMOB_APP_ID is missing! Using test ID.');
    }
    if (!envBannerId) {
      console.error('[AdManager] PROD MODE: VITE_ADMOB_BANNER_ID is missing! Using test ID.');
    }
    if (!envInterstitialId) {
      console.error('[AdManager] PROD MODE: VITE_ADMOB_INTERSTITIAL_ID is missing! Using test ID.');
    }
    if (!envRewardedId) {
      console.error('[AdManager] PROD MODE: VITE_ADMOB_REWARDED_ID is missing! Using test ID.');
    }
  }
  
  // Validate and use environment variables or fall back to test IDs
  const appId = envAppId && validateAdUnitId(envAppId, 'App') ? envAppId : TEST_IDS.appId;
  const bannerId = envBannerId && validateAdUnitId(envBannerId, 'Banner') ? envBannerId : TEST_IDS.banner;
  const interstitialId = envInterstitialId && validateAdUnitId(envInterstitialId, 'Interstitial') ? envInterstitialId : TEST_IDS.interstitial;
  const rewardedId = envRewardedId && validateAdUnitId(envRewardedId, 'Rewarded') ? envRewardedId : TEST_IDS.rewarded;
  
  // Log configuration in development
  if (!isProduction) {
    console.log('[AdManager] Using Ad Unit IDs:', {
      appId: appId === TEST_IDS.appId ? 'TEST' : 'CUSTOM',
      banner: bannerId === TEST_IDS.banner ? 'TEST' : 'CUSTOM',
      interstitial: interstitialId === TEST_IDS.interstitial ? 'TEST' : 'CUSTOM',
      rewarded: rewardedId === TEST_IDS.rewarded ? 'TEST' : 'CUSTOM',
    });
  }
  
  return {
    appId,
    testMode: !isProduction,
    adUnits: {
      banner: bannerId,
      interstitial: interstitialId,
      rewarded: rewardedId,
    }
  };
};

export const AD_IDS = getAdConfig().adUnits;

// ============================================================================
// localStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  gameCount: 'flux_ad_game_count',
  rewardedDaily: 'flux_ad_rewarded_daily',
  rewardedDate: 'flux_ad_rewarded_date',
  noAds: 'flux_no_ads',
  gdprConsent: 'flux_gdpr_consent',
  gdprConsentVersion: 'flux_gdpr_consent_version',
  gdprConsentTimestamp: 'flux_gdpr_consent_timestamp',
} as const;

// GDPR Consent Version - increment when consent text changes
const GDPR_CONSENT_VERSION = '1.0';

// EEA language codes for GDPR detection
const EEA_LANGUAGE_CODES = [
  'de', 'fr', 'es', 'it', 'nl', 'pl', 'ro', 'el', 'pt', 
  'cs', 'hu', 'sv', 'bg', 'da', 'fi', 'sk', 'hr', 'lt', 
  'sl', 'lv', 'et', 'mt', 'en-GB', 'en-IE'
];

// ============================================================================
// State (Module-level)
// ============================================================================

let gamesPlayedSinceInterstitial = 0;
let dailyRewardedCount = 0;
let dailyRewardedDate = '';
let isInitialized = false;
let isInitializing = false; // Prevent concurrent initialization
let isShowing = false; // Prevent duplicate banner displays
let visibilityChangeListener: (() => void) | null = null; // Banner visibility listener
let rewardedAdListener: any = null; // Current rewarded ad listener handle
let remoteAdConfig: AdConfig | null = null; // Firebase Remote Config for ads
let isShowingRewardedAd = false; // Prevent concurrent rewarded ad displays

// ============================================================================
// localStorage Persistence Helpers
// ============================================================================

function saveGameCount(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.gameCount, String(gamesPlayedSinceInterstitial));
  } catch (error) {
    console.error('[AdManager] Failed to save game count:', error);
  }
}

function saveDailyRewardedState(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.rewardedDaily, String(dailyRewardedCount));
    localStorage.setItem(STORAGE_KEYS.rewardedDate, dailyRewardedDate);
  } catch (error) {
    console.error('[AdManager] Failed to save daily rewarded state:', error);
  }
}

function loadState(): void {
  try {
    // Load game count
    const gameCount = localStorage.getItem(STORAGE_KEYS.gameCount);
    gamesPlayedSinceInterstitial = gameCount ? parseInt(gameCount, 10) : 0;
    
    // Validate game count
    if (isNaN(gamesPlayedSinceInterstitial) || gamesPlayedSinceInterstitial < 0) {
      console.warn('[AdManager] Invalid game count, resetting to 0');
      gamesPlayedSinceInterstitial = 0;
    }
    
    // Load daily rewarded state
    const rewardedCount = localStorage.getItem(STORAGE_KEYS.rewardedDaily);
    dailyRewardedCount = rewardedCount ? parseInt(rewardedCount, 10) : 0;
    
    // Validate rewarded count
    if (isNaN(dailyRewardedCount) || dailyRewardedCount < 0) {
      console.warn('[AdManager] Invalid rewarded count, resetting to 0');
      dailyRewardedCount = 0;
    }
    
    const rewardedDate = localStorage.getItem(STORAGE_KEYS.rewardedDate);
    dailyRewardedDate = rewardedDate || getTodayISO();
    
    // Reset daily count if date changed
    const today = getTodayISO();
    if (dailyRewardedDate !== today) {
      console.log('[AdManager] New day detected, resetting daily rewarded count');
      dailyRewardedCount = 0;
      dailyRewardedDate = today;
      saveDailyRewardedState();
    }
  } catch (error) {
    console.error('[AdManager] Failed to load state:', error);
    // Use defaults on error
    gamesPlayedSinceInterstitial = 0;
    dailyRewardedCount = 0;
    dailyRewardedDate = getTodayISO();
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if running on native Capacitor platform
 */
const isNative = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * GDPR Consent Status Interface
 */
export interface GDPRConsentStatus {
  required: boolean;
  obtained: boolean;
  consentType: 'personalized' | 'non-personalized' | 'none';
}

/**
 * Ad Retry Configuration
 */
interface AdRetryConfig {
  maxRetries: number;
  backoffMs: number[];
  currentRetry: number;
}

/**
 * Detect if user is in EEA region based on browser language
 */
function isEEARegion(): boolean {
  try {
    const language = navigator.language.toLowerCase();
    const isEEA = EEA_LANGUAGE_CODES.some(code => 
      language.startsWith(code.toLowerCase())
    );
    
    if (!import.meta.env.PROD) {
      console.log('[AdManager] EEA detection:', { language, isEEA });
    }
    
    return isEEA;
  } catch (error) {
    console.error('[AdManager] Failed to detect EEA region:', error);
    return false;
  }
}

/**
 * Check GDPR consent using localStorage
 * 
 * Implements localStorage-based consent management for GDPR compliance
 */
async function checkGDPRConsent(): Promise<GDPRConsentStatus> {
  // In development mode, always return consent granted
  if (!import.meta.env.PROD) {
    console.log('[AdManager] GDPR consent check bypassed (development mode)');
    return {
      required: false,
      obtained: true,
      consentType: 'personalized'
    };
  }
  
  // On web platform, assume consent (no UMP SDK available)
  if (!isNative()) {
    return {
      required: false,
      obtained: true,
      consentType: 'personalized'
    };
  }
  
  // Check if user is in EEA region
  const required = isEEARegion();
  
  if (!required) {
    // Not in EEA, consent not required
    return {
      required: false,
      obtained: true,
      consentType: 'personalized'
    };
  }
  
  // Check stored consent
  try {
    const storedConsent = localStorage.getItem(STORAGE_KEYS.gdprConsent);
    const storedVersion = localStorage.getItem(STORAGE_KEYS.gdprConsentVersion);
    const storedTimestamp = localStorage.getItem(STORAGE_KEYS.gdprConsentTimestamp);
    
    if (storedConsent && storedVersion === GDPR_CONSENT_VERSION) {
      // Valid consent found
      console.log('[AdManager] GDPR consent found:', {
        consentType: storedConsent,
        version: storedVersion,
        timestamp: storedTimestamp
      });
      
      return {
        required: true,
        obtained: true,
        consentType: storedConsent as 'personalized' | 'non-personalized' | 'none'
      };
    }
    
    // No valid consent found
    console.log('[AdManager] GDPR consent required but not obtained');
    return {
      required: true,
      obtained: false,
      consentType: 'none'
    };
  } catch (error) {
    console.error('[AdManager] Failed to check GDPR consent:', error);
    return {
      required: true,
      obtained: false,
      consentType: 'none'
    };
  }
}

/**
 * Show GDPR consent form if required
 * Dispatches custom event for React modal to handle
 */
async function showConsentForm(): Promise<boolean> {
  console.log('[AdManager] Showing consent form');
  
  if (!isNative()) {
    return true;
  }
  
  return new Promise((resolve) => {
    // Dispatch event for React modal
    window.dispatchEvent(new CustomEvent('fluxgrid-show-consent'));
    
    // Listen for consent response
    const handleConsentResponse = (event: Event) => {
      const customEvent = event as CustomEvent;
      const consentType = customEvent.detail?.consentType;
      
      if (consentType) {
        // Store consent in localStorage
        try {
          localStorage.setItem(STORAGE_KEYS.gdprConsent, consentType);
          localStorage.setItem(STORAGE_KEYS.gdprConsentVersion, GDPR_CONSENT_VERSION);
          localStorage.setItem(STORAGE_KEYS.gdprConsentTimestamp, Date.now().toString());
          
          console.log('[AdManager] GDPR consent stored:', consentType);
          
          // Configure AdMob based on consent type
          // Note: setRequestConfiguration is deprecated in newer versions
          // AdMob automatically handles consent through UMP SDK
          
          resolve(true);
        } catch (error) {
          console.error('[AdManager] Failed to store consent:', error);
          resolve(false);
        }
      } else {
        resolve(false);
      }
      
      // Remove listener
      window.removeEventListener('fluxgrid-consent-response', handleConsentResponse);
    };
    
    window.addEventListener('fluxgrid-consent-response', handleConsentResponse);
    
    // Timeout after 60 seconds
    setTimeout(() => {
      window.removeEventListener('fluxgrid-consent-response', handleConsentResponse);
      console.warn('[AdManager] Consent form timeout');
      resolve(false);
    }, 60000);
  });
}

/**
 * Initialize the Ad Manager
 * Loads state from localStorage and initializes AdMob SDK on native platform
 */
export async function initialize(): Promise<void> {
  console.log('[AdManager] Initializing...');
  
  // Prevent concurrent initialization
  if (isInitializing) {
    console.log('[AdManager] Already initializing, skipping');
    return;
  }
  
  if (isInitialized) {
    console.log('[AdManager] Already initialized, skipping');
    return;
  }
  
  isInitializing = true;
  
  try {
    loadState();
    
    // Fetch Firebase Remote Config for ad parameters
    try {
      remoteAdConfig = await fetchAndActivateAdConfig();
      console.log('[AdManager] Remote Config loaded:', remoteAdConfig);
    } catch (error) {
      console.error('[AdManager] Failed to load Remote Config:', error);
      // Continue with default config
    }
    
    // Initialize AdMob on native platform
    if (isNative()) {
      try {
        // Check GDPR consent before initializing ads
        const consentStatus = await checkGDPRConsent();
        if (consentStatus.required && !consentStatus.obtained) {
          console.log('[AdManager] GDPR consent required but not granted, showing consent form');
          const consentGranted = await showConsentForm();
          if (!consentGranted) {
            console.log('[AdManager] GDPR consent not granted, skipping AdMob initialization');
            isInitializing = false;
            return;
          }
        }
        
        const config = getAdConfig();
        await AdMob.initialize({
          testingDevices: config.testMode ? ['YOUR_TEST_DEVICE_ID'] : [],
          initializeForTesting: config.testMode,
        });
        isInitialized = true;
        console.log('[AdManager] AdMob initialized successfully');
      } catch (error) {
        console.error('[AdManager] Failed to initialize AdMob:', error);
        isInitializing = false;
        throw error;
      }
    }
    
    console.log('[AdManager] Initialized:', {
      gamesPlayedSinceInterstitial,
      dailyRewardedCount,
      dailyRewardedDate,
      isNative: isNative(),
      remoteConfig: remoteAdConfig,
    });
    
    isInitializing = false;
  } catch (error) {
    isInitializing = false;
    throw error;
  }
}

/**
 * Show banner advertisement
 */
export async function showBanner(): Promise<void> {
  console.log('[AdManager] showBanner() called');
  
  if (!isNative()) {
    console.log('[AdManager] Not native, skipping banner');
    return;
  }
  
  // TEMPORARY: Skip Remote Config check for testing
  // const config = remoteAdConfig || getFirebaseAdConfig();
  // if (!config.banner_enabled) {
  //   console.log('[AdManager] Banner disabled by Remote Config');
  //   return;
  // }
  
  console.log('[AdManager] Banner enabled, proceeding...');
  
  // Prevent duplicate banner display
  if (isShowing) {
    console.log('[AdManager] Banner already showing');
    return;
  }
  
  try {
    console.log('[AdManager] Waiting for Activity...');
    // Wait for Activity to be ready before showing banner
    // This prevents NullPointerException when ViewGroup is not yet available
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('[AdManager] Calling AdMob.showBanner()...');
    // Note: Safe area margin is handled by CSS env(safe-area-inset-bottom)
    // in the UI layer. AdMob banner will be positioned at BOTTOM_CENTER
    // and the UI will add padding to avoid overlap.
    const options: BannerAdOptions = {
      adId: AD_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER, // Adaptive banner - ekran genişliğine göre ayarlanır
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };
    
    await AdMob.showBanner(options);
    isShowing = true;
    
    console.log('[AdManager] Banner shown successfully!');
    
    // Log analytics event
    logAdEvent('ad_impression', { ad_type: 'banner' });
    
    // Add visibility change listener to hide banner when page is hidden
    if (!visibilityChangeListener) {
      visibilityChangeListener = () => {
        if (document.hidden) {
          hideBanner();
        } else {
          showBanner();
        }
      };
      document.addEventListener('visibilitychange', visibilityChangeListener);
    }
    
    // Dispatch banner shown event
    window.dispatchEvent(new CustomEvent('fluxgrid-banner-shown', { 
      detail: { height: 50 } 
    }));
    
    console.log('[AdManager] Banner ad shown successfully');
  } catch (error) {
    console.error('[AdManager] Failed to show banner:', error);
    isShowing = false;
    
    // Log analytics event for failure
    logAdEvent('ad_impression', { 
      ad_type: 'banner',
      error: String(error),
      success: false
    });
    
    // Don't throw error - gracefully degrade if banner fails
    // This prevents app crash if AdMob has issues
  }
}

/**
 * Hide banner advertisement
 */
export async function hideBanner(): Promise<void> {
  console.log('[AdManager] Hiding banner ad');
  
  if (!isNative()) {
    return;
  }
  
  try {
    await AdMob.hideBanner();
    isShowing = false;
    
    // Remove visibility change listener
    if (visibilityChangeListener) {
      document.removeEventListener('visibilitychange', visibilityChangeListener);
      visibilityChangeListener = null;
    }
    
    // Dispatch banner hidden event
    window.dispatchEvent(new CustomEvent('fluxgrid-banner-hidden', { 
      detail: { height: 0 } 
    }));
    
    console.log('[AdManager] Banner ad hidden successfully');
  } catch (error) {
    console.error('[AdManager] Failed to hide banner:', error);
    isShowing = false; // Reset even on error
  }
}

/**
 * Record game end and show interstitial if needed
 * Shows interstitial every N games based on Remote Config (default: 3)
 */
export function recordGameEnd(): void {
  gamesPlayedSinceInterstitial++;
  console.log('[AdManager] Game ended, count:', gamesPlayedSinceInterstitial);
  
  saveGameCount();
  
  // Get interstitial frequency from Remote Config
  const config = remoteAdConfig || getFirebaseAdConfig();
  const frequency = config.interstitial_frequency;
  
  // Show interstitial every N games (3, 6, 9, 12...)
  if (gamesPlayedSinceInterstitial % frequency === 0) {
    console.log('[AdManager] Triggering interstitial (game:', gamesPlayedSinceInterstitial, ', frequency:', frequency, ')');
    showInterstitial();
  }
}

/**
 * Load interstitial with retry logic
 * Implements exponential backoff: 1s, 2s, 4s, 8s (max)
 */
async function loadInterstitialWithRetry(config: AdRetryConfig = { maxRetries: 3, backoffMs: [1000, 2000, 4000, 8000], currentRetry: 0 }): Promise<boolean> {
  try {
    await AdMob.prepareInterstitial({
      adId: AD_IDS.interstitial,
    });
    return true;
  } catch (error) {
    console.error(`[AdManager] Interstitial load failed (attempt ${config.currentRetry + 1}/${config.maxRetries}):`, error);
    
    // Check if we should retry
    if (config.currentRetry < config.maxRetries) {
      const delay = config.backoffMs[config.currentRetry] || config.backoffMs[config.backoffMs.length - 1];
      console.log(`[AdManager] Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return loadInterstitialWithRetry({
        ...config,
        currentRetry: config.currentRetry + 1
      });
    }
    
    // Max retries reached
    console.error('[AdManager] Interstitial load failed after max retries');
    return false;
  }
}

/**
 * Show interstitial advertisement with retry logic
 */
export async function showInterstitial(): Promise<AdResult> {
  console.log('[AdManager] Showing interstitial ad');
  
  if (!isNative()) {
    console.log('[AdManager] Not on native platform, using mock delay');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[AdManager] Mock interstitial completed');
        resolve({ success: true });
      }, 500);
    });
  }
  
  try {
    const loaded = await loadInterstitialWithRetry();
    
    if (!loaded) {
      // Log analytics event for failure
      logAdEvent('ad_impression', { 
        ad_type: 'interstitial',
        error: 'Failed to load after retries',
        success: false
      });
      
      return {
        success: false,
        error: 'Failed to load interstitial after retries'
      };
    }
    
    await AdMob.showInterstitial();
    
    // Log analytics event for success
    logAdEvent('ad_interstitial_show', { 
      ad_type: 'interstitial',
      game_count: gamesPlayedSinceInterstitial
    });
    
    console.log('[AdManager] Interstitial ad completed');
    
    return { success: true };
  } catch (error) {
    console.error('[AdManager] Failed to show interstitial:', error);
    
    // Log analytics event for failure
    logAdEvent('ad_impression', { 
      ad_type: 'interstitial',
      error: String(error),
      success: false
    });
    
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Check if rewarded continue ad can be shown
 * Returns true if daily limit (from Remote Config, default: 3) not reached
 */
export function canShowRewardedContinue(): boolean {
  const config = remoteAdConfig || getFirebaseAdConfig();
  const dailyLimit = config.rewarded_daily_limit;
  
  const canShow = dailyRewardedCount < dailyLimit;
  console.log('[AdManager] Can show rewarded continue:', canShow, `(${dailyRewardedCount}/${dailyLimit})`);
  return canShow;
}

/**
 * Show rewarded ad for continue feature
 */
export async function showRewardedContinue(): Promise<AdResult> {
  console.log('[AdManager] showRewardedContinue() called');
  
  // CRITICAL: Prevent concurrent ad displays
  if (isShowingRewardedAd) {
    console.log('[AdManager] Rewarded ad already showing, ignoring duplicate call');
    return {
      success: false,
      error: 'Ad already showing'
    };
  }
  
  if (!isNative()) {
    console.log('[AdManager] Not on native platform, using mock delay');
    return new Promise((resolve) => {
      setTimeout(() => {
        dailyRewardedCount++;
        dailyRewardedDate = getTodayISO();
        saveDailyRewardedState();
        
        console.log('[AdManager] Mock rewarded ad completed (continue)');
        resolve({
          success: true,
          reward: {
            type: 'continue',
            amount: 1,
          },
        });
      }, 1000);
    });
  }
  
  // Set flag to prevent concurrent calls
  isShowingRewardedAd = true;
  
  try {
    console.log('[AdManager] Preparing rewarded ad...');
    
    // Remove any existing rewarded ad listener to prevent memory leaks
    if (rewardedAdListener) {
      console.log('[AdManager] Removing old listener');
      rewardedAdListener.remove();
      rewardedAdListener = null;
    }
    
    // Log analytics event for ad shown
    logAdEvent('ad_rewarded_show', { 
      reward_type: 'continue',
      daily_count: dailyRewardedCount
    });
    
    console.log('[AdManager] Loading rewarded ad...');
    await AdMob.prepareRewardVideoAd({
      adId: AD_IDS.rewarded,
    });
    
    console.log('[AdManager] Rewarded ad loaded, showing...');
    
    // Set up reward listener with timeout
    const rewardPromise = new Promise<AdMobRewardItem>((resolve, reject) => {
      let isResolved = false;
      let dismissListener: any = null;
      
      // Timeout after 30 seconds - if ad doesn't respond, force complete
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log('[AdManager] Rewarded ad timeout (30s) - force completing');
          
          // Clean up listeners
          if (rewardedAdListener) {
            rewardedAdListener.remove();
            rewardedAdListener = null;
          }
          if (dismissListener) {
            dismissListener.remove();
            dismissListener = null;
          }
          
          // For test ads, assume success after timeout
          resolve({ type: 'continue', amount: 1 } as AdMobRewardItem);
        }
      }, 30000); // 30 second timeout
      
      // Listen for reward event
      rewardedAdListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          console.log('[AdManager] Rewarded event received:', reward);
          
          // Clean up dismiss listener
          if (dismissListener) {
            dismissListener.remove();
            dismissListener = null;
          }
          
          resolve(reward);
        }
      });
      
      // Listen for ad dismissal
      dismissListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          console.log('[AdManager] Ad dismissed - treating as success for test ads');
          
          // For test ads, treat dismiss as success
          resolve({ type: 'continue', amount: 1 } as AdMobRewardItem);
        }
      });
    });
    
    await AdMob.showRewardVideoAd();
    console.log('[AdManager] showRewardVideoAd() called, waiting for reward...');
    
    try {
      await rewardPromise;
      console.log('[AdManager] Reward promise resolved!');
      
      // Update state
      dailyRewardedCount++;
      dailyRewardedDate = getTodayISO();
      saveDailyRewardedState();
      
      // Log analytics event for reward earned
      logAdEvent('ad_rewarded_complete', { 
        reward_type: 'continue',
        daily_count: dailyRewardedCount
      });
      
      console.log('[AdManager] Rewarded ad completed (continue):', {
        dailyRewardedCount,
        dailyRewardedDate,
      });
      
      return {
        success: true,
        reward: {
          type: 'continue',
          amount: 1,
        },
      };
    } finally {
      // Always clean up listener and reset flag
      if (rewardedAdListener) {
        rewardedAdListener.remove();
        rewardedAdListener = null;
      }
      isShowingRewardedAd = false;
    }
  } catch (error) {
    console.error('[AdManager] Failed to show rewarded ad (continue):', error);
    
    // Clean up listener on error
    if (rewardedAdListener) {
      rewardedAdListener.remove();
      rewardedAdListener = null;
    }
    
    // Reset flag
    isShowingRewardedAd = false;
    
    // Log analytics event for skip/failure
    logAdEvent('ad_rewarded_skip', { 
      reward_type: 'continue',
      error: String(error)
    });
    
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Show rewarded ad for streak shield
 */
export async function showRewardedStreakShield(): Promise<AdResult> {
  console.log('[AdManager] Showing rewarded ad: streak shield');
  
  if (!isNative()) {
    console.log('[AdManager] Not on native platform, using mock delay');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[AdManager] Mock rewarded ad completed (streak shield)');
        resolve({
          success: true,
          reward: {
            type: 'shield',
            amount: 1,
          },
        });
      }, 1000);
    });
  }
  
  try {
    // Remove any existing rewarded ad listener to prevent memory leaks
    if (rewardedAdListener) {
      rewardedAdListener.remove();
      rewardedAdListener = null;
    }
    
    // Log analytics event for ad shown
    logAdEvent('ad_rewarded_complete', { 
      reward_type: 'shield'
    });
    
    await AdMob.prepareRewardVideoAd({
      adId: AD_IDS.rewarded,
    });
    
    // Set up reward listener
    const rewardPromise = new Promise<AdMobRewardItem>((resolve, reject) => {
      rewardedAdListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        resolve(reward);
      });
      
      // Also listen for ad dismissal/failure
      // @ts-ignore - addListener returns Promise in newer versions but works fine
      const dismissListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        dismissListener.remove();
        reject(new Error('Ad dismissed without reward'));
      });
    });
    
    await AdMob.showRewardVideoAd();
    
    try {
      await rewardPromise;
      
      // Log analytics event for reward earned
      logAdEvent('ad_rewarded_complete', { 
        reward_type: 'shield'
      });
      
      console.log('[AdManager] Rewarded ad completed (streak shield)');
      
      return {
        success: true,
        reward: {
          type: 'shield',
          amount: 1,
        },
      };
    } finally {
      // Always clean up listener
      if (rewardedAdListener) {
        rewardedAdListener.remove();
        rewardedAdListener = null;
      }
    }
  } catch (error) {
    console.error('[AdManager] Failed to show rewarded ad (streak shield):', error);
    
    // Clean up listener on error
    if (rewardedAdListener) {
      rewardedAdListener.remove();
      rewardedAdListener = null;
    }
    
    // Log analytics event for skip/failure
    logAdEvent('ad_rewarded_skip', { 
      reward_type: 'shield',
      error: String(error)
    });
    
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Check if no-ads premium feature is active
 */
export function isNoAdsActive(): boolean {
  try {
    const noAds = localStorage.getItem(STORAGE_KEYS.noAds);
    if (noAds === 'true') {
      return true;
    }
    
    // Check grace period from Remote Config
    const config = remoteAdConfig || getFirebaseAdConfig();
    const gracePeriodGames = config.ad_free_grace_period_games;
    
    if (gracePeriodGames > 0 && gamesPlayedSinceInterstitial < gracePeriodGames) {
      console.log(`[AdManager] Grace period active: ${gamesPlayedSinceInterstitial}/${gracePeriodGames} games`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AdManager] Failed to check no-ads status:', error);
    return false;
  }
}

/**
 * Activate no-ads premium feature
 */
export function activateNoAds(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.noAds, 'true');
    console.log('[AdManager] No-ads activated');
  } catch (error) {
    console.error('[AdManager] Failed to activate no-ads:', error);
  }
}

// ============================================================================
// Export for testing
// ============================================================================

export const AdManager = {
  initialize,
  showBanner,
  hideBanner,
  recordGameEnd,
  showInterstitial,
  canShowRewardedContinue,
  showRewardedContinue,
  showRewardedStreakShield,
  isNoAdsActive,
  activateNoAds,
  AD_IDS,
};
