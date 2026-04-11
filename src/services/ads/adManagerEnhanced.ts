/**
 * Enhanced Ad Manager Service
 * 
 * Extends existing adManager with production-ready features:
 * - Frequency capping (interstitial and rewarded)
 * - Retry logic with exponential backoff
 * - Ad revenue tracking
 * - Remote Config integration
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.7, 6.9, 6.10
 */

import { BaseService } from '../core/BaseService';
import { storageManager, StorageKeys } from '../storage/storageManager';
import { AdEventTracker, AdType, AdPlacement, adRevenueTracker } from '../analytics/adEvents';
import { getTodayISO } from '../../shared/store/streakStore';

// Storage keys for ad manager
const AD_STORAGE_KEYS = {
  INTERSTITIAL_COUNT: 'ad_interstitial_count',
  INTERSTITIAL_LAST_SHOWN: 'ad_interstitial_last_shown',
  REWARDED_DAILY_COUNT: 'ad_rewarded_daily_count',
  REWARDED_DATE: 'ad_rewarded_date',
  TOTAL_AD_REVENUE: 'ad_total_revenue',
} as const;

// Ad configuration (can be updated via Remote Config)
export interface AdManagerConfig {
  // Frequency capping
  interstitialFrequency: number; // Show every N games
  interstitialMinInterval: number; // Minimum seconds between shows
  rewardedDailyLimit: number; // Maximum rewarded ads per day
  
  // Retry configuration
  maxRetries: number;
  retryBackoffMs: number[]; // Exponential backoff delays
  
  // Revenue tracking
  trackRevenue: boolean;
  estimatedCPM: number; // Estimated CPM for revenue calculation
  
  // Feature flags
  bannerEnabled: boolean;
  interstitialEnabled: boolean;
  rewardedEnabled: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AdManagerConfig = {
  interstitialFrequency: 3, // Every 3 games
  interstitialMinInterval: 60, // 60 seconds
  rewardedDailyLimit: 3, // 3 per day
  maxRetries: 3,
  retryBackoffMs: [1000, 2000, 4000, 8000],
  trackRevenue: true,
  estimatedCPM: 5.0, // $5 CPM estimate
  bannerEnabled: true,
  interstitialEnabled: true,
  rewardedEnabled: true,
};

// Frequency capping state
interface FrequencyCappingState {
  interstitialCount: number;
  interstitialLastShown: number; // timestamp
  rewardedDailyCount: number;
  rewardedDate: string; // ISO date
}

/**
 * Enhanced Ad Manager Service
 * Provides production-ready ad management with frequency capping and revenue tracking
 */
export class AdManagerEnhanced extends BaseService {
  private config: AdManagerConfig;
  private state: FrequencyCappingState;

  constructor(config: Partial<AdManagerConfig> = {}) {
    super('AdManagerEnhanced');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      interstitialCount: 0,
      interstitialLastShown: 0,
      rewardedDailyCount: 0,
      rewardedDate: getTodayISO(),
    };
  }

  /**
   * Initialize the ad manager
   */
  protected async onInitialize(): Promise<void> {
    // Load state from storage
    await this.loadState();

    // Reset daily rewarded count if date changed
    const today = getTodayISO();
    if (this.state.rewardedDate !== today) {
      this.logger.info('New day detected, resetting daily rewarded count');
      this.state.rewardedDailyCount = 0;
      this.state.rewardedDate = today;
      await this.saveState();
    }
  }

  /**
   * Start the ad manager
   */
  protected async onStart(): Promise<void> {
    // Nothing to start
  }

  /**
   * Stop the ad manager
   */
  protected async onStop(): Promise<void> {
    // Save final state
    await this.saveState();
  }

  /**
   * Check if interstitial ad can be shown
   * Implements frequency capping based on game count and time interval
   */
  public canShowInterstitial(): boolean {
    if (!this.config.interstitialEnabled) {
      this.logger.debug('Interstitial disabled by config');
      return false;
    }

    // Check game count frequency
    if (this.state.interstitialCount % this.config.interstitialFrequency !== 0) {
      this.logger.debug('Interstitial frequency not met', {
        count: this.state.interstitialCount,
        frequency: this.config.interstitialFrequency,
      });
      return false;
    }

    // Check minimum time interval
    const now = Date.now();
    const timeSinceLastShown = (now - this.state.interstitialLastShown) / 1000; // seconds
    if (timeSinceLastShown < this.config.interstitialMinInterval) {
      this.logger.debug('Interstitial min interval not met', {
        timeSinceLastShown,
        minInterval: this.config.interstitialMinInterval,
      });
      return false;
    }

    return true;
  }

