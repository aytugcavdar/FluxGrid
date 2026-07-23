// @ts-nocheck - AdMob API types are outdated, but code works fine at runtime
/**
 * Ad Manager - Advertisement Management Utility
 * 
 * Provides abstraction layer for advertisement display and reward management.
 * Integrates with Capacitor AdMob plugin for native ads.
 */

import {
  AdMob,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  type AdmobConsentInfo,
  type AdmobConsentRequestOptions,
  type AdMobError,
  type AdMobRewardItem,
} from '@capacitor-community/admob';
import { getTodayISO } from '../../../shared/store/streakStore';
import { fetchAndActivateAdConfig, getAdConfig as getFirebaseAdConfig, logAdEvent } from '../../../services/firebase/adConfig';
import type { AdConfig } from '../../../services/firebase/adConfig';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AdResult {
  success: boolean;
  reward?: {
    type: 'continue' | 'shield' | 'theme_trial';
    amount: number;
  };
  error?: string;
}

interface AdMobConfig {
  appId: string;
  testMode: boolean;
  testDeviceIds: string[];
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
  const isProductionAds = import.meta.env.VITE_ADMOB_BUILD_MODE === 'production';
  
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
  const testDeviceIds = (import.meta.env.VITE_ADMOB_TEST_DEVICE_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  
  // Production mode warnings
  if (isProductionAds) {
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
  if (!isProductionAds) {
    console.log('[AdManager] Using Ad Unit IDs:', {
      appId: appId === TEST_IDS.appId ? 'TEST' : 'CUSTOM',
      banner: bannerId === TEST_IDS.banner ? 'TEST' : 'CUSTOM',
      interstitial: interstitialId === TEST_IDS.interstitial ? 'TEST' : 'CUSTOM',
      rewarded: rewardedId === TEST_IDS.rewarded ? 'TEST' : 'CUSTOM',
    });
  }
  
  return {
    appId,
    testMode: !isProductionAds || [bannerId, interstitialId, rewardedId].every(id => id.includes('3940256099942544')),
    testDeviceIds,
    adUnits: {
      banner: bannerId,
      interstitial: interstitialId,
      rewarded: rewardedId,
    }
  };
};

const usesOfficialGoogleTestAdUnits = (config: AdMobConfig): boolean =>
  Object.values(config.adUnits).every(id =>
    id.startsWith('ca-app-pub-3940256099942544/')
  );

export const AD_IDS = getAdConfig().adUnits;

// ============================================================================
// localStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  gameCount: 'flux_ad_game_count',
  rewardedDaily: 'flux_ad_rewarded_daily',
  rewardedDate: 'flux_ad_rewarded_date',
  noAds: 'flux_no_ads',
  rewardedThemeTrialDate: 'flux_ad_rewarded_theme_trial_date',
} as const;

// ============================================================================
// State (Module-level)
// ============================================================================

let gamesPlayedSinceInterstitial = 0;
let dailyRewardedCount = 0;
let dailyRewardedDate = '';
let isInitialized = false;
let isInitializing = false; // Prevent concurrent initialization
let isShowing = false; // Prevent duplicate banner displays
let bannerDesiredVisible = false;
let bannerRequestInFlight = false;
let bannerNativeViewExists = false;
let bannerRetryAttempt = 0;
let bannerRetryTimer: ReturnType<typeof setTimeout> | null = null;
let bannerLoadedListener: any = null;
let bannerFailedToLoadListener: any = null;
let visibilityChangeListener: (() => void) | null = null; // Banner visibility listener
let rewardedAdListener: any = null; // Current rewarded ad listener handle
let remoteAdConfig: AdConfig | null = null; // Firebase Remote Config for ads
let isShowingRewardedAd = false; // Prevent concurrent rewarded ad displays
let rewardedContinueInFlight: Promise<AdResult> | null = null;
let adsRequestAllowed = false;
let privacyOptionsRequired = false;
let interstitialDisplayGuard: () => boolean = () => false;
let isShowingInterstitialAd = false;
let interstitialAttemptInFlight: Promise<AdResult> | null = null;
let lastRewardedAdFinishedAt = 0;
let interstitialAdListener: any = null;

const REWARDED_LOAD_TIMEOUT_MS = 15000;
const FULLSCREEN_AD_RESULT_TIMEOUT_MS = 120000;
const REWARDED_DISMISS_FALLBACK_MS = 4000;
const INTERSTITIAL_AFTER_REWARDED_COOLDOWN_MS = 30000;
const BANNER_RETRY_DELAYS_MS = [15000, 30000, 60000, 120000];

function getCurrentAdConfig(): AdConfig {
  return remoteAdConfig || getFirebaseAdConfig();
}

function removeAdListener(listener: any): void {
  try {
    if (listener && typeof listener.then === 'function') {
      listener
        .then((handle: any) => handle?.remove?.())
        .catch((error: unknown) => console.warn('[AdManager] Failed to remove async ad listener:', error));
      return;
    }
    listener?.remove?.();
  } catch (error) {
    console.warn('[AdManager] Failed to remove ad listener:', error);
  }
}

function clearBannerRetry(): void {
  if (bannerRetryTimer) {
    clearTimeout(bannerRetryTimer);
    bannerRetryTimer = null;
  }
}

function scheduleBannerRetry(): void {
  if (!bannerDesiredVisible || bannerRetryTimer) return;

  const delay = BANNER_RETRY_DELAYS_MS[
    Math.min(bannerRetryAttempt, BANNER_RETRY_DELAYS_MS.length - 1)
  ];
  bannerRetryAttempt = Math.min(
    bannerRetryAttempt + 1,
    BANNER_RETRY_DELAYS_MS.length - 1
  );

  console.log(`[AdManager] Retrying banner in ${delay}ms`);
  bannerRetryTimer = setTimeout(() => {
    bannerRetryTimer = null;
    if (bannerDesiredVisible) {
      void showBanner();
    }
  }, delay);
}

async function ensureBannerListeners(): Promise<void> {
  if (!bannerLoadedListener) {
    bannerLoadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      bannerNativeViewExists = true;
      isShowing = true;
      bannerRetryAttempt = 0;
      clearBannerRetry();

      if (!bannerDesiredVisible) return;

      console.log('[AdManager] Banner loaded successfully');
      window.dispatchEvent(new CustomEvent('fluxgrid-banner-shown', {
        detail: { height: 50 },
      }));
    });
  }

  if (!bannerFailedToLoadListener) {
    bannerFailedToLoadListener = await AdMob.addListener(
      BannerAdPluginEvents.FailedToLoad,
      (error: AdMobError) => {
        // The Android plugin destroys the native banner view after any load
        // failure, including an automatic refresh failure.
        bannerNativeViewExists = false;
        isShowing = false;
        console.error('[AdManager] Banner failed to load:', {
          code: error?.code,
          message: error?.message,
        });
        window.dispatchEvent(new CustomEvent('fluxgrid-banner-hidden', {
          detail: { height: 0, errorCode: error?.code },
        }));
        logAdEvent('ad_impression', {
          ad_type: 'banner',
          error_code: error?.code,
          error: error?.message || 'Banner failed to load',
          success: false,
        });
        scheduleBannerRetry();
      }
    );
  }
}

