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

const ENABLED_PREFERENCES = {
  enabled: true,
  dailyReminder: true,
  streakReminder: false,
  nearRecord: true,
  timedMode: true,
  inactivity: true,
};

describe('createEngagementNotificationPlans', () => {
  it('schedules a single evening engagement notification even with multiple context signals', () => {
    const now = new Date('2026-05-16T10:00:00.000Z');
    const plans = createEngagementNotificationPlans({
      currentStreak: 4,
      todayPlayed: false,
      lastPlayedAt: new Date('2026-05-13T10:00:00.000Z').getTime(),
      lastScore: 9760,
      bestScore: 10000,
      lastTimedPlayedAt: new Date('2026-05-14T10:00:00.000Z').getTime(),
    }, now, ENABLED_PREFERENCES);

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      id: 101,
      type: NotificationType.INACTIVITY,
      hour: 20,
      minute: 0,
      repeats: false,
    });
  });

  it('always includes only one repeating daily reminder', () => {
    const plans = createEngagementNotificationPlans(
      {},
      new Date('2026-05-16T10:00:00.000Z'),
      ENABLED_PREFERENCES
    );
    const repeatingPlans = plans.filter(plan => plan.repeats);

    expect(repeatingPlans).toHaveLength(1);
    expect(repeatingPlans[0].type).toBe(NotificationType.DAILY_REMINDER);
  });

  it('keeps the reminder neutral after the user has already played today', () => {
    const plans = createEngagementNotificationPlans({
      todayPlayed: true,
      currentStreak: 4,
      lastTimedPlayedAt: new Date('2026-05-14T10:00:00.000Z').getTime(),
    }, new Date('2026-05-16T10:00:00.000Z'), ENABLED_PREFERENCES);

    expect(plans).toHaveLength(1);
    expect(plans[0].type).toBe(NotificationType.DAILY_REMINDER);
  });

  it('keeps tomorrow daily reminder when the user has already played today', () => {
    const plans = createEngagementNotificationPlans({
      todayPlayed: true,
    }, new Date('2026-05-16T10:00:00.000Z'), ENABLED_PREFERENCES);

    const dailyPlan = plans.find(plan => plan.type === NotificationType.DAILY_REMINDER);
    expect(dailyPlan).toMatchObject({
      repeats: true,
      dayOffset: 1,
    });
  });

  it('never turns a daily streak into a phone notification', () => {
    const plans = createEngagementNotificationPlans({
      currentStreak: 7,
      todayPlayed: false,
    }, new Date('2026-05-16T10:00:00.000Z'), ENABLED_PREFERENCES);

    expect(plans).toHaveLength(1);
    expect(plans[0].type).toBe(NotificationType.DAILY_REMINDER);
    expect(plans[0].hour).toBe(20);
    expect(plans[0].title).not.toMatch(/seri/i);
    expect(plans[0].body).not.toMatch(/seri|streak/i);
  });

  it('uses timed mode only as a single evening persona for players who tried it before', () => {
    const plans = createEngagementNotificationPlans({
      todayPlayed: false,
      lastTimedPlayedAt: new Date('2026-05-13T10:00:00.000Z').getTime(),
    }, new Date('2026-05-16T10:00:00.000Z'), ENABLED_PREFERENCES);

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      type: NotificationType.TIMED_MODE,
      hour: 20,
      minute: 0,
    });
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
