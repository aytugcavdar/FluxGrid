import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import {
  createEngagementNotificationPlans,
  EngagementNotificationPreferences,
  getNotificationActionTarget,
  NotificationType,
} from './pushNotificationService';

const ENABLED_PREFERENCES: EngagementNotificationPreferences = {
  enabled: true,
  dailyReminder: true,
  streakReminder: false,
  nearRecord: true,
  timedMode: true,
  inactivity: true,
};

describe('phone engagement notification plans', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('does not create a plan before the user opts in', () => {
    const plans = createEngagementNotificationPlans(
      {},
      new Date('2026-07-16T10:00:00'),
      { ...ENABLED_PREFERENCES, enabled: false }
    );

    expect(plans).toEqual([]);
  });

  it('creates at most one low-pressure daily reminder', () => {
    const plans = createEngagementNotificationPlans(
      {},
      new Date('2026-07-16T10:00:00'),
      ENABLED_PREFERENCES
    );

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      id: 101,
      type: NotificationType.DAILY_REMINDER,
      hour: 20,
      minute: 0,
      repeats: true,
    });
  });

  it('moves the reminder to tomorrow after the player has played today', () => {
    const [plan] = createEngagementNotificationPlans(
      { todayPlayed: true },
      new Date('2026-07-16T10:00:00'),
      ENABLED_PREFERENCES
    );

    expect(plan.dayOffset).toBe(1);
  });

  it('uses a one-time near-record reminder that opens statistics', () => {
    const [plan] = createEngagementNotificationPlans(
      { bestScore: 10_000, lastScore: 9_300 },
      new Date('2026-07-16T10:00:00'),
      ENABLED_PREFERENCES
    );

    expect(plan.type).toBe(NotificationType.NEAR_RECORD);
    expect(plan.repeats).toBe(false);
    expect(getNotificationActionTarget({ type: plan.type, ...plan.data })).toEqual({
      target: 'statistics',
    });
  });

  it('uses the selected app language for notification copy', async () => {
    const context = { bestScore: 10_000, lastScore: 9_300 };
    const now = new Date('2026-07-16T10:00:00');
    const [english] = createEngagementNotificationPlans(context, now, ENABLED_PREFERENCES);

    await i18n.changeLanguage('tr');
    const [turkish] = createEngagementNotificationPlans(context, now, ENABLED_PREFERENCES);

    expect(english.title).not.toBe(turkish.title);
    expect(english.body).not.toBe(turkish.body);
  });
});