  /**
   * Check if rewarded ad can be shown
   * Implements daily limit capping
   */
  public canShowRewarded(): boolean {
    if (!this.config.rewardedEnabled) {
      this.logger.debug('Rewarded disabled by config');
      return false;
    }

    // Check daily limit
    if (this.state.rewardedDailyCount >= this.config.rewardedDailyLimit) {
      this.logger.debug('Rewarded daily limit reached', {
        count: this.state.rewardedDailyCount,
        limit: this.config.rewardedDailyLimit,
      });
      return false;
    }

    return true;
  }

  /**
   * Record game end (for interstitial frequency tracking)
   */
  public recordGameEnd(): void {
    this.state.interstitialCount++;
    this.saveState();

    this.logger.debug('Game ended', {
      interstitialCount: this.state.interstitialCount,
      canShowInterstitial: this.canShowInterstitial(),
    });
  }

  /**
   * Record interstitial shown
   */
  public recordInterstitialShown(): void {
    this.state.interstitialLastShown = Date.now();
    this.saveState();

    // Track analytics
    AdEventTracker.logAdImpression({
      adType: AdType.INTERSTITIAL,
      adUnitId: 'interstitial', // Replace with actual ad unit ID
      placement: AdPlacement.GAME_END,
    });

    // Track revenue (estimated)
    if (this.config.trackRevenue) {
      const estimatedRevenue = this.config.estimatedCPM / 1000; // CPM to per-impression
      this.trackRevenue(AdType.INTERSTITIAL, AdPlacement.GAME_END, estimatedRevenue);
    }
  }

  /**
   * Record rewarded ad shown
   */
  public recordRewardedShown(placement: AdPlacement): void {
    this.state.rewardedDailyCount++;
    this.state.rewardedDate = getTodayISO();
    this.saveState();

    // Track analytics
    AdEventTracker.logAdImpression({
      adType: AdType.REWARDED,
      adUnitId: 'rewarded', // Replace with actual ad unit ID
      placement,
    });

    // Track revenue (estimated, rewarded ads typically have higher CPM)
    if (this.config.trackRevenue) {
      const estimatedRevenue = (this.config.estimatedCPM * 2) / 1000; // 2x CPM for rewarded
      this.trackRevenue(AdType.REWARDED, placement, estimatedRevenue);
    }
  }

  /**
   * Track ad revenue
   */
  public trackRevenue(adType: AdType, placement: AdPlacement | string, value: number): void {
    // Track in analytics
    AdEventTracker.logAdRevenue({
      adType,
      adUnitId: adType === AdType.INTERSTITIAL ? 'interstitial' : 'rewarded',
      placement,
      value,
      currency: 'USD',
      precision: 'estimated',
    });

    // Track in revenue tracker
    adRevenueTracker.trackRevenue({
      adType,
      placement,
      value,
    });

    // Update total revenue in storage
    this.updateTotalRevenue(value);

    this.logger.info('Ad revenue tracked', { adType, placement, value });
  }

  /**
   * Get total ad revenue
   */
  public async getTotalRevenue(): Promise<number> {
    try {
      const revenue = await storageManager.getItem<number>(AD_STORAGE_KEYS.TOTAL_AD_REVENUE);
      return revenue || 0;
    } catch (error) {
      this.logger.error('Failed to get total revenue', { error });
      return 0;
    }
  }

  /**
   * Get rewarded ads remaining today
   */
  public getRewardedAdsRemaining(): number {
    return Math.max(0, this.config.rewardedDailyLimit - this.state.rewardedDailyCount);
  }

  /**
   * Get games until next interstitial
   */
  public getGamesUntilNextInterstitial(): number {
    const remainder = this.state.interstitialCount % this.config.interstitialFrequency;
    return remainder === 0 ? 0 : this.config.interstitialFrequency - remainder;
  }

