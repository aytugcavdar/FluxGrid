import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const adMobMocks = vi.hoisted(() => ({
  listeners: new Map<string, (payload?: any) => void>(),
  initialize: vi.fn(),
  requestConsentInfo: vi.fn(),
  showConsentForm: vi.fn(),
  showPrivacyOptionsForm: vi.fn(),
  prepareRewardVideoAd: vi.fn(),
  showRewardVideoAd: vi.fn(),
  prepareInterstitial: vi.fn(),
  showInterstitial: vi.fn(),
  showBanner: vi.fn(),
  hideBanner: vi.fn(),
  resumeBanner: vi.fn(),
  addListener: vi.fn(),
}));

vi.mock('@capacitor-community/admob', () => ({
  AdMob: adMobMocks,
  AdmobConsentDebugGeography: { DISABLED: 0, EEA: 1, US: 3, OTHER: 4 },
  AdmobConsentStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    OBTAINED: 'OBTAINED',
    REQUIRED: 'REQUIRED',
    UNKNOWN: 'UNKNOWN',
  },
  BannerAdPosition: { BOTTOM_CENTER: 'BOTTOM_CENTER' },
  BannerAdSize: { ADAPTIVE_BANNER: 'ADAPTIVE_BANNER' },
  BannerAdPluginEvents: {
    Loaded: 'bannerAdLoaded',
    FailedToLoad: 'bannerAdFailedToLoad',
  },
  InterstitialAdPluginEvents: {
    Dismissed: 'interstitialAdDismissed',
    FailedToShow: 'interstitialAdFailedToShow',
  },
  PrivacyOptionsRequirementStatus: {
    NOT_REQUIRED: 'NOT_REQUIRED',
    REQUIRED: 'REQUIRED',
    UNKNOWN: 'UNKNOWN',
  },
  RewardAdPluginEvents: {
    Rewarded: 'onRewardedVideoAdReward',
    Dismissed: 'onRewardedVideoAdDismissed',
    FailedToShow: 'onRewardedVideoAdFailedToShow',
  },
}));

const adConfig = {
  interstitial_frequency: 3,
  rewarded_daily_limit: 3,
  banner_enabled: true,
  interstitial_enabled: true,
  rewarded_enabled: true,
  ad_free_grace_period_games: 0,
};

vi.mock('../../../services/firebase/adConfig', () => ({
  fetchAndActivateAdConfig: vi.fn(async () => adConfig),
  getAdConfig: vi.fn(() => adConfig),
  logAdEvent: vi.fn(),
}));