function ensureBannerVisibilityListener(): void {
  if (visibilityChangeListener) return;

  visibilityChangeListener = () => {
    if (document.hidden) {
      void hideBanner(true);
    } else {
      void showBanner();
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeListener);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function waitForRewardedAd(rewardType: 'continue' | 'shield' | 'theme_trial'): Promise<AdMobRewardItem> {
  if (rewardedAdListener) {
    console.log('[AdManager] Removing old listener');
    removeAdListener(rewardedAdListener);
    rewardedAdListener = null;
  }

  console.log('[AdManager] Loading rewarded ad...');
  await withTimeout(
    AdMob.prepareRewardVideoAd({ adId: AD_IDS.rewarded }),
    REWARDED_LOAD_TIMEOUT_MS,
    'Rewarded ad load timed out'
  );

  console.log('[AdManager] Rewarded ad loaded, showing...');

  let isSettled = false;
  let earnedReward: AdMobRewardItem | null = null;
  let dismissListener: any = null;
  let failedToShowListener: any = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let dismissFallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let resolveReward: (reward: AdMobRewardItem) => void = () => {};
  let rejectRewardPromise: (error: Error) => void = () => {};

  const rewardPromise = new Promise<AdMobRewardItem>((resolve, reject) => {
    resolveReward = resolve;
    rejectRewardPromise = reject;
  });

  const cleanup = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    if (dismissFallbackTimeout) clearTimeout(dismissFallbackTimeout);
    dismissFallbackTimeout = null;
    removeAdListener(rewardedAdListener);
    rewardedAdListener = null;
    removeAdListener(dismissListener);
    dismissListener = null;
    removeAdListener(failedToShowListener);
    failedToShowListener = null;
  };

  const rejectReward = (error: Error) => {
    if (isSettled) return;
    isSettled = true;
    cleanup();
    rejectRewardPromise(error);
  };

  try {
    // Capacitor listener registration is asynchronous. Finish registration
    // before showing the ad so fast native callbacks cannot be missed.
    rewardedAdListener = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      (reward: AdMobRewardItem) => {
        if (!isSettled) {
          earnedReward = reward;
          console.log('[AdManager] Rewarded event received:', reward);

          // Some Android ad creatives earn the reward but fail to emit the
          // dismissal callback. Never leave the game blocked after the SDK has
          // confirmed that the reward was earned.
          if (!dismissFallbackTimeout) {
            dismissFallbackTimeout = setTimeout(() => {
              if (isSettled || !earnedReward) return;

              console.warn(
                `[AdManager] Rewarded dismiss event missing; continuing after fallback (${rewardType})`
              );
              isSettled = true;
              const confirmedReward = earnedReward;
              cleanup();
              resolveReward(confirmedReward);
            }, REWARDED_DISMISS_FALLBACK_MS);
          }
        }
      }
    );

    dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      if (isSettled) return;

      if (earnedReward) {
        isSettled = true;
        const reward = earnedReward;
        cleanup();
        resolveReward(reward);
      } else {
        console.log(`[AdManager] Rewarded ad dismissed without reward (${rewardType})`);
        rejectReward(new Error('Rewarded ad dismissed without reward'));
      }
    });

    failedToShowListener = await AdMob.addListener(
      RewardAdPluginEvents.FailedToShow,
      (error: unknown) => {
        rejectReward(new Error(`Rewarded ad failed to show: ${String(error)}`));
      }
    );
  } catch (error) {
    rejectReward(error instanceof Error ? error : new Error(String(error)));
    return rewardPromise;
  }

  timeout = setTimeout(() => {
    if (!isSettled) {
      console.log(`[AdManager] Rewarded ad timeout (${rewardType})`);
      rejectReward(new Error('Rewarded ad timed out without reward'));
    }
  }, FULLSCREEN_AD_RESULT_TIMEOUT_MS);

  AdMob.showRewardVideoAd().catch((error: unknown) => {
    rejectReward(error instanceof Error ? error : new Error(String(error)));
  });
  console.log('[AdManager] showRewardVideoAd() called, waiting for reward and dismissal...');

  return rewardPromise;
}

