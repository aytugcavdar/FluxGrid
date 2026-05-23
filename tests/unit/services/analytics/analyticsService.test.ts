import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '@services/analytics/analyticsService';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    service = new AnalyticsService({ enabled: true, batchSize: 20 });
    service.clearPendingEvents();
  });

  it('queues validated events', () => {
    service.logEvent('Game Start', { mode: 'endless', score: 10 });

    expect(service.getPendingEventsCount()).toBe(1);
  });

  it('tracks user id and sanitized user properties', () => {
    service.setUserId('user-1');
    service.setUserProperties({ Level: 5, premium: true });

    expect(service.getUserId()).toBe('user-1');
    expect(service.getUserProperty('level')).toBe(5);
    expect(service.getUserProperties().premium).toBe(true);
  });

  it('logs game and ad convenience events', () => {
    service.logGameStart('endless', 1);
    service.logGameEnd('endless', 1200, 90);
    service.logAdImpression('banner_home', 'banner');

    expect(service.getPendingEventsCount()).toBe(3);
  });
});