describe('AdManager native safety', () => {
  let AdManager: typeof import('./AdManager').AdManager;

  beforeEach(async () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
    adMobMocks.listeners.clear();
    (window as any).Capacitor = { isNativePlatform: () => true };

    adMobMocks.initialize.mockResolvedValue(undefined);
    adMobMocks.requestConsentInfo.mockResolvedValue({
      status: 'NOT_REQUIRED',
      isConsentFormAvailable: false,
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'NOT_REQUIRED',
    });
    adMobMocks.showConsentForm.mockResolvedValue({
      status: 'OBTAINED',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    });
    adMobMocks.prepareRewardVideoAd.mockResolvedValue({ adUnitId: 'test' });
    adMobMocks.showRewardVideoAd.mockResolvedValue({ type: '', amount: 0 });
    adMobMocks.prepareInterstitial.mockResolvedValue({ adUnitId: 'test' });
    adMobMocks.showInterstitial.mockResolvedValue(undefined);
    adMobMocks.addListener.mockImplementation((event: string, callback: (payload?: any) => void) => {
      adMobMocks.listeners.set(event, callback);
      return {
        remove: () => adMobMocks.listeners.delete(event),
      };
    });

    ({ AdManager } = await import('./AdManager'));
    AdManager._resetForTests();
    await AdManager.initialize();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (window as any).Capacitor;
  });

  it('uses the UMP form when consent is required', async () => {
    AdManager._resetForTests();
    adMobMocks.requestConsentInfo.mockResolvedValueOnce({
      status: 'REQUIRED',
      isConsentFormAvailable: true,
      canRequestAds: false,
      privacyOptionsRequirementStatus: 'REQUIRED',
    });

    await AdManager.initialize();

    expect(adMobMocks.showConsentForm).toHaveBeenCalledTimes(1);
    expect(AdManager.canRequestAds()).toBe(true);
    expect(AdManager.isPrivacyOptionsRequired()).toBe(true);
  });

  it('keeps official Google test ads available when UMP is not configured', async () => {
    AdManager._resetForTests();
    adMobMocks.requestConsentInfo.mockRejectedValueOnce(
      new Error('Publisher misconfiguration')
    );

    await AdManager.initialize();

    expect(AdManager.canRequestAds()).toBe(true);
  });

  it('allows a banner retry after a native load failure', async () => {
    vi.useFakeTimers();

    const firstRequest = AdManager.showBanner();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('bannerAdFailedToLoad')).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(2000);
    await firstRequest;
    expect(adMobMocks.showBanner).toHaveBeenCalledTimes(1);

    adMobMocks.listeners.get('bannerAdFailedToLoad')?.({
      code: 2,
      message: 'Network error',
    });

    const retryRequest = AdManager.showBanner();
    await vi.advanceTimersByTimeAsync(2000);
    await retryRequest;
    expect(adMobMocks.showBanner).toHaveBeenCalledTimes(2);
  });

  it('automatically recreates a banner destroyed by a refresh failure', async () => {
    vi.useFakeTimers();

    const firstRequest = AdManager.showBanner();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('bannerAdFailedToLoad')).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(2000);
    await firstRequest;

    adMobMocks.listeners.get('bannerAdFailedToLoad')?.({
      code: 3,
      message: 'No fill during refresh',
    });

    await vi.advanceTimersByTimeAsync(15000);
    await vi.advanceTimersByTimeAsync(2000);

    expect(adMobMocks.showBanner).toHaveBeenCalledTimes(2);
  });

  it('resumes a hidden native banner instead of reloading it', async () => {
    vi.useFakeTimers();

    const firstRequest = AdManager.showBanner();
    await vi.advanceTimersByTimeAsync(2000);
    await firstRequest;
    await AdManager.hideBanner();

    const resumeRequest = AdManager.showBanner();
    await vi.advanceTimersByTimeAsync(2000);
    await resumeRequest;

    expect(adMobMocks.showBanner).toHaveBeenCalledTimes(1);
    expect(adMobMocks.resumeBanner).toHaveBeenCalledTimes(1);
  });

  it('does not grant continue when the rewarded ad is dismissed early', async () => {
    const resultPromise = AdManager.showRewardedContinue();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('onRewardedVideoAdDismissed')).toBe(true);
    });

    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBeNull();
  });

  it('grants continue only after the reward is earned and the ad is dismissed', async () => {
    const resultPromise = AdManager.showRewardedContinue();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('onRewardedVideoAdReward')).toBe(true);
    });

    let settled = false;
    resultPromise.finally(() => {
      settled = true;
    });
    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    await Promise.resolve();

    expect(settled).toBe(false);
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBeNull();

    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    const result = await resultPromise;

    expect(result).toMatchObject({ success: true, reward: { type: 'continue', amount: 1 } });
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBe('1');
  });

  it('does not stay blocked when reward is earned but dismissal is not emitted', async () => {
    vi.useFakeTimers();
    const resultPromise = AdManager.showRewardedContinue();
    await vi.advanceTimersByTimeAsync(0);

    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    await vi.advanceTimersByTimeAsync(3999);
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await expect(resultPromise).resolves.toMatchObject({
      success: true,
      reward: { type: 'continue', amount: 1 },
    });
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBe('1');
  });

  it('coalesces simultaneous continue requests into one native rewarded ad', async () => {
    const firstResult = AdManager.showRewardedContinue();
    const secondResult = AdManager.showRewardedContinue();

    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('onRewardedVideoAdReward')).toBe(true);
    });
    expect(adMobMocks.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
    expect(adMobMocks.showRewardVideoAd).toHaveBeenCalledTimes(1);

    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();

    await expect(firstResult).resolves.toMatchObject({ success: true });
    await expect(secondResult).resolves.toMatchObject({ success: true });
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBe('1');
  });

  it('registers rewarded listeners before showing the native ad', async () => {
    let finishFirstRegistration: (() => void) | undefined;
    adMobMocks.addListener.mockImplementationOnce(
      (event: string, callback: (payload?: any) => void) => {
        adMobMocks.listeners.set(event, callback);
        return new Promise(resolve => {
          finishFirstRegistration = () => resolve({
            remove: () => adMobMocks.listeners.delete(event),
          });
        });
      }
    );

    const resultPromise = AdManager.showRewardedContinue();
    await vi.waitFor(() => {
      expect(adMobMocks.addListener).toHaveBeenCalledTimes(1);
    });
    expect(adMobMocks.showRewardVideoAd).not.toHaveBeenCalled();

    finishFirstRegistration?.();
    await vi.waitFor(() => {
      expect(adMobMocks.showRewardVideoAd).toHaveBeenCalledTimes(1);
    });

    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    await expect(resultPromise).resolves.toMatchObject({ success: true });
  });

  it('does not fail a normal rewarded ad after ten seconds', async () => {
    vi.useFakeTimers();
    const resultPromise = AdManager.showRewardedContinue();
    await vi.advanceTimersByTimeAsync(15000);

    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();

    await expect(resultPromise).resolves.toMatchObject({ success: true });
  });

  it('fails safely when rewarded loading never completes', async () => {
    vi.useFakeTimers();
    adMobMocks.prepareRewardVideoAd.mockReturnValue(new Promise(() => {}));

    const resultPromise = AdManager.showRewardedContinue();
    await vi.advanceTimersByTimeAsync(15000);
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('load timed out');
    expect(localStorage.getItem('flux_ad_rewarded_daily')).toBeNull();
  });

  it('cancels an interstitial when gameplay resumes during loading', async () => {
    let naturalPause = true;
    let finishLoading: ((value: { adUnitId: string }) => void) | undefined;
    adMobMocks.prepareInterstitial.mockReturnValue(new Promise(resolve => {
      finishLoading = resolve;
    }));
    AdManager.setInterstitialDisplayGuard(() => naturalPause);

    const resultPromise = AdManager.showInterstitial();
    await Promise.resolve();
    naturalPause = false;
    finishLoading?.({ adUnitId: 'test' });
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('Gameplay resumed');
    expect(adMobMocks.showInterstitial).not.toHaveBeenCalled();
  });

  it('keeps interstitials blocked after the game screen unmounts', async () => {
    const removeGuard = AdManager.setInterstitialDisplayGuard(() => true);
    removeGuard();

    const result = await AdManager.showInterstitial();

    expect(result.success).toBe(false);
    expect(result.error).toContain('natural pause');
    expect(adMobMocks.prepareInterstitial).not.toHaveBeenCalled();
  });

  it('completes an interstitial only after it is dismissed', async () => {
    AdManager.setInterstitialDisplayGuard(() => true);
    const resultPromise = AdManager.showInterstitial();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('interstitialAdDismissed')).toBe(true);
    });

    let settled = false;
    resultPromise.finally(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    adMobMocks.listeners.get('interstitialAdDismissed')?.();
    await expect(resultPromise).resolves.toEqual({ success: true });
  });

  it('does not stack an interstitial immediately after a rewarded ad', async () => {
    const rewardedPromise = AdManager.showRewardedContinue();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('onRewardedVideoAdReward')).toBe(true);
    });
    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    await rewardedPromise;

    AdManager.setInterstitialDisplayGuard(() => true);
    const result = await AdManager.showInterstitial();

    expect(result.success).toBe(false);
    expect(result.error).toContain('cooldown');
    expect(adMobMocks.prepareInterstitial).not.toHaveBeenCalled();
  });

  it('retains the game threshold when an interstitial is blocked by rewarded cooldown', async () => {
    vi.useFakeTimers();
    const rewardedPromise = AdManager.showRewardedContinue();
    await vi.advanceTimersByTimeAsync(0);
    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    await rewardedPromise;

    AdManager.setInterstitialDisplayGuard(() => true);
    AdManager.recordGameEnd();
    AdManager.recordGameEnd();
    AdManager.recordGameEnd();
    await vi.advanceTimersByTimeAsync(0);

    expect(adMobMocks.prepareInterstitial).not.toHaveBeenCalled();
    expect(localStorage.getItem('flux_ad_game_count')).toBe('3');

    await vi.advanceTimersByTimeAsync(31000);
    AdManager.recordGameEnd();
    await vi.advanceTimersByTimeAsync(0);

    expect(adMobMocks.prepareInterstitial).toHaveBeenCalledTimes(1);
    adMobMocks.listeners.get('interstitialAdDismissed')?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(localStorage.getItem('flux_ad_game_count')).toBe('0');
  });

  it('resets the game threshold only after an interstitial is dismissed', async () => {
    AdManager.setInterstitialDisplayGuard(() => true);
    AdManager.recordGameEnd();
    AdManager.recordGameEnd();
    AdManager.recordGameEnd();

    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('interstitialAdDismissed')).toBe(true);
    });
    expect(localStorage.getItem('flux_ad_game_count')).toBe('3');

    adMobMocks.listeners.get('interstitialAdDismissed')?.();
    await vi.waitFor(() => {
      expect(localStorage.getItem('flux_ad_game_count')).toBe('0');
    });
  });

  it('blocks an interstitial while a rewarded ad is still active', async () => {
    const rewardedPromise = AdManager.showRewardedContinue();
    await vi.waitFor(() => {
      expect(adMobMocks.listeners.has('onRewardedVideoAdReward')).toBe(true);
    });

    AdManager.setInterstitialDisplayGuard(() => true);
    const interstitialResult = await AdManager.showInterstitial();

    expect(interstitialResult.success).toBe(false);
    expect(interstitialResult.error).toContain('fullscreen ad');
    expect(adMobMocks.prepareInterstitial).not.toHaveBeenCalled();

    adMobMocks.listeners.get('onRewardedVideoAdReward')?.({ type: 'continue', amount: 1 });
    adMobMocks.listeners.get('onRewardedVideoAdDismissed')?.();
    await rewardedPromise;
  });

  it('does not show an interstitial when a rewarded attempt fails', async () => {
    adMobMocks.prepareRewardVideoAd.mockRejectedValueOnce(new Error('No fill'));

    const rewardedResult = await AdManager.showRewardedContinue();
    expect(rewardedResult.success).toBe(false);

    AdManager.setInterstitialDisplayGuard(() => true);
    const interstitialResult = await AdManager.showInterstitial();

    expect(interstitialResult.success).toBe(false);
    expect(interstitialResult.error).toContain('cooldown');
    expect(adMobMocks.prepareInterstitial).not.toHaveBeenCalled();
  });
});
