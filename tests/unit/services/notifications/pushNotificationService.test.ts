import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    requestPermissions: vi.fn(),
    register: vi.fn(),
    addListener: vi.fn(),
    checkPermissions: vi.fn(),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getPending: vi.fn(),
    cancel: vi.fn(),
    schedule: vi.fn(),
  },
}));

import {
  createEngagementNotificationPlans,
  NotificationType,
} from '@services/notifications/pushNotificationService';

describe('createEngagementNotificationPlans', () => {
  it('limits phone notification plans to the allowed engagement types', () => {
    const now = new Date('2026-05-16T10:00:00.000Z');
    const plans = createEngagementNotificationPlans({
      currentStreak: 4,
      todayPlayed: false,
      lastPlayedAt: new Date('2026-05-13T10:00:00.000Z').getTime(),
      lastScore: 9760,
      bestScore: 10000,
      lastTimedPlayedAt: new Date('2026-05-14T10:00:00.000Z').getTime(),
    }, now);

    expect(plans.map(plan => plan.type).sort()).toEqual([
      NotificationType.DAILY_REMINDER,
      NotificationType.INACTIVITY,
      NotificationType.NEAR_RECORD,
      NotificationType.STREAK_REMINDER,
      NotificationType.TIMED_MODE,
    ].sort());
  });

  it('always includes only one repeating daily reminder', () => {
    const plans = createEngagementNotificationPlans({}, new Date('2026-05-16T10:00:00.000Z'));
    const repeatingPlans = plans.filter(plan => plan.repeats);

    expect(repeatingPlans).toHaveLength(1);
    expect(repeatingPlans[0].type).toBe(NotificationType.DAILY_REMINDER);
  });
});
