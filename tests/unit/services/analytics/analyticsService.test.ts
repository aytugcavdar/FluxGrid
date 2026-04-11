import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnalyticsService } from '@services/analytics/analyticsService';

// Mock Firebase Analytics
vi.mock('@services/firebase/firebaseConfig', () => ({
  analytics: {
    logEvent: vi.fn(),
    setUserId: vi.fn(),
    setUserProperties: vi.fn(),
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Event Logging', () => {
    it('should log events', async () => {
      await service.logEvent('test_event', { param1: 'value1' });
      
      // Event should be batched
      expect(service.getPendingEventsCount()).toBe(1);
    });

    it('should batch events', async () => {
      await service.logEvent('event1', { data: 'test1' });
      await service.logEvent('event2', { data: 'test2' });
      await service.logEvent('event3', { data: 'test3' });
      
      expect(service.getPendingEventsCount()).toBe(3);
    });

    it('should flush events after 10 events', async () => {
      for (let i = 0; i < 10; i++) {
        await service.logEvent(`event${i}`, { index: i });
      }
      
      // Should auto-flush after 10 events
      await vi.runAllTimersAsync();
      expect(service.getPendingEventsCount()).toBe(0);
    });

    it('should flush events after 30 seconds', async () => {
      await service.logEvent('test_event', { data: 'test' });
      
      expect(service.getPendingEventsCount()).toBe(1);
      
      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);
      await vi.runAllTimersAsync();
      
      expect(service.getPendingEventsCount()).toBe(0);
    });
  });

  describe('User Properties', () => {
    it('should set user ID', async () => {
      await service.setUserId('user123');
      
      const userId = service.getUserId();
      expect(userId).toBe('user123');
    });

    it('should set user properties', async () => {
      await service.setUserProperty('level', '5');
      await service.setUserProperty('premium', 'true');
      
      const properties = service.getUserProperties();
      expect(properties).toEqual({
        level: '5',
        premium: 'true',
      });
    });

    it('should batch user properties', async () => {
      await service.setUserProperties({
        level: '10',
        coins: '1000',
        premium: 'false',
      });
      
      const properties = service.getUserProperties();
      expect(properties).toEqual({
        level: '10',
        coins: '1000',
        premium: 'false',
      });
    });
  });

  describe('Game Events', () => {
    it('should log game_start event', async () => {
      await service.logGameStart('classic', 1);
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should log game_end event', async () => {
      await service.logGameEnd('classic', 1000, 120);
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should log level_complete event', async () => {
      await service.logLevelComplete(5, 1500, 180);
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should log ability_used event', async () => {
      await service.logAbilityUsed('bomb', 'classic');
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });
  });

  describe('Session Tracking', () => {
    it('should track session duration', async () => {
      service.startSession();
      
      // Simulate 5 minutes of gameplay
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      const duration = service.getSessionDuration();
      expect(duration).toBeGreaterThanOrEqual(5 * 60 * 1000);
    });

    it('should end session', async () => {
      service.startSession();
      vi.advanceTimersByTime(2 * 60 * 1000);
      
      await service.endSession();
      
      const duration = service.getSessionDuration();
      expect(duration).toBe(0);
    });
  });

  describe('Ad Events', () => {
    it('should log ad_impression event', async () => {
      await service.logAdImpression('interstitial', 'home_screen');
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should log ad_click event', async () => {
      await service.logAdClick('banner', 'game_screen');
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });

    it('should log ad_revenue event', async () => {
      await service.logAdRevenue('rewarded', 0.05, 'USD');
      
      expect(service.getPendingEventsCount()).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event names', async () => {
      await expect(service.logEvent('', {})).rejects.toThrow();
    });

    it('should handle invalid parameters', async () => {
      const invalidParams = { key: 'x'.repeat(1000) }; // Too long
      
      await expect(service.logEvent('test', invalidParams)).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockError = new Error('Network error');
      vi.mocked(service['analytics'].logEvent).mockRejectedValueOnce(mockError);
      
      // Should not throw, but log error
      await expect(service.flush()).resolves.not.toThrow();
    });
  });
});
