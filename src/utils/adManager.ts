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
 * Get AdMob configuration based on build mode
 * Uses test IDs in development, production IDs in production
 */
const getAdConfig = (): AdMobConfig => {
  const isProduction = import.meta.env.PROD;
  
  return {
    appId: isProduction 
      ? 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY'  // TODO: Replace with production App ID
      : 'ca-app-pub-3940256099942544~3347511713', // Test App ID
    testMode: !isProduction,
    adUnits: {
      banner: isProduction 
        ? 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID'  // TODO: Replace with production banner ID
        : 'ca-app-pub-3940256099942544/6300978111', // Test banner ID
      interstitial: isProduction 
        ? 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID'  // TODO: Replace with production interstitial ID
        : 'ca-app-pub-3940256099942544/1033173712', // Test interstitial ID
      rewarded: isProduction 
        ? 'ca-app-pub-XXXXXXXXXXXXXXXX/REWARDED_ID'  // TODO: Replace with production rewarded ID
        : 'ca-app-pub-3940256099942544/5224354917', // Test rewarded ID
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
 * Initialize the Ad Manager
 * Loads state from localStorage and initializes AdMob SDK on native platform
 */
export async function initialize(): Promise<void> {
  console.log('[AdManager] Initializing...');
  loadState();
  
  // Initialize AdMob on native platform
  if (isNative() && !isInitialized) {
    try {
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
  
  try {
    const options: BannerAdOptions = {
      adId: AD_IDS.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };
    
    await AdMob.showBanner(options);
    console.log('[AdManager] Banner ad shown successfully');
  } catch (error) {
    console.error('[AdManager] Failed to show banner:', error);
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
    console.log('[AdManager] Banner ad hidden successfully');
  } catch (error) {
    console.error('[AdManager] Failed to hide banner:', error);
  }
}

/**
 * Record game end and show interstitial if needed
 * Shows interstitial every 4 games
 */
export function recordGameEnd(): void {
  gamesPlayedSinceInterstitial++;
  console.log('[AdManager] Game ended, count:', gamesPlayedSinceInterstitial);
  
  saveGameCount();
  
  // Show interstitial every 4 games
  if (gamesPlayedSinceInterstitial % 4 === 0) {
    console.log('[AdManager] Triggering interstitial (every 4 games)');
    gamesPlayedSinceInterstitial = 0;
    saveGameCount();
    showInterstitial();
  }
}

/**
 * Show interstitial advertisement
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
    await AdMob.prepareInterstitial({
      adId: AD_IDS.interstitial,
    });
    
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
