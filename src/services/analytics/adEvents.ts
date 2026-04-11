/**
 * Ad Event Tracking
 * 
 * Predefined ad events for analytics tracking.
 * Tracks ad impressions, clicks, and revenue.
 * 
 * Requirements: 3.8, 6.9
 */

import { analyticsService } from './analyticsService';

/**
 * Ad event names (following Firebase Analytics naming conventions)
 */
export const AdEvents = {
  AD_IMPRESSION: 'ad_impression',
  AD_CLICK: 'ad_click',
  AD_REVENUE: 'ad_revenue',
  AD_LOAD: 'ad_load',
  AD_LOAD_FAILED: 'ad_load_failed',
  AD_DISMISSED: 'ad_dismissed',
  AD_REWARDED: 'ad_rewarded',
} as const;

/**
 * Ad types
 */
export enum AdType {
  BANNER = 'banner',
  INTERSTITIAL = 'interstitial',
  REWARDED = 'rewarded',
  REWARDED_INTERSTITIAL = 'rewarded_interstitial',
}

/**
 * Ad placement locations
 */
export enum AdPlacement {
  GAME_START = 'game_start',
  GAME_END = 'game_end',
  LEVEL_COMPLETE = 'level_complete',
  PAUSE_MENU = 'pause_menu',
  MAIN_MENU = 'main_menu',
  SETTINGS = 'settings',
  CONTINUE_GAME = 'continue_game',
  EXTRA_LIFE = 'extra_life',
  BONUS_REWARD = 'bonus_reward',
}

/**
 * Ad event tracker
 * Provides convenient methods for logging ad-specific events
 */
