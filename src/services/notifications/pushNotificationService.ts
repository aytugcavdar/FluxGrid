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
  channelId?: string;
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
const ENGAGEMENT_CHANNEL_ID = 'daily_reminders';
const MAX_CONTEXTUAL_NOTIFICATIONS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

interface NotificationCopy {
  title: string;
  body: string;
}

function stableIndex(seed: string, length: number): number {
  if (length <= 1) return 0;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % length;
}

function pickCopy(variants: NotificationCopy[], seed: string): NotificationCopy {
  return variants[stableIndex(seed, variants.length)];
}

function dateSeed(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function createEngagementNotificationCopy(
  type: NotificationType,
  context: EngagementNotificationContext = {},
  now: Date = new Date()
): NotificationCopy {
  const streak = context.currentStreak || 0;
  const recordGap = Math.max(0, (context.bestScore || 0) - (context.lastScore || 0));
  const inactiveDays = daysSince(context.lastPlayedAt, now);
  const seed = `${type}:${dateSeed(now)}:${streak}:${recordGap}:${inactiveDays ?? 0}`;

  switch (type) {
    case NotificationType.STREAK_REMINDER:
      return pickCopy([
        {
          title: `${streak} gunluk seri alarmi`,
          body: 'Bu seri kendi kendini koruyamiyor. Kisa bir tur yeter.',
        },
        {
          title: 'Serin seni bekliyor',
          body: `${streak} gunluk emek var. Bugunu bos gecmeyelim.`,
        },
        {
          title: 'Seri kirilmasin',
          body: 'Bir mini tur at, sayac rahat nefes alsin.',
        },
      ], seed);

    case NotificationType.NEAR_RECORD:
      return pickCopy([
        {
          title: 'Rekor kapida',
          body: `${recordGap.toLocaleString('tr-TR')} puan kalmisti. Bu kadar yakinken bir deneme daha.`,
        },
        {
          title: 'Az kaldi',
          body: `Son skorun rekora ${recordGap.toLocaleString('tr-TR')} puan uzakta. Tahta hazir.`,
        },
        {
          title: 'Rekor seni gordu',
          body: `${recordGap.toLocaleString('tr-TR')} puanlik fark kapanabilir. Bir tur daha?`,
        },
      ], seed);

    case NotificationType.TIMED_MODE:
      return pickCopy([
        {
          title: '60 saniyelik meydan okuma',
          body: 'Timed mod isinmis. Bir dakikada skor alalim.',
        },
        {
          title: 'Bir dakika yeter',
          body: 'Hizli tur hazir. Kronometre baslamayi bekliyor.',
        },
        {
          title: 'Kisa ve net',
          body: '60 saniyelik tur, bahane kabul etmeyen tur.',
        },
      ], seed);

    case NotificationType.INACTIVITY:
      return pickCopy([
        {
          title: 'Tahta seni unutmadi',
          body: `${inactiveDays || 2} gundur sessiz. Geri donus turu 2 dakika.`,
        },
        {
          title: 'Kucuk bir geri donus',
          body: 'Bir kisa tur at; ritmi yeniden yakalayalim.',
        },
        {
          title: 'FluxGrid yoklama aliyor',
          body: 'Bugun bir hamlelik isimiz var.',
        },
      ], seed);

    case NotificationType.DAILY_REMINDER:
    default:
      return pickCopy([
        {
          title: 'FluxGrid seni bekliyor',
          body: 'Bugunun mini turu hala bos. Bir hamleyle baslayalim.',
        },
        {
          title: '2 dakika, sonra ozgursun',
          body: 'Kisa bir tur at; gunluk ritim bozulmasin.',
        },
        {
          title: 'Tahta sessiz kaldi',
          body: 'Bir oyunluk yer ayirdik. Gelip dolduralim mi?',
        },
      ], seed);
  }
}

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
  const plans: EngagementNotificationPlan[] = [];
  const todayPlayed = context.todayPlayed === true;

  if (!todayPlayed) {
    const copy = createEngagementNotificationCopy(NotificationType.DAILY_REMINDER, context, now);
    plans.push({
      id: 101,
      type: NotificationType.DAILY_REMINDER,
      title: copy.title,
      body: copy.body,
      hour: 20,
      minute: 0,
      repeats: true,
      data: { target: 'home' },
    });
  }

  const contextualPlans: EngagementNotificationPlan[] = [];

  if ((context.currentStreak || 0) >= 2 && !todayPlayed) {
    const copy = createEngagementNotificationCopy(NotificationType.STREAK_REMINDER, context, now);
    contextualPlans.push({
      id: 102,
      type: NotificationType.STREAK_REMINDER,
      title: copy.title,
      body: copy.body,
      hour: 18,
      minute: 30,
      data: { streak: context.currentStreak, target: 'game', mode: 'daily' },
    });
  }

  const recordGap = (context.bestScore || 0) - (context.lastScore || 0);
  const closeRecordLimit = Math.max(240, Math.round((context.bestScore || 0) * 0.1));
  if ((context.bestScore || 0) > 0 && recordGap > 0 && recordGap <= closeRecordLimit) {
    const copy = createEngagementNotificationCopy(NotificationType.NEAR_RECORD, context, now);
    contextualPlans.push({
      id: 103,
      type: NotificationType.NEAR_RECORD,
      title: copy.title,
      body: copy.body,
      hour: 19,
      minute: 30,
      data: { recordGap, target: 'statistics' },
    });
  }

  const timedDaysSince = daysSince(context.lastTimedPlayedAt, now);
  if (!todayPlayed && (timedDaysSince === null || timedDaysSince >= 1)) {
    const copy = createEngagementNotificationCopy(NotificationType.TIMED_MODE, context, now);
    contextualPlans.push({
      id: 104,
      type: NotificationType.TIMED_MODE,
      title: copy.title,
      body: copy.body,
      hour: 12,
      minute: 30,
      data: { target: 'game', mode: 'timed' },
    });
  }

  const inactiveDays = daysSince(context.lastPlayedAt, now);
  if (inactiveDays !== null && inactiveDays >= 2) {
    const copy = createEngagementNotificationCopy(NotificationType.INACTIVITY, context, now);
    contextualPlans.push({
      id: 105,
      type: NotificationType.INACTIVITY,
      title: copy.title,
      body: copy.body,
      hour: 17,
      minute: 30,
      data: { inactiveDays, target: 'home' },
    });
  }

  plans.push(...contextualPlans.slice(0, MAX_CONTEXTUAL_NOTIFICATIONS));
  return plans;
}