async function waitForInterstitialDismissal(): Promise<void> {
  removeAdListener(interstitialAdListener);
  interstitialAdListener = null;

  let isSettled = false;
  let failedToShowListener: any = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let resolveDismissal: () => void = () => {};
  let rejectDismissal: (error: Error) => void = () => {};

  const dismissalPromise = new Promise<void>((resolve, reject) => {
    resolveDismissal = resolve;
    rejectDismissal = reject;
  });

  const cleanup = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    removeAdListener(interstitialAdListener);
    interstitialAdListener = null;
    removeAdListener(failedToShowListener);
    failedToShowListener = null;
  };

  const fail = (error: Error) => {
    if (isSettled) return;
    isSettled = true;
    cleanup();
    rejectDismissal(error);
  };

  try {
    interstitialAdListener = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      () => {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        resolveDismissal();
      }
    );

    failedToShowListener = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      (error: unknown) => {
        fail(new Error(`Interstitial ad failed to show: ${String(error)}`));
      }
    );
  } catch (error) {
    fail(error instanceof Error ? error : new Error(String(error)));
    return dismissalPromise;
  }

  timeout = setTimeout(() => {
    fail(new Error('Interstitial ad timed out before dismissal'));
  }, FULLSCREEN_AD_RESULT_TIMEOUT_MS);

  AdMob.showInterstitial().catch((error: unknown) => {
    fail(error instanceof Error ? error : new Error(String(error)));
  });

  return dismissalPromise;
}

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
 * Ad Retry Configuration
 */
