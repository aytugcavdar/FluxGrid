/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 */

import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema,
  ActionPerformed 
} from '@capacitor/push-notifications';
import { 
  LocalNotifications,
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Notification types
 */
export enum NotificationType {
  DAILY_CHALLENGE = 'daily_challenge',
  DAILY_REWARD = 'daily_reward',
  LEADERBOARD_UPDATE = 'leaderboard_update',
  ACHIEVEMENT = 'achievement',
  WEEKLY_STATS = 'weekly_stats',
}

/**
 * Notification data interface
 */
interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Push Notification Service
 */
class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize push notifications
   */
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
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register with FCM
        await PushNotifications.register();
        
        // Set up listeners
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

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Registration success
    PushNotifications.addListener('registration', (token: Token) => {
      this.fcmToken = token.value;
      console.log('[PushNotifications] FCM Token:', token.value);
      
      // Send token to backend
      this.sendTokenToBackend(token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[PushNotifications] Registration error:', error);
    });

    // Notification received (app in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('[PushNotifications] Received:', notification);
        this.handleForegroundNotification(notification);
      }
    );

    // Notification action performed (user tapped)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('[PushNotifications] Action performed:', action);
        this.handleNotificationAction(action);
      }
    );
  }

  /**
   * Send FCM token to backend
   */
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
          timestamp: Date.now()
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

  /**
   * Handle notification received in foreground
   */
  private handleForegroundNotification(notification: PushNotificationSchema): void {
    // Show in-app notification or update UI
    const { title, body, data } = notification;
    
    // You can show a custom in-app notification here
    console.log('[PushNotifications] Foreground notification:', { title, body, data });
  }

  /**
   * Handle notification action (user tapped)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const { notification } = action;
    const data = notification.data;

    // Navigate based on notification type
    if (data?.type === NotificationType.DAILY_CHALLENGE) {
      // Navigate to daily challenge
      window.location.href = '/daily-challenge';
    } else if (data?.type === NotificationType.LEADERBOARD_UPDATE) {
      // Navigate to leaderboard
      window.location.href = '/leaderboard';
    } else if (data?.type === NotificationType.DAILY_REWARD) {
      // Navigate to rewards
      window.location.href = '/rewards';
    }
  }

  /**
   * Get FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
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

  /**
   * Request notification permission
   */
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

  /**
   * Schedule local notification
   */
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
            id: Date.now(),
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

/**
 * Notification scheduling helpers
 */
export const notificationScheduler = {
  /**
   * Schedule daily challenge reminder (9 AM every day)
   */
  scheduleDailyChallengeReminder: async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Check if notifications are enabled
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        console.log('[Notifications] Permission not granted, skipping schedule');
        return;
      }

      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(9, 0, 0, 0);
      
      // If 9 AM has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'FluxGrid Günlük Meydan Okuma! 🎮',
            body: 'Günlük görevini tamamla ve ödüllerini kazan!',
            id: 1,
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            extra: {
              type: NotificationType.DAILY_CHALLENGE,
            },
          },
        ],
      });
      
      console.log('[Notifications] Daily challenge reminder scheduled for', scheduledTime);
    } catch (error) {
      console.error('[Notifications] Failed to schedule daily challenge:', error);
    }
  },

  /**
   * Schedule daily reward reminder (8 PM every day)
   */
  scheduleDailyRewardReminder: async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Check if notifications are enabled
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        console.log('[Notifications] Permission not granted, skipping schedule');
        return;
      }

      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(20, 0, 0, 0);
      
      // If 8 PM has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Günlük Ödülün Seni Bekliyor! 🎁',
            body: 'FluxGrid\'e gir ve günlük ödülünü topla!',
            id: 2,
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            extra: {
              type: NotificationType.DAILY_REWARD,
            },
          },
        ],
      });
      
      console.log('[Notifications] Daily reward reminder scheduled for', scheduledTime);
    } catch (error) {
      console.error('[Notifications] Failed to schedule daily reward:', error);
    }
  },

  /**
   * Cancel all scheduled notifications
   */
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
