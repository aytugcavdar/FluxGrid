/**
 * Phone notification service.
 *
 * Allowed engagement notification types:
 * - Daily reminder
 * - Streak reminder
 * - Near-record reminder
 * - Timed mode callout
 * - Inactivity reminder
 */

import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export enum NotificationType {
  DAILY_REMINDER = 'daily_reminder',
  STREAK_REMINDER = 'streak_reminder',
  NEAR_RECORD = 'near_record',
  TIMED_MODE = 'timed_mode',
  INACTIVITY = 'inactivity',
}

interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  id?: number;
  schedule?: Record<string, any>;
  data?: Record<string, any>;
}

export interface EngagementNotificationContext {
  currentStreak?: number;
  todayPlayed?: boolean;
  lastPlayedAt?: number;
  lastScore?: number;
  bestScore?: number;
  lastTimedPlayedAt?: number;
}

interface EngagementNotificationPlan {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  hour: number;
  minute: number;
  repeats?: boolean;
  dayOffset?: number;
  data?: Record<string, any>;
}

const ENGAGEMENT_NOTIFICATION_IDS = [101, 102, 103, 104, 105];
const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(timestamp: number | undefined, now: Date): number | null {
  if (!timestamp) return null;
  return Math.floor((now.getTime() - timestamp) / DAY_MS);
}

function nextScheduledDate(hour: number, minute: number, now: Date, dayOffset = 0): Date {
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour, minute, 0, 0);

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  if (dayOffset > 0) {
    scheduledTime.setDate(scheduledTime.getDate() + dayOffset);
  }

  return scheduledTime;
}

