/**
 * Ad Manager - Advertisement Management Utility
 * 
 * Provides abstraction layer for advertisement display and reward management.
 * Uses mock implementations with setTimeout for development and testing.
 * 
 * TODO: Replace mock implementations with Admob SDK integration
 */

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

// ============================================================================
// Configuration
// ============================================================================

// TODO: Replace with actual Admob ad unit IDs from environment variables
export const AD_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111', // Test banner ID
  interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial ID
  rewarded: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded ID
};

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
 * Initialize the Ad Manager
 * Loads state from localStorage and resets daily counters if needed
 */
export function initialize(): void {
  console.log('[AdManager] Initializing...');
  loadState();
  console.log('[AdManager] Initialized:', {
    gamesPlayedSinceInterstitial,
    dailyRewardedCount,
    dailyRewardedDate,
  });
}

/**
 * Show banner advertisement
 * TODO: Replace with Admob SDK call
 */
export function showBanner(): void {
  console.log('[AdManager] Showing banner ad');
  // TODO: AdMob.showBanner(AD_IDS.banner);
}

/**
 * Hide banner advertisement
 * TODO: Replace with Admob SDK call
 */
export function hideBanner(): void {
  console.log('[AdManager] Hiding banner ad');
  // TODO: AdMob.hideBanner();
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
 * Mock implementation with 500ms delay
 * TODO: Replace with Admob SDK call
 */
export async function showInterstitial(): Promise<AdResult> {
  console.log('[AdManager] Showing interstitial ad');
  
  // TODO: Replace with actual Admob SDK call
  // await AdMob.showInterstitial(AD_IDS.interstitial);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[AdManager] Interstitial ad completed');
      resolve({
        success: true,
      });
    }, 500);
  });
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
 * Mock implementation with 1000ms delay
 * TODO: Replace with Admob SDK call
 */
export async function showRewardedContinue(): Promise<AdResult> {
  console.log('[AdManager] Showing rewarded ad: continue');
  
  // TODO: Replace with actual Admob SDK call
  // await AdMob.showRewardedAd(AD_IDS.rewarded);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      dailyRewardedCount++;
      dailyRewardedDate = getTodayISO();
      saveDailyRewardedState();
      
      console.log('[AdManager] Rewarded ad completed (continue):', {
        dailyRewardedCount,
        dailyRewardedDate,
      });
      
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

/**
 * Show rewarded ad for streak shield
 * Mock implementation with 1000ms delay
 * TODO: Replace with Admob SDK call
 */
export async function showRewardedStreakShield(): Promise<AdResult> {
  console.log('[AdManager] Showing rewarded ad: streak shield');
  
  // TODO: Replace with actual Admob SDK call
  // await AdMob.showRewardedAd(AD_IDS.rewarded);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[AdManager] Rewarded ad completed (streak shield)');
      
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
