/**
 * Ad Manager - Advertisement Management Utility
 * 
 * Provides abstraction layer for advertisement display and reward management.
 * Integrates with Capacitor AdMob plugin for native ads.
 */

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerSize, InterstitialAdPluginEvents, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { getTodayISO } from '../shared/store/streakStore';

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
} as const;

// ============================================================================
// State (Module-level)
// ============================================================================

let gamesPlayedSinceInterstitial = 0;
let dailyRewardedCount = 0;
let dailyRewardedDate = '';
let isInitialized = false;
let isShowing = false; // Prevent duplicate banner displays

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
 * Check GDPR consent using UMP SDK
 * 
 * Implements User Messaging Platform (UMP) SDK for GDPR compliance
 * Documentation: https://developers.google.com/admob/ump/android/quick-start
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
  
  // TODO: Implement actual UMP SDK consent check
  // This requires native Android code integration
  // For now, return consent granted to allow ads
  console.warn('[AdManager] GDPR consent check not fully implemented - using placeholder');
  
  return {
    required: false, // Set to true for EEA/UK regions
    obtained: true,
    consentType: 'personalized'
  };
}

/**
 * Show GDPR consent form if required
 */
async function showConsentForm(): Promise<boolean> {
  console.log('[AdManager] Showing consent form');
  
  if (!isNative()) {
    return true;
  }
  
  // TODO: Implement UMP consent form display
  // This requires native Android code integration
  console.warn('[AdManager] Consent form not implemented - using placeholder');
  
  return true;
}

/**
 * Initialize the Ad Manager
 * Loads state from localStorage and initializes AdMob SDK on native platform
 */
export async function initialize(): Promise<void> {
  console.log('[AdManager] Initializing...');
  loadState();
  
  // Initialize AdMob on native platform
  if (isNative() && !isInitialized) {
    try {
      // Check GDPR consent before initializing ads
      const consentStatus = await checkGDPRConsent();
      if (consentStatus.required && !consentStatus.obtained) {
        console.log('[AdManager] GDPR consent required but not granted, showing consent form');
        const consentGranted = await showConsentForm();
        if (!consentGranted) {
          console.log('[AdManager] GDPR consent not granted, skipping AdMob initialization');
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
    }
  }
  
  console.log('[AdManager] Initialized:', {
    gamesPlayedSinceInterstitial,
    dailyRewardedCount,
    dailyRewardedDate,
    isNative: isNative(),
  });
}

/**
 * Show banner advertisement
 */
export async function showBanner(): Promise<void> {
  console.log('[AdManager] Showing banner ad');
  
  if (!isNative()) {
    console.log('[AdManager] Not on native platform, skipping banner');
    return;
  }
  
  // Prevent duplicate banner display
  if (isShowing) {
    console.log('[AdManager] Banner already showing, skipping');
    return;
  }
  
  try {
    // Wait for Activity to be ready before showing banner
    // This prevents NullPointerException when ViewGroup is not yet available
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Note: Safe area margin is handled by CSS env(safe-area-inset-bottom)
    // in the UI layer. AdMob banner will be positioned at BOTTOM_CENTER
    // and the UI will add padding to avoid overlap.
    const options: BannerAdOptions = {
      adId: AD_IDS.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };
    
    await AdMob.showBanner(options);
    isShowing = true;
    console.log('[AdManager] Banner ad shown successfully');
  } catch (error) {
    console.error('[AdManager] Failed to show banner:', error);
    isShowing = false;
    
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
    console.log('[AdManager] Banner ad hidden successfully');
  } catch (error) {
    console.error('[AdManager] Failed to hide banner:', error);
    isShowing = false; // Reset even on error
  }
}

/**
 * Record game end and show interstitial if needed
 * Shows interstitial after first game, then every 3 games (games 1, 4, 7, 10...)
 */
export function recordGameEnd(): void {
  gamesPlayedSinceInterstitial++;
  console.log('[AdManager] Game ended, count:', gamesPlayedSinceInterstitial);
  
  saveGameCount();
  
  // Show interstitial after first game, then every 3 games
  if (gamesPlayedSinceInterstitial === 1 || 
      (gamesPlayedSinceInterstitial > 1 && (gamesPlayedSinceInterstitial - 1) % 3 === 0)) {
    console.log('[AdManager] Triggering interstitial (game:', gamesPlayedSinceInterstitial, ')');
    gamesPlayedSinceInterstitial = 0;
    saveGameCount();
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
      return {
        success: false,
        error: 'Failed to load interstitial after retries'
      };
    }
    
    await AdMob.showInterstitial();
    console.log('[AdManager] Interstitial ad completed');
    
    return { success: true };
  } catch (error) {
    console.error('[AdManager] Failed to show interstitial:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Check if rewarded continue ad can be shown
 * Returns true if daily limit (3) not reached
 */
export function canShowRewardedContinue(): boolean {
  const canShow = dailyRewardedCount < 3;
  console.log('[AdManager] Can show rewarded continue:', canShow, `(${dailyRewardedCount}/3)`);
  return canShow;
}

/**
 * Show rewarded ad for continue feature
 */
export async function showRewardedContinue(): Promise<AdResult> {
  console.log('[AdManager] Showing rewarded ad: continue');
  
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
  
  try {
    await AdMob.prepareRewardVideoAd({
      adId: AD_IDS.rewarded,
    });
    
    // Set up reward listener
    const rewardPromise = new Promise<AdMobRewardItem>((resolve) => {
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        resolve(reward);
      });
    });
    
    await AdMob.showRewardVideoAd();
    await rewardPromise;
    
    // Update state
    dailyRewardedCount++;
    dailyRewardedDate = getTodayISO();
    saveDailyRewardedState();
    
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
  } catch (error) {
    console.error('[AdManager] Failed to show rewarded ad (continue):', error);
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
    await AdMob.prepareRewardVideoAd({
      adId: AD_IDS.rewarded,
    });
    
    // Set up reward listener
    const rewardPromise = new Promise<AdMobRewardItem>((resolve) => {
      AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        resolve(reward);
      });
    });
    
    await AdMob.showRewardVideoAd();
    await rewardPromise;
    
    console.log('[AdManager] Rewarded ad completed (streak shield)');
    
    return {
      success: true,
      reward: {
        type: 'shield',
        amount: 1,
      },
    };
  } catch (error) {
    console.error('[AdManager] Failed to show rewarded ad (streak shield):', error);
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
    return noAds === 'true';
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
