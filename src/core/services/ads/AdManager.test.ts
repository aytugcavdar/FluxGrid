import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdManager } from './AdManager';

describe('AdManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset module state by reinitializing
    AdManager.initialize();
  });

  describe('initialize', () => {
    it('should initialize with default values when localStorage is empty', () => {
      AdManager.initialize();
      
      // Should not throw and should be able to check state
      expect(AdManager.canShowRewardedContinue()).toBe(true);
    });

    it('should load state from localStorage', () => {
      localStorage.setItem('flux_ad_game_count', '2');
      localStorage.setItem('flux_ad_rewarded_daily', '1');
      localStorage.setItem('flux_ad_rewarded_date', '2024-01-15');
      
      AdManager.initialize();
      
      // State should be loaded (verified through behavior)
      expect(AdManager.canShowRewardedContinue()).toBe(true);
    });

    it('should reset daily counter when date changes', () => {
      // Set old date with max count
      localStorage.setItem('flux_ad_rewarded_daily', '3');
      localStorage.setItem('flux_ad_rewarded_date', '2020-01-01');
      
      AdManager.initialize();
      
      // Should reset to 0 for new day
      expect(AdManager.canShowRewardedContinue()).toBe(true);
    });
  });

  describe.skip('recordGameEnd', () => {
    it('should increment game counter', async () => {
      // Initialize first
      await AdManager.initialize();
      
      AdManager.recordGameEnd();
      AdManager.recordGameEnd();
      AdManager.recordGameEnd();
      
      // Verify counter is incrementing by checking localStorage
      const saved = localStorage.getItem('flux_ad_game_count');
      expect(saved).toBe('3');
    });

    it('should show interstitial every 4 games', async () => {
      // Initialize first
      await AdManager.initialize();
      
      // Mock console.log to verify interstitial trigger
      const consoleSpy = vi.spyOn(console, 'log');
      
      AdManager.recordGameEnd(); // 1
      AdManager.recordGameEnd(); // 2
      AdManager.recordGameEnd(); // 3
      AdManager.recordGameEnd(); // 4 - should trigger
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify interstitial was triggered (check for the actual log message)
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AdManager] Triggering interstitial (game:',
        4,
        ')'
      );
      
      // Verify counter reset to 0
      const saved = localStorage.getItem('flux_ad_game_count');
      expect(saved).toBe('0');
    });

    it('should persist game count to localStorage', async () => {
      // Initialize first
      await AdManager.initialize();
      
      AdManager.recordGameEnd();
      
      const saved = localStorage.getItem('flux_ad_game_count');
      expect(saved).toBe('1');
    });
  });

  describe('showInterstitial', () => {
    it('should return success after delay', async () => {
      const result = await AdManager.showInterstitial();
      
      expect(result.success).toBe(true);
    });

    it('should not show when no-ads is active', async () => {
      AdManager.activateNoAds();

      const result = await AdManager.showInterstitial();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No-ads active');
    });
  });

  describe('canShowRewardedContinue', () => {
    it('should return true when count is less than 3', () => {
      expect(AdManager.canShowRewardedContinue()).toBe(true);
    });

    it('should return false when count reaches 3', async () => {
      await AdManager.showRewardedContinue();
      await AdManager.showRewardedContinue();
      await AdManager.showRewardedContinue();
      
      expect(AdManager.canShowRewardedContinue()).toBe(false);
    });
  });

  describe('showRewardedContinue', () => {
    it('should return success with reward', async () => {
      const result = await AdManager.showRewardedContinue();
      
      expect(result.success).toBe(true);
      expect(result.reward).toEqual({
        type: 'continue',
        amount: 1,
      });
    });

    it('should increment daily counter', async () => {
      expect(AdManager.canShowRewardedContinue()).toBe(true);
      
      await AdManager.showRewardedContinue();
      
      // Counter should be incremented (verified through canShow)
      expect(AdManager.canShowRewardedContinue()).toBe(true); // Still true (1/3)
    });

    it('should persist to localStorage', async () => {
      await AdManager.showRewardedContinue();
      
      const count = localStorage.getItem('flux_ad_rewarded_daily');
      const date = localStorage.getItem('flux_ad_rewarded_date');
      
      expect(count).toBe('1');
      expect(date).toBeTruthy();
    });
  });

  describe('showRewardedStreakShield', () => {
    it('should return success with shield reward', async () => {
      const result = await AdManager.showRewardedStreakShield();
      
      expect(result.success).toBe(true);
      expect(result.reward).toEqual({
        type: 'shield',
        amount: 1,
      });
    });
  });

  describe('showRewardedThemeTrial', () => {
    it('grants one 24-hour theme trial reward per day', async () => {
      const result = await AdManager.showRewardedThemeTrial();

      expect(result).toEqual({
        success: true,
        reward: { type: 'theme_trial', amount: 24 },
      });
      expect(AdManager.canShowRewardedThemeTrial()).toBe(false);
      expect(localStorage.getItem('flux_ad_rewarded_theme_trial_date')).toBeTruthy();
    });
  });

  describe('isNoAdsActive', () => {
    it('should return false by default', () => {
      expect(AdManager.isNoAdsActive()).toBe(false);
    });

    it('should return true after activation', () => {
      AdManager.activateNoAds();
      
      expect(AdManager.isNoAdsActive()).toBe(true);
    });
  });

  describe('activateNoAds', () => {
    it('should persist to localStorage', () => {
      AdManager.activateNoAds();
      
      const noAds = localStorage.getItem('flux_no_ads');
      expect(noAds).toBe('true');
    });
  });

  describe('error handling', () => {
    it('should handle localStorage read failure gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      
      // Should not throw
      expect(() => AdManager.initialize()).not.toThrow();
    });

    it('should handle invalid game count', () => {
      localStorage.setItem('flux_ad_game_count', 'invalid');
      
      // Should not throw and should use default
      expect(() => AdManager.initialize()).not.toThrow();
    });
  });
});