export function createEngagementNotificationPlans(
  context: EngagementNotificationContext,
  now: Date = new Date()
): EngagementNotificationPlan[] {
  const plans: EngagementNotificationPlan[] = [
    {
      id: 101,
      type: NotificationType.DAILY_REMINDER,
      title: 'FluxGrid',
      body: 'Bugunku skorunu denedin mi?',
      hour: 20,
      minute: 0,
      repeats: true,
    },
  ];

  if ((context.currentStreak || 0) >= 2 && !context.todayPlayed) {
    plans.push({
      id: 102,
      type: NotificationType.STREAK_REMINDER,
      title: 'Serin devam ediyor',
      body: `${context.currentStreak} gunluk seri bozulmadan kisa bir oyun at.`,
      hour: 18,
      minute: 30,
      data: { streak: context.currentStreak },
    });
  }

  const recordGap = (context.bestScore || 0) - (context.lastScore || 0);
  const closeRecordLimit = Math.max(240, Math.round((context.bestScore || 0) * 0.1));
  if ((context.bestScore || 0) > 0 && recordGap > 0 && recordGap <= closeRecordLimit) {
    plans.push({
      id: 103,
      type: NotificationType.NEAR_RECORD,
      title: 'Rekora yaklastin',
      body: `Son rekoruna ${recordGap.toLocaleString('tr-TR')} puan kalmisti.`,
      hour: 19,
      minute: 30,
      data: { recordGap },
    });
  }

  const timedDaysSince = daysSince(context.lastTimedPlayedAt, now);
  if (timedDaysSince === null || timedDaysSince >= 1) {
    plans.push({
      id: 104,
      type: NotificationType.TIMED_MODE,
      title: 'Timed mod hazir',
      body: '60 saniyelik hizli tur hazir.',
      hour: 12,
      minute: 30,
    });
  }

  const inactiveDays = daysSince(context.lastPlayedAt, now);
  if (inactiveDays !== null && inactiveDays >= 2) {
    plans.push({
      id: 105,
      type: NotificationType.INACTIVITY,
      title: 'Kisa bir tur iyi gider',
      body: '2 dakikalik sakin bir oyun seni bekliyor.',
      hour: 17,
      minute: 30,
      data: { inactiveDays },
    });
  }

  return plans;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('[PushNotifications] Not available on web platform');
      return;
    }

    if (this.isInitialized) {
      console.log('[PushNotifications] Already initialized');
      return;
    }

    try {
      const permission = await PushNotifications.requestPermissions();

      if (permission.receive === 'granted') {
        await PushNotifications.register();
        this.setupListeners();
        this.isInitialized = true;
        console.log('[PushNotifications] Initialized successfully');
      } else {
        console.log('[PushNotifications] Permission denied');
      }
    } catch (error) {
      console.error('[PushNotifications] Initialization failed:', error);
    }
  }

  private setupListeners(): void {
    PushNotifications.addListener('registration', (token: Token) => {
      this.fcmToken = token.value;
      console.log('[PushNotifications] FCM Token:', token.value);
      this.sendTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushNotifications] Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[PushNotifications] Foreground notification:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[PushNotifications] Action performed:', action);
      this.handleNotificationAction(action);
    });
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const response = await fetch('https://us-central1-fluxgrid-app.cloudfunctions.net/saveFCMToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: Capacitor.getPlatform(),
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save token: ${response.statusText}`);
      }

      console.log('[PushNotifications] Token sent to backend');
    } catch (error) {
      console.error('[PushNotifications] Failed to send token:', error);
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    const type = action.notification.data?.type;

    if (
      type === NotificationType.DAILY_REMINDER ||
      type === NotificationType.STREAK_REMINDER ||
      type === NotificationType.NEAR_RECORD ||
      type === NotificationType.TIMED_MODE ||
      type === NotificationType.INACTIVITY
    ) {
      window.location.href = '/';
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  async areNotificationsEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const permission = await PushNotifications.checkPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('[PushNotifications] Permission check failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      return false;
    }
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: notification.id || Date.now(),
            schedule: notification.schedule,
            channelId: 'daily_reminders',
            smallIcon: 'ic_stat_notification',
            autoCancel: true,
            actionTypeId: 'ENGAGEMENT_ACTIONS',
            extra: {
              type: notification.type,
              ...notification.data,
            },
          },
        ],
      });

      console.log('[PushNotifications] Local notification scheduled');
    } catch (error) {
      console.error('[PushNotifications] Failed to schedule notification:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();

export const scheduleLocalNotification = (notification: any): Promise<void> => {
  return pushNotificationService.scheduleLocalNotification({
    type: notification.type || NotificationType.DAILY_REMINDER,
    title: notification.title,
    body: notification.body,
    id: notification.id,
    schedule: notification.schedule,
    data: notification,
  });
};

export const notificationScheduler = {
  scheduleEngagementNotifications: async (context: EngagementNotificationContext = {}) => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const permission = await LocalNotifications.checkPermissions();
      let displayPermission = permission.display;

      if (displayPermission === 'prompt' || displayPermission === 'prompt-with-rationale') {
        const request = await LocalNotifications.requestPermissions();
        displayPermission = request.display;
      }

      if (displayPermission !== 'granted') {
        console.log('[Notifications] Permission not granted, skipping schedule');
        return;
      }

      const pending = await LocalNotifications.getPending();
      const existingEngagementNotifications = pending.notifications.filter(notification =>
        ENGAGEMENT_NOTIFICATION_IDS.includes(notification.id)
      );

      if (existingEngagementNotifications.length > 0) {
        await LocalNotifications.cancel({ notifications: existingEngagementNotifications });
      }

      const now = new Date();
      const plans = createEngagementNotificationPlans(context, now);

      await LocalNotifications.schedule({
        notifications: plans.map(plan => ({
          id: plan.id,
          title: plan.title,
          body: plan.body,
          channelId: 'daily_reminders',
          smallIcon: 'ic_stat_notification',
          autoCancel: true,
          actionTypeId: 'ENGAGEMENT_ACTIONS',
          schedule: {
            at: nextScheduledDate(plan.hour, plan.minute, now, plan.dayOffset || 0),
            repeats: plan.repeats || false,
            every: plan.repeats ? 'day' : undefined,
          },
          extra: {
            type: plan.type,
            ...plan.data,
          },
        })),
      });

      console.log('[Notifications] Engagement notifications scheduled:', plans.map(plan => plan.type));
    } catch (error) {
      console.error('[Notifications] Failed to schedule engagement notifications:', error);
    }
  },

  // Backward-compatible aliases. Reward/challenge notification copies were removed.
  scheduleDailyChallengeReminder: async () => notificationScheduler.scheduleEngagementNotifications(),
  scheduleDailyRewardReminder: async () => notificationScheduler.scheduleEngagementNotifications(),

  cancelAllNotifications: async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
        console.log('[Notifications] Cancelled', pending.notifications.length, 'notifications');
      }
    } catch (error) {
      console.error('[Notifications] Failed to cancel notifications:', error);
    }
  },
};
