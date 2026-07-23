/**
 * Phone notification service.
 *
 * Allowed engagement notification types:
 * - Daily reminder
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
import i18n from '../../i18n';

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
const DAY_MS = 24 * 60 * 60 * 1000;
const RESCHEDULE_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const NOTIFICATION_PREFS_KEY = 'flux_engagement_notification_preferences_v1';
const NOTIFICATION_SCHEDULE_STATE_KEY = 'flux_engagement_notification_schedule_state_v1';

export interface EngagementNotificationPreferences {
  enabled: boolean;
  dailyReminder: boolean;
  streakReminder: boolean;
  nearRecord: boolean;
  timedMode: boolean;
  inactivity: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: EngagementNotificationPreferences = {
  enabled: false,
  dailyReminder: true,
  streakReminder: false,
  nearRecord: true,
  timedMode: true,
  inactivity: true,
};

interface EngagementScheduleState {
  signature: string;
  scheduledAt: number;
}

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

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

export function getEngagementNotificationPreferences(): EngagementNotificationPreferences {
  const stored = readJson<Partial<EngagementNotificationPreferences>>(NOTIFICATION_PREFS_KEY);
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(stored || {}),
    // Daily streaks stay in-game and never trigger phone notifications.
    streakReminder: false,
  };
}

export function setEngagementNotificationPreferences(
  updates: Partial<EngagementNotificationPreferences>
): EngagementNotificationPreferences {
  const next = {
    ...getEngagementNotificationPreferences(),
    ...updates,
  };
  writeJson(NOTIFICATION_PREFS_KEY, next);
  return next;
}

function buildScheduleSignature(plans: EngagementNotificationPlan[]): string {
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  return `${language}|${plans
    .map(plan => `${plan.id}:${plan.type}:${plan.hour}:${plan.minute}:${plan.repeats ? 'r' : 'o'}:${plan.dayOffset || 0}`)
    .join('|')}`;
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
  const numberLocale = i18n.resolvedLanguage === 'tr' ? 'tr-TR' : 'en-US';
  const formattedGap = recordGap.toLocaleString(numberLocale);
  const translatedCopy = (group: string, variant: number, values: Record<string, unknown> = {}): NotificationCopy => ({
    title: i18n.t(`notifications.${group}.${variant}.title`, values),
    body: i18n.t(`notifications.${group}.${variant}.body`, values),
  });

  switch (type) {
    case NotificationType.STREAK_REMINDER:
      return pickCopy([
        translatedCopy('streak', 0),
        translatedCopy('streak', 1),
        translatedCopy('streak', 2),
      ], seed);

    case NotificationType.NEAR_RECORD:
      return pickCopy([
        translatedCopy('nearRecord', 0, { score: formattedGap }),
        translatedCopy('nearRecord', 1, { score: formattedGap }),
        translatedCopy('nearRecord', 2, { score: formattedGap }),
      ], seed);

    case NotificationType.TIMED_MODE:
      return pickCopy([
        translatedCopy('timed', 0),
        translatedCopy('timed', 1),
        translatedCopy('timed', 2),
      ], seed);

    case NotificationType.INACTIVITY:
      return pickCopy([
        translatedCopy('inactivity', 0),
        translatedCopy('inactivity', 1),
        translatedCopy('inactivity', 2, { count: inactiveDays || 3 }),
      ], seed);

    case NotificationType.DAILY_REMINDER:
    default:
      return pickCopy([
        translatedCopy('daily', 0),
        translatedCopy('daily', 1),
        translatedCopy('daily', 2),
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

function isScheduleTimeLaterToday(hour: number, minute: number, now: Date): boolean {
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour, minute, 0, 0);
  return scheduledTime > now;
}

function getEngagementNotificationData(
  type: NotificationType,
  context: EngagementNotificationContext,
  recordGap = 0,
  inactiveDays: number | null = null
): Record<string, any> {
  switch (type) {
    case NotificationType.STREAK_REMINDER:
      return { streak: context.currentStreak, target: 'game', mode: 'daily' };
    case NotificationType.NEAR_RECORD:
      return { recordGap, target: 'statistics' };
    case NotificationType.TIMED_MODE:
      return { target: 'game', mode: 'timed' };
    case NotificationType.INACTIVITY:
      return { inactiveDays, target: 'home' };
    case NotificationType.DAILY_REMINDER:
    default:
      return { target: 'home' };
  }
}

function selectEngagementNotificationType(
  context: EngagementNotificationContext,
  now: Date,
  preferences: EngagementNotificationPreferences
): { type: NotificationType; recordGap: number; inactiveDays: number | null } {
  const todayPlayed = context.todayPlayed === true;
  const inactiveDays = daysSince(context.lastPlayedAt, now);
  const recordGap = (context.bestScore || 0) - (context.lastScore || 0);
  const closeRecordLimit = Math.max(240, Math.round((context.bestScore || 0) * 0.1));
  const timedDaysSince = daysSince(context.lastTimedPlayedAt, now);

  // If the player already played, keep tomorrow's repeating reminder neutral.
  if (todayPlayed) {
    return { type: NotificationType.DAILY_REMINDER, recordGap, inactiveDays };
  }

  if (preferences.inactivity && inactiveDays !== null && inactiveDays >= 3) {
    return { type: NotificationType.INACTIVITY, recordGap, inactiveDays };
  }

  if (
    preferences.nearRecord &&
    (context.bestScore || 0) > 0 &&
    recordGap > 0 &&
    recordGap <= closeRecordLimit
  ) {
    return { type: NotificationType.NEAR_RECORD, recordGap, inactiveDays };
  }

  // Timed is now a persona for the single evening slot, not a separate noon push.
  // Only use it after the player has actually tried Timed and skipped it for a bit.
  if (preferences.timedMode && timedDaysSince !== null && timedDaysSince >= 3) {
    return { type: NotificationType.TIMED_MODE, recordGap, inactiveDays };
  }

  return { type: NotificationType.DAILY_REMINDER, recordGap, inactiveDays };
}

export function createEngagementNotificationPlans(
  context: EngagementNotificationContext,
  now: Date = new Date(),
  preferences: EngagementNotificationPreferences = getEngagementNotificationPreferences()
): EngagementNotificationPlan[] {
  const plans: EngagementNotificationPlan[] = [];
  const todayPlayed = context.todayPlayed === true;

  if (!preferences.enabled) {
    return plans;
  }

  if (!preferences.dailyReminder) {
    return plans;
  }

  const selected = selectEngagementNotificationType(context, now, preferences);
  const copy = createEngagementNotificationCopy(selected.type, context, now);
  plans.push({
    id: 101,
    type: selected.type,
    title: copy.title,
    body: copy.body,
    hour: 20,
    minute: 0,
    repeats: selected.type === NotificationType.DAILY_REMINDER,
    dayOffset: todayPlayed && isScheduleTimeLaterToday(20, 0, now) ? 1 : 0,
    data: getEngagementNotificationData(selected.type, context, selected.recordGap, selected.inactiveDays),
  });

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

  async initialize(options: { requestPermission?: boolean } = {}): Promise<void> {
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
      let receivePermission = permission.receive;

      if (
        options.requestPermission &&
        (receivePermission === 'prompt' || receivePermission === 'prompt-with-rationale')
      ) {
        const request = await PushNotifications.requestPermissions();
        receivePermission = request.receive;
      }

      if (receivePermission === 'granted') {
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
      console.log('[PushNotifications] FCM registration completed');
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

  private getStoredToken(): string | null {
    const registration = this.getStoredTokenRegistration();
    if (!registration) return null;

    try {
      const metadata = JSON.parse(registration.signature) as { token?: unknown };
      return typeof metadata.token === 'string' ? metadata.token : null;
    } catch {
      return null;
    }
  }

  async disableRemoteNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    const token = this.fcmToken || this.getStoredToken();
    if (token) {
      try {
        await fetch('https://us-central1-fluxgrid-app.cloudfunctions.net/saveFCMToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            platform: Capacitor.getPlatform(),
            timestamp: Date.now(),
            active: false,
          }),
        });
      } catch (error) {
        console.warn('[PushNotifications] Failed to deactivate legacy token:', error);
      }
    }

    try {
      await PushNotifications.unregister();
    } catch (error) {
      console.warn('[PushNotifications] Failed to unregister legacy token:', error);
    }

    this.fcmToken = null;
    this.isInitialized = false;
    localStorage.removeItem(FCM_TOKEN_REGISTRATION_KEY);
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

let lastEngagementNotificationContext: EngagementNotificationContext = {};

export const notificationScheduler = {
  scheduleEngagementNotifications: async (
    context: EngagementNotificationContext = {},
    options: { requestPermission?: boolean } = {}
  ) => {
    lastEngagementNotificationContext = context;
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

      const now = new Date();
      const preferences = getEngagementNotificationPreferences();
      const plans = createEngagementNotificationPlans(context, now, preferences);
      const pending = await LocalNotifications.getPending();
      const existingEngagementNotifications = pending.notifications.filter(notification =>
        ENGAGEMENT_NOTIFICATION_IDS.includes(notification.id)
      );

      if (!preferences.enabled) {
        if (existingEngagementNotifications.length > 0) {
          await LocalNotifications.cancel({ notifications: existingEngagementNotifications });
        }
        console.log('[Notifications] Engagement notifications disabled by user preference');
        return;
      }

      if (plans.length === 0) {
        if (existingEngagementNotifications.length > 0) {
          await LocalNotifications.cancel({ notifications: existingEngagementNotifications });
        }
        console.log('[Notifications] No engagement notifications to schedule');
        return;
      }

      const signature = buildScheduleSignature(plans);
      const scheduleState = readJson<EngagementScheduleState>(NOTIFICATION_SCHEDULE_STATE_KEY);
      if (
        existingEngagementNotifications.length > 0 &&
        scheduleState?.signature === signature &&
        now.getTime() - scheduleState.scheduledAt < RESCHEDULE_COOLDOWN_MS
      ) {
        console.log('[Notifications] Engagement schedule unchanged; keeping existing local notifications');
        return;
      }

      if (existingEngagementNotifications.length > 0) {
        await LocalNotifications.cancel({ notifications: existingEngagementNotifications });
      }

      await LocalNotifications.schedule({
        notifications: plans.map(plan => ({
          id: plan.id,
          title: plan.title,
          body: plan.body,
          channelId: ENGAGEMENT_CHANNEL_ID,
          smallIcon: 'ic_stat_notification',
          autoCancel: true,
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

      writeJson<EngagementScheduleState>(NOTIFICATION_SCHEDULE_STATE_KEY, {
        signature,
        scheduledAt: now.getTime(),
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

i18n.on('languageChanged', () => {
  void notificationScheduler.scheduleEngagementNotifications(lastEngagementNotificationContext);
});