interface AdRetryConfig {
  maxRetries: number;
  backoffMs: number[];
  currentRetry: number;
}

function getConsentRequestOptions(): AdmobConsentRequestOptions | undefined {
  if (import.meta.env.VITE_ADMOB_CONSENT_DEBUG !== 'true') return undefined;

  const geographyKey = String(import.meta.env.VITE_ADMOB_CONSENT_DEBUG_GEOGRAPHY || 'EEA').toUpperCase();
  const geographyByName: Record<string, AdmobConsentDebugGeography> = {
    EEA: AdmobConsentDebugGeography.EEA,
    US: AdmobConsentDebugGeography.US,
    OTHER: AdmobConsentDebugGeography.OTHER,
  };
  const testDeviceIdentifiers = (import.meta.env.VITE_ADMOB_CONSENT_TEST_DEVICE_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  return {
    debugGeography: geographyByName[geographyKey] ?? AdmobConsentDebugGeography.EEA,
    testDeviceIdentifiers,
  };
}

function notifyConsentState(): void {
  window.dispatchEvent(new CustomEvent('fluxgrid-ad-consent-updated', {
    detail: { canRequestAds: adsRequestAllowed, privacyOptionsRequired },
  }));
}

function updateConsentState(consentInfo: AdmobConsentInfo): void {
  adsRequestAllowed = consentInfo.canRequestAds === true;
  privacyOptionsRequired = consentInfo.privacyOptionsRequirementStatus === 'REQUIRED';
  notifyConsentState();
}

async function requestUMPConsent(): Promise<void> {
  let consentInfo = await AdMob.requestConsentInfo(getConsentRequestOptions());

  if (
    consentInfo.status === AdmobConsentStatus.REQUIRED &&
    consentInfo.isConsentFormAvailable
  ) {
    consentInfo = await AdMob.showConsentForm();
  }

  updateConsentState(consentInfo);
  console.log('[AdManager] UMP consent updated:', {
    status: consentInfo.status,
    canRequestAds: adsRequestAllowed,
    privacyOptionsRequired,
  });
}

export function canRequestAds(): boolean {
  return !isNative() || (isInitialized && adsRequestAllowed);
}

export function isPrivacyOptionsRequired(): boolean {
  return isNative() && privacyOptionsRequired;
}

export async function showPrivacyOptions(): Promise<boolean> {
  if (!isNative() || !privacyOptionsRequired) return false;

  try {
    await AdMob.showPrivacyOptionsForm();
    const consentInfo = await AdMob.requestConsentInfo(getConsentRequestOptions());
    updateConsentState(consentInfo);
    return true;
  } catch (error) {
    console.error('[AdManager] Failed to show privacy options:', error);
    return false;
  }
}

export function setInterstitialDisplayGuard(guard: () => boolean): () => void {
  interstitialDisplayGuard = guard;
  return () => {
    if (interstitialDisplayGuard === guard) interstitialDisplayGuard = () => false;
  };
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
      const config = getAdConfig();
      await AdMob.initialize({
        testingDevices: config.testDeviceIds,
        initializeForTesting: config.testDeviceIds.length > 0,
      });
      isInitialized = true;

      try {
        await requestUMPConsent();
      } catch (error) {
        // Official Google test units cannot generate revenue. Keep local QA usable
        // while still failing closed whenever real ad units are configured.
        adsRequestAllowed = usesOfficialGoogleTestAdUnits(config);
        privacyOptionsRequired = false;
        notifyConsentState();
        console.error(
          adsRequestAllowed
            ? '[AdManager] UMP consent update failed; official test ads remain enabled for QA:'
            : '[AdManager] UMP consent update failed; real ads disabled for this session:',
          error
        );
      }

      console.log('[AdManager] AdMob initialized successfully', {
        testMode: config.testMode,
        canRequestAds: adsRequestAllowed,
      });
    } else {
      isInitialized = true;
      adsRequestAllowed = true;
    }
    
    console.log('[AdManager] Initialized:', {
      gamesPlayedSinceInterstitial,
      dailyRewardedCount,
      dailyRewardedDate,
      isNative: isNative(),
      canRequestAds: canRequestAds(),
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

  if (!canRequestAds()) {
    console.log('[AdManager] Consent does not allow ad requests, skipping banner');
    return;
  }

  if (isNoAdsActive()) {
    console.log('[AdManager] No-ads active, skipping banner');
    return;
  }

  const config = getCurrentAdConfig();
  if (!config.banner_enabled) {
    console.log('[AdManager] Banner disabled by Remote Config');
    return;
  }

  bannerDesiredVisible = true;
  console.log('[AdManager] Banner enabled, proceeding...');
  
  // Prevent duplicate banner display
  if (isShowing || bannerRequestInFlight) {
    console.log('[AdManager] Banner already showing or loading');
    return;
  }

  clearBannerRetry();
  bannerRequestInFlight = true;

  try {
    console.log('[AdManager] Waiting for Activity...');
    await ensureBannerListeners();

    // Wait for Activity to be ready before showing banner
    // This prevents NullPointerException when ViewGroup is not yet available
    // Increased from 500ms to 2000ms to ensure full initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!bannerDesiredVisible || !canRequestAds() || isNoAdsActive()) {
      console.log('[AdManager] Banner request cancelled before native display');
      return;
    }

    if (bannerNativeViewExists) {
      console.log('[AdManager] Resuming existing native banner...');
      await AdMob.resumeBanner();
      isShowing = true;
      bannerRetryAttempt = 0;
      window.dispatchEvent(new CustomEvent('fluxgrid-banner-shown', {
        detail: { height: 50 },
      }));
      ensureBannerVisibilityListener();
      return;
    }
    
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
    
    // Treat this as an in-flight display guard. FailedToLoad resets it so a
    // later app resume can retry without creating a tight polling loop.
    isShowing = true;
    await AdMob.showBanner(options);
    bannerNativeViewExists = true;
    
    console.log('[AdManager] Banner request submitted');
    
    // Log analytics event
    logAdEvent('ad_impression', { ad_type: 'banner' });
    
    ensureBannerVisibilityListener();
    
  } catch (error) {
    console.error('[AdManager] Failed to show banner:', error);
    bannerNativeViewExists = false;
    isShowing = false;
    scheduleBannerRetry();
    
    // Log analytics event for failure
    logAdEvent('ad_impression', { 
      ad_type: 'banner',
      error: String(error),
      success: false
    });
    
    // Don't throw error - gracefully degrade if banner fails
    // This prevents app crash if AdMob has issues
  } finally {
    bannerRequestInFlight = false;
  }
}

/**
 * Hide banner advertisement
 */
export async function hideBanner(preserveDesiredState = false): Promise<void> {
  console.log('[AdManager] Hiding banner ad');

  clearBannerRetry();
  if (!preserveDesiredState) {
    bannerDesiredVisible = false;
    bannerRetryAttempt = 0;
  }
  isShowing = false;
  
  if (!isNative()) {
    return;
  }
  
  try {
    if (bannerNativeViewExists) {
      await AdMob.hideBanner();
    }
    
    // Remove visibility change listener
    if (!preserveDesiredState && visibilityChangeListener) {
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

  if (isNoAdsActive()) {
    console.log('[AdManager] No-ads active, skipping interstitial');
    return;
  }

  const config = getCurrentAdConfig();
  if (!config.interstitial_enabled) {
    console.log('[AdManager] Interstitial disabled by Remote Config');
    return;
  }

  const frequency = Math.max(1, Math.floor(config.interstitial_frequency || 0));
  
  // Keep the threshold pending until an ad is actually shown. A rewarded-ad
  // cooldown, no-fill, or a temporary lifecycle guard must not consume it.
  if (gamesPlayedSinceInterstitial >= frequency && !interstitialAttemptInFlight) {
    console.log('[AdManager] Triggering interstitial (game:', gamesPlayedSinceInterstitial, ', frequency:', frequency, ')');
    const attempt = showInterstitial();
    interstitialAttemptInFlight = attempt;
    void attempt.then(result => {
      if (result.success) {
        gamesPlayedSinceInterstitial = 0;
        saveGameCount();
      }
    }).finally(() => {
      if (interstitialAttemptInFlight === attempt) {
        interstitialAttemptInFlight = null;
      }
    });
  }
}

/**
 * Load interstitial with retry logic
 * Implements exponential backoff: 1s, 2s, 4s, 8s (max)
 */
async function loadInterstitialWithRetry(config: AdRetryConfig = { maxRetries: 3, backoffMs: [1000, 2000, 4000, 8000], currentRetry: 0 }): Promise<boolean> {
  if (!interstitialDisplayGuard()) return false;

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

      if (!interstitialDisplayGuard()) return false;
      
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

  if (!canRequestAds()) {
    return { success: false, error: 'Ad requests not allowed by consent' };
  }

  if (!interstitialDisplayGuard()) {
    return { success: false, error: 'Interstitial no longer at a natural pause' };
  }

  if (isShowingRewardedAd || isShowingInterstitialAd) {
    return { success: false, error: 'Another fullscreen ad is active' };
  }

  if (Date.now() - lastRewardedAdFinishedAt < INTERSTITIAL_AFTER_REWARDED_COOLDOWN_MS) {
    console.log('[AdManager] Interstitial skipped after rewarded ad');
    return { success: false, error: 'Rewarded ad cooldown active' };
  }

  if (isNoAdsActive()) {
    console.log('[AdManager] No-ads active, skipping interstitial');
    return { success: false, error: 'No-ads active' };
  }

  const config = getCurrentAdConfig();
  if (!config.interstitial_enabled) {
    console.log('[AdManager] Interstitial disabled by Remote Config');
    return { success: false, error: 'Interstitial disabled' };
  }
  
  if (!isNative()) {
    console.log('[AdManager] Not on native platform, using mock delay');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('[AdManager] Mock interstitial completed');
        resolve({ success: true });
      }, 500);
    });
  }
  
  isShowingInterstitialAd = true;

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

    if (!interstitialDisplayGuard()) {
      console.log('[AdManager] Interstitial cancelled because gameplay resumed');
      return { success: false, error: 'Gameplay resumed before interstitial display' };
    }
    
    await waitForInterstitialDismissal();
    
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
  } finally {
    removeAdListener(interstitialAdListener);
    interstitialAdListener = null;
    isShowingInterstitialAd = false;
  }
}