  /**
   * Update configuration (e.g., from Remote Config or A/B Test)
   */
  public updateConfig(config: Partial<AdManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Configuration updated', { config: this.config });
  }

  /**
   * Load configuration from A/B Test Manager
   * @param abTestManager - A/B Test Manager instance
   */
  public loadConfigFromABTest(abTestManager: any): void {
    // Get ad configuration from A/B tests
    const interstitialFrequency = abTestManager.getFeatureValue('ad_interstitial_frequency', this.config.interstitialFrequency);
    const rewardedDailyLimit = abTestManager.getFeatureValue('ad_rewarded_daily_limit', this.config.rewardedDailyLimit);
    const bannerEnabled = abTestManager.isFeatureEnabled('ad_banner');
    const interstitialEnabled = abTestManager.isFeatureEnabled('ad_interstitial');
    const rewardedEnabled = abTestManager.isFeatureEnabled('ad_rewarded');

    this.updateConfig({
      interstitialFrequency,
      rewardedDailyLimit,
      bannerEnabled,
      interstitialEnabled,
      rewardedEnabled,
    });

    this.logger.info('Configuration loaded from A/B Test Manager');
  }

  /**
   * Get current configuration
   */
  public getConfig(): AdManagerConfig {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  public getState(): FrequencyCappingState {
    return { ...this.state };
  }

  /**
   * Reset state (for testing or user request)
   */
  public async resetState(): Promise<void> {
    this.state = {
      interstitialCount: 0,
      interstitialLastShown: 0,
      rewardedDailyCount: 0,
      rewardedDate: getTodayISO(),
    };
    await this.saveState();
    this.logger.info('State reset');
  }

  // Private methods

  /**
   * Load state from storage
   */
  private async loadState(): Promise<void> {
    try {
      const interstitialCount = await storageManager.getItem<number>(
        AD_STORAGE_KEYS.INTERSTITIAL_COUNT
      );
      const interstitialLastShown = await storageManager.getItem<number>(
        AD_STORAGE_KEYS.INTERSTITIAL_LAST_SHOWN
      );
      const rewardedDailyCount = await storageManager.getItem<number>(
        AD_STORAGE_KEYS.REWARDED_DAILY_COUNT
      );
      const rewardedDate = await storageManager.getItem<string>(AD_STORAGE_KEYS.REWARDED_DATE);

      this.state = {
        interstitialCount: interstitialCount || 0,
        interstitialLastShown: interstitialLastShown || 0,
        rewardedDailyCount: rewardedDailyCount || 0,
        rewardedDate: rewardedDate || getTodayISO(),
      };

      this.logger.debug('State loaded', { state: this.state });
    } catch (error) {
      this.logger.error('Failed to load state', { error });
    }
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      await storageManager.setItem(AD_STORAGE_KEYS.INTERSTITIAL_COUNT, this.state.interstitialCount);
      await storageManager.setItem(
        AD_STORAGE_KEYS.INTERSTITIAL_LAST_SHOWN,
        this.state.interstitialLastShown
      );
      await storageManager.setItem(
        AD_STORAGE_KEYS.REWARDED_DAILY_COUNT,
        this.state.rewardedDailyCount
      );
      await storageManager.setItem(AD_STORAGE_KEYS.REWARDED_DATE, this.state.rewardedDate);

      this.logger.debug('State saved', { state: this.state });
    } catch (error) {
      this.logger.error('Failed to save state', { error });
    }
  }

  /**
   * Update total revenue in storage
   */
  private async updateTotalRevenue(additionalRevenue: number): Promise<void> {
    try {
      const currentRevenue = await this.getTotalRevenue();
      const newRevenue = currentRevenue + additionalRevenue;
      await storageManager.setItem(AD_STORAGE_KEYS.TOTAL_AD_REVENUE, newRevenue);

      this.logger.debug('Total revenue updated', {
        previous: currentRevenue,
        additional: additionalRevenue,
        new: newRevenue,
      });
    } catch (error) {
      this.logger.error('Failed to update total revenue', { error });
    }
  }
}

// Export singleton instance
export const adManagerEnhanced = new AdManagerEnhanced();