export function getNotificationActionTarget(data: Record<string, any> = {}): {
  target: 'home' | 'game' | 'statistics' | 'settings';
  mode?: 'endless' | 'timed' | 'daily';
} {
  const type = data.type;
  const target = data.target;
  const mode = data.mode;

  if (target === 'statistics' || type === NotificationType.NEAR_RECORD) {
    return { target: 'statistics' };
  }

  if (target === 'settings') {
    return { target: 'settings' };
  }

  if (mode === 'timed' || type === NotificationType.TIMED_MODE) {
    return { target: 'game', mode: 'timed' };
  }

  if (mode === 'daily' || type === NotificationType.STREAK_REMINDER) {
    return { target: 'game', mode: 'daily' };
  }

  if (mode === 'endless' || target === 'game') {
    return { target: 'game', mode: 'endless' };
  }

  return { target: 'home' };
}

const FCM_TOKEN_REGISTRATION_KEY = 'flux_fcm_token_registration_v1';

interface StoredFCMRegistration {
  signature: string;
  sentAt: number;
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
      const permission = await PushNotifications.checkPermissions();

      if (permission.receive === 'granted') {
        await PushNotifications.register();
        this.setupListeners();
        this.isInitialized = true;
        console.log('[PushNotifications] Initialized successfully');
      } else {
        console.log('[PushNotifications] Permission not granted; skipping registration');
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
      const platform = Capacitor.getPlatform();
      const locale = navigator.language;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const appVersion = import.meta.env.VITE_APP_VERSION || null;
      const signature = JSON.stringify({ token, platform, locale, timezone, appVersion });
      const storedRegistration = this.getStoredTokenRegistration();

      if (storedRegistration?.signature === signature) {
        console.log('[PushNotifications] Token metadata unchanged; skipping backend sync');
        return;
      }

      const response = await fetch('https://us-central1-fluxgrid-app.cloudfunctions.net/saveFCMToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          timestamp: Date.now(),
          locale,
          timezone,
          appVersion,
          active: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save token: ${response.statusText}`);
      }

      console.log('[PushNotifications] Token sent to backend');
      localStorage.setItem(FCM_TOKEN_REGISTRATION_KEY, JSON.stringify({
        signature,
        sentAt: Date.now(),
      }));
    } catch (error) {
      console.error('[PushNotifications] Failed to send token:', error);
    }
  }

  private getStoredTokenRegistration(): StoredFCMRegistration | null {
    try {
      const raw = localStorage.getItem(FCM_TOKEN_REGISTRATION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredFCMRegistration;
      if (!parsed?.signature || typeof parsed.sentAt !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    const target = getNotificationActionTarget(action.notification.data);

    if (target.target === 'game' && target.mode) {
      window.location.href = `/?mode=${target.mode}`;
      return;
    }

    window.location.href = '/';
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
      if (this.isInitialized) {
        return true;
      }

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        await PushNotifications.register();
        this.setupListeners();
        this.isInitialized = true;
      }
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
      const permission = await LocalNotifications.checkPermissions();
      let displayPermission = permission.display;

      if (displayPermission === 'prompt' || displayPermission === 'prompt-with-rationale') {
        const request = await LocalNotifications.requestPermissions();
        displayPermission = request.display;
      }

      if (displayPermission !== 'granted') {
        console.log('[PushNotifications] Local notification permission not granted');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: notification.id || Date.now(),
            schedule: notification.schedule,
            channelId: notification.channelId || ENGAGEMENT_CHANNEL_ID,
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
    channelId: notification.channelId,
    data: notification,
  });
};

export const notificationScheduler = {
  scheduleEngagementNotifications: async (
    context: EngagementNotificationContext = {},
    options: { requestPermission?: boolean } = {}
  ) => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const permission = await LocalNotifications.checkPermissions();
      let displayPermission = permission.display;

      if (
        options.requestPermission &&
        (displayPermission === 'prompt' || displayPermission === 'prompt-with-rationale')
      ) {
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
      if (plans.length === 0) {
        console.log('[Notifications] No engagement notifications to schedule');
        return;
      }

      await LocalNotifications.schedule({
        notifications: plans.map(plan => ({
          id: plan.id,
          title: plan.title,
          body: plan.body,
          channelId: ENGAGEMENT_CHANNEL_ID,
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