export class AdEventTracker {
  /**
   * Log ad impression event
   */
  public static logAdImpression(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    adNetwork?: string;
  }): void {
    analyticsService.logEvent(AdEvents.AD_IMPRESSION, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      ad_network: params.adNetwork || 'admob',
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad click event
   */
  public static logAdClick(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    adNetwork?: string;
  }): void {
    analyticsService.logEvent(AdEvents.AD_CLICK, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      ad_network: params.adNetwork || 'admob',
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad revenue event
   * This is a standard Firebase Analytics event for tracking ad revenue
   */
  public static logAdRevenue(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    value: number; // Revenue in USD
    currency?: string;
    adNetwork?: string;
    precision?: 'estimated' | 'publisher_provided' | 'precise';
  }): void {
    // Use Firebase's standard ad_impression event with revenue
    analyticsService.logEvent('ad_impression', {
      ad_platform: params.adNetwork || 'admob',
      ad_source: params.adNetwork || 'admob',
      ad_format: params.adType,
      ad_unit_name: params.adUnitId,
      value: params.value,
      currency: params.currency || 'USD',
      precision_type: params.precision || 'estimated',
      placement: params.placement,
      timestamp: Date.now(),
    });

    // Also log custom ad_revenue event for easier querying
    analyticsService.logEvent(AdEvents.AD_REVENUE, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      value: params.value,
      currency: params.currency || 'USD',
      ad_network: params.adNetwork || 'admob',
      precision: params.precision || 'estimated',
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad load event
   */
  public static logAdLoad(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    loadTime?: number; // milliseconds
  }): void {
    analyticsService.logEvent(AdEvents.AD_LOAD, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      load_time: params.loadTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad load failed event
   */
  public static logAdLoadFailed(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    errorCode?: string | number;
    errorMessage?: string;
  }): void {
    analyticsService.logEvent(AdEvents.AD_LOAD_FAILED, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      error_code: params.errorCode?.toString(),
      error_message: params.errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad dismissed event
   */
  public static logAdDismissed(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    viewDuration?: number; // seconds
    completed?: boolean; // For rewarded ads
  }): void {
    analyticsService.logEvent(AdEvents.AD_DISMISSED, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      view_duration: params.viewDuration,
      completed: params.completed ?? false,
      timestamp: Date.now(),
    });
  }

  /**
   * Log ad rewarded event (for rewarded ads)
   */
  public static logAdRewarded(params: {
    adType: AdType;
    adUnitId: string;
    placement: AdPlacement | string;
    rewardType: string; // e.g., 'coins', 'extra_life', 'continue'
    rewardAmount: number;
  }): void {
    analyticsService.logEvent(AdEvents.AD_REWARDED, {
      ad_type: params.adType,
      ad_unit_id: params.adUnitId,
      placement: params.placement,
      reward_type: params.rewardType,
      reward_amount: params.rewardAmount,
      timestamp: Date.now(),
    });
  }

  /**
   * Track ad performance metrics
   * Call this to update user properties related to ad engagement
   */
  public static updateAdMetrics(params: {
    totalAdsViewed?: number;
    totalAdsClicked?: number;
    totalRewardedAdsViewed?: number;
    totalAdRevenue?: number; // USD
    lastAdViewedDate?: Date;
  }): void {
    if (params.totalAdsViewed !== undefined) {
      analyticsService.setUserProperty('total_ads_viewed', params.totalAdsViewed);
    }

    if (params.totalAdsClicked !== undefined) {
      analyticsService.setUserProperty('total_ads_clicked', params.totalAdsClicked);
    }

    if (params.totalRewardedAdsViewed !== undefined) {
      analyticsService.setUserProperty('total_rewarded_ads', params.totalRewardedAdsViewed);
    }

    if (params.totalAdRevenue !== undefined) {
      analyticsService.setUserProperty('total_ad_revenue', params.totalAdRevenue);
    }

    if (params.lastAdViewedDate) {
      analyticsService.setUserProperty(
        'last_ad_viewed',
        params.lastAdViewedDate.toISOString()
      );
    }
  }

  /**
   * Calculate ad engagement rate
   * Returns the percentage of ads clicked vs viewed
   */
  public static calculateAdEngagementRate(
    totalViewed: number,
    totalClicked: number
  ): number {
    if (totalViewed === 0) {
      return 0;
    }
    return (totalClicked / totalViewed) * 100;
  }

  /**
   * Set ad engagement user property
   */
  public static setAdEngagementLevel(
    totalViewed: number,
    totalClicked: number
  ): void {
    const engagementRate = this.calculateAdEngagementRate(totalViewed, totalClicked);

    let engagementLevel: 'low' | 'medium' | 'high';
    if (engagementRate < 1) {
      engagementLevel = 'low';
    } else if (engagementRate < 5) {
      engagementLevel = 'medium';
    } else {
      engagementLevel = 'high';
    }

    analyticsService.setUserProperty('ad_engagement_level', engagementLevel);
  }
}

/**
 * Ad revenue tracker
 * Tracks cumulative ad revenue and provides reporting
 */
export class AdRevenueTracker {
  private totalRevenue: number = 0;
  private revenueByType: Map<AdType, number> = new Map();
  private revenueByPlacement: Map<string, number> = new Map();

  /**
   * Track ad revenue
   */
  public trackRevenue(params: {
    adType: AdType;
    placement: AdPlacement | string;
    value: number;
  }): void {
    // Update total revenue
    this.totalRevenue += params.value;

    // Update revenue by type
    const currentTypeRevenue = this.revenueByType.get(params.adType) || 0;
    this.revenueByType.set(params.adType, currentTypeRevenue + params.value);

    // Update revenue by placement
    const currentPlacementRevenue = this.revenueByPlacement.get(params.placement) || 0;
    this.revenueByPlacement.set(params.placement, currentPlacementRevenue + params.value);

    // Update user property
    AdEventTracker.updateAdMetrics({
      totalAdRevenue: this.totalRevenue,
    });
  }

  /**
   * Get total revenue
   */
  public getTotalRevenue(): number {
    return this.totalRevenue;
  }

  /**
   * Get revenue by ad type
   */
  public getRevenueByType(adType: AdType): number {
    return this.revenueByType.get(adType) || 0;
  }

  /**
   * Get revenue by placement
   */
  public getRevenueByPlacement(placement: string): number {
    return this.revenueByPlacement.get(placement) || 0;
  }

  /**
   * Get all revenue by type
   */
  public getAllRevenueByType(): Map<AdType, number> {
    return new Map(this.revenueByType);
  }

  /**
   * Get all revenue by placement
   */
  public getAllRevenueByPlacement(): Map<string, number> {
    return new Map(this.revenueByPlacement);
  }

  /**
   * Reset revenue tracking
   */
  public reset(): void {
    this.totalRevenue = 0;
    this.revenueByType.clear();
    this.revenueByPlacement.clear();
  }

  /**
   * Get revenue report
   */
  public getReport(): {
    totalRevenue: number;
    revenueByType: Record<string, number>;
    revenueByPlacement: Record<string, number>;
  } {
    return {
      totalRevenue: this.totalRevenue,
      revenueByType: Object.fromEntries(this.revenueByType),
      revenueByPlacement: Object.fromEntries(this.revenueByPlacement),
    };
  }
}

// Export singleton revenue tracker
export const adRevenueTracker = new AdRevenueTracker();
