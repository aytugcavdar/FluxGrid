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
  createEngagementNotificationCopy,
  createEngagementNotificationPlans,
  getNotificationActionTarget,
  NotificationType,
} from '@services/notifications/pushNotificationService';

describe('createEngagementNotificationPlans', () => {
  it('limits phone notification plans to engagement types and caps contextual reminders', () => {
    const now = new Date('2026-05-16T10:00:00.000Z');
    const plans = createEngagementNotificationPlans({
      currentStreak: 4,
      todayPlayed: false,
      lastPlayedAt: new Date('2026-05-13T10:00:00.000Z').getTime(),
      lastScore: 9760,
      bestScore: 10000,
      lastTimedPlayedAt: new Date('2026-05-14T10:00:00.000Z').getTime(),
    }, now);

    expect(plans).toHaveLength(3);
    expect(plans.map(plan => plan.type)).toEqual([
      NotificationType.DAILY_REMINDER,
      NotificationType.STREAK_REMINDER,
      NotificationType.NEAR_RECORD,
    ]);
  });

  it('always includes only one repeating daily reminder', () => {
    const plans = createEngagementNotificationPlans({}, new Date('2026-05-16T10:00:00.000Z'));
    const repeatingPlans = plans.filter(plan => plan.repeats);

    expect(repeatingPlans).toHaveLength(1);
    expect(repeatingPlans[0].type).toBe(NotificationType.DAILY_REMINDER);
  });

  it('does not schedule play reminders after the user has already played today', () => {
    const plans = createEngagementNotificationPlans({
      todayPlayed: true,
      currentStreak: 4,
      lastTimedPlayedAt: new Date('2026-05-14T10:00:00.000Z').getTime(),
    }, new Date('2026-05-16T10:00:00.000Z'));

    expect(plans.map(plan => plan.type)).not.toContain(NotificationType.DAILY_REMINDER);
    expect(plans.map(plan => plan.type)).not.toContain(NotificationType.STREAK_REMINDER);
    expect(plans.map(plan => plan.type)).not.toContain(NotificationType.TIMED_MODE);
  });

  it('uses playful contextual copy for streak reminders', () => {
    const plans = createEngagementNotificationPlans({
      currentStreak: 7,
      todayPlayed: false,
    }, new Date('2026-05-16T10:00:00.000Z'));

    const streakPlan = plans.find(plan => plan.type === NotificationType.STREAK_REMINDER);
    expect(streakPlan?.title).toMatch(/7 gunluk seri|Serin|Seri/);
    expect(streakPlan?.body).not.toContain('bozulmadan kisa bir oyun at');
  });

  it('creates deterministic near-record copy with score gap', () => {
    const now = new Date('2026-05-16T10:00:00.000Z');
    const context = {
      lastScore: 9760,
      bestScore: 10000,
    };

    const firstCopy = createEngagementNotificationCopy(NotificationType.NEAR_RECORD, context, now);
    const secondCopy = createEngagementNotificationCopy(NotificationType.NEAR_RECORD, context, now);

    expect(firstCopy).toEqual(secondCopy);
    expect(firstCopy.body).toContain('240');
  });
});

describe('getNotificationActionTarget', () => {
  it('routes timed notifications directly to timed mode', () => {
    expect(getNotificationActionTarget({ type: NotificationType.TIMED_MODE })).toEqual({
      target: 'game',
      mode: 'timed',
    });
  });

  it('routes near-record notifications to statistics', () => {
    expect(getNotificationActionTarget({ type: NotificationType.NEAR_RECORD })).toEqual({
      target: 'statistics',
    });
  });
});