/**
 * Check if rewarded continue ad can be shown
 * Returns true if daily limit (from Remote Config, default: 3) not reached
 */
export function canShowRewardedContinue(): boolean {
  const config = getCurrentAdConfig();
  const dailyLimit = Math.max(0, Math.floor(config.rewarded_daily_limit || 0));
  
  const canShow =
    canRequestAds() &&
    config.rewarded_enabled &&
    !isShowingRewardedAd &&
    !isShowingInterstitialAd &&
    dailyRewardedCount < dailyLimit;
  console.log('[AdManager] Can show rewarded continue:', canShow, `(${dailyRewardedCount}/${dailyLimit})`);
  return canShow;
}

export function getRewardedContinueRemaining(): number {
  const config = getCurrentAdConfig();
  if (!canRequestAds() || !config.rewarded_enabled) return 0;
  return Math.max(0, Math.floor(config.rewarded_daily_limit || 0) - dailyRewardedCount);
}

/**
 * Show rewarded ad for continue feature
 */
async function performRewardedContinue(): Promise<AdResult> {
  console.log('[AdManager] showRewardedContinue() called');

  if (!canShowRewardedContinue()) {
    return {
      success: false,
      error: 'Rewarded continue unavailable',
    };
  }
  
  // CRITICAL: Prevent concurrent ad displays
  if (isShowingRewardedAd || isShowingInterstitialAd) {
    console.log('[AdManager] Another fullscreen ad is active, ignoring rewarded call');
    return {
      success: false,
      error: 'Another fullscreen ad is active'
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

    logAdEvent('ad_rewarded_show', { 
      reward_type: 'continue',
      daily_count: dailyRewardedCount
    });

    await waitForRewardedAd('continue');
    console.log('[AdManager] Reward promise resolved!');

    dailyRewardedCount++;
    dailyRewardedDate = getTodayISO();
    saveDailyRewardedState();

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
  } catch (error) {
    console.error('[AdManager] Failed to show rewarded ad (continue):', error);
    
    // Log analytics event for skip/failure
    logAdEvent('ad_rewarded_skip', { 
      reward_type: 'continue',
      error: String(error)
    });
    
    return {
      success: false,
      error: String(error),
    };
  } finally {
    lastRewardedAdFinishedAt = Date.now();
    removeAdListener(rewardedAdListener);
    rewardedAdListener = null;
    isShowingRewardedAd = false;
  }
}

export function showRewardedContinue(): Promise<AdResult> {
  if (rewardedContinueInFlight) {
    console.log('[AdManager] Reusing active rewarded continue request');
    return rewardedContinueInFlight;
  }

  const request = performRewardedContinue();
  rewardedContinueInFlight = request;
  void request.finally(() => {
    if (rewardedContinueInFlight === request) {
      rewardedContinueInFlight = null;
    }
  });
  return request;
}

/**
 * Show rewarded ad for streak shield
 */
export async function showRewardedStreakShield(): Promise<AdResult> {
  console.log('[AdManager] Showing rewarded ad: streak shield');

  if (!canRequestAds()) {
    return { success: false, error: 'Ad requests not allowed by consent' };
  }

  if (!getCurrentAdConfig().rewarded_enabled) {
    return {
      success: false,
      error: 'Rewarded ads disabled',
    };
  }

  // CRITICAL: Prevent concurrent ad displays
  if (isShowingRewardedAd || isShowingInterstitialAd) {
    console.log('[AdManager] Another fullscreen ad is active, ignoring rewarded call');
    return {
      success: false,
      error: 'Another fullscreen ad is active',
    };
  }

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

  isShowingRewardedAd = true;

  try {
    logAdEvent('ad_rewarded_show', {
      reward_type: 'shield',
    });

    await waitForRewardedAd('shield');

    logAdEvent('ad_rewarded_complete', {
      reward_type: 'shield',
    });

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

    logAdEvent('ad_rewarded_skip', {
      reward_type: 'shield',
      error: String(error),
    });

    return {
      success: false,
      error: String(error),
    };
  } finally {
    lastRewardedAdFinishedAt = Date.now();
    removeAdListener(rewardedAdListener);
    rewardedAdListener = null;
    isShowingRewardedAd = false;
  }
}

export function canShowRewardedThemeTrial(): boolean {
  if (!canRequestAds()) return false;
  if (!getCurrentAdConfig().rewarded_enabled) return false;

  try {
    return localStorage.getItem(STORAGE_KEYS.rewardedThemeTrialDate) !== getTodayISO();
  } catch (error) {
    console.warn('[AdManager] Failed to read theme trial reward state:', error);
    return false;
  }
}

export async function showRewardedThemeTrial(): Promise<AdResult> {
  if (!canShowRewardedThemeTrial()) {
    return { success: false, error: 'Theme trial reward unavailable today' };
  }

  if (isShowingRewardedAd || isShowingInterstitialAd) {
    return { success: false, error: 'Another fullscreen ad is active' };
  }

  const completeReward = (): AdResult => {
    localStorage.setItem(STORAGE_KEYS.rewardedThemeTrialDate, getTodayISO());
    return {
      success: true,
      reward: { type: 'theme_trial', amount: 24 },
    };
  };

  if (!isNative()) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(completeReward()), 1000);
    });
  }

  isShowingRewardedAd = true;

  try {
    logAdEvent('ad_rewarded_show', { reward_type: 'theme_trial' });
    await waitForRewardedAd('theme_trial');
    const result = completeReward();
    logAdEvent('ad_rewarded_complete', { reward_type: 'theme_trial' });
    return result;
  } catch (error) {
    logAdEvent('ad_rewarded_skip', {
      reward_type: 'theme_trial',
      error: String(error),
    });
    return { success: false, error: String(error) };
  } finally {
    lastRewardedAdFinishedAt = Date.now();
    removeAdListener(rewardedAdListener);
    rewardedAdListener = null;
    isShowingRewardedAd = false;
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
    const config = getCurrentAdConfig();
    const gracePeriodGames = Math.max(0, Math.floor(config.ad_free_grace_period_games || 0));
    
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

function resetForTests(): void {
  gamesPlayedSinceInterstitial = 0;
  dailyRewardedCount = 0;
  dailyRewardedDate = '';
  isInitialized = false;
  isInitializing = false;
  isShowing = false;
  bannerDesiredVisible = false;
  bannerRequestInFlight = false;
  bannerNativeViewExists = false;
  bannerRetryAttempt = 0;
  clearBannerRetry();
  isShowingRewardedAd = false;
  rewardedContinueInFlight = null;
  isShowingInterstitialAd = false;
  interstitialAttemptInFlight = null;
  lastRewardedAdFinishedAt = 0;
  adsRequestAllowed = false;
  privacyOptionsRequired = false;
  remoteAdConfig = null;
  interstitialDisplayGuard = () => true;
  removeAdListener(rewardedAdListener);
  rewardedAdListener = null;
  removeAdListener(interstitialAdListener);
  interstitialAdListener = null;
  removeAdListener(bannerLoadedListener);
  bannerLoadedListener = null;
  removeAdListener(bannerFailedToLoadListener);
  bannerFailedToLoadListener = null;

  if (visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener);
    visibilityChangeListener = null;
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
  getRewardedContinueRemaining,
  showRewardedContinue,
  showRewardedStreakShield,
  canShowRewardedThemeTrial,
  showRewardedThemeTrial,
  canRequestAds,
  isPrivacyOptionsRequired,
  showPrivacyOptions,
  setInterstitialDisplayGuard,
  isNoAdsActive,
  activateNoAds,
  AD_IDS,
  _resetForTests: resetForTests,
};
