/**
 * Native notification helper.
 *
 * Phone notifications are limited to engagement reminders. Achievement,
 * combo, high-score, and event popups stay in-app only.
 */

import { Capacitor } from '@capacitor/core';
import {
  notificationScheduler,
} from '@services/notifications/pushNotificationService';

let LocalNotifications: any = null;

async function getLocalNotifications() {
  if (!LocalNotifications && Capacitor.isNativePlatform()) {
    try {
      const module = await import('@capacitor/local-notifications');
      LocalNotifications = module.LocalNotifications;
    } catch (error) {
      console.error('[Notification] Failed to load Local Notifications plugin:', error);
    }
  }
  return LocalNotifications;
}

export function isNotificationSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return false;

    const result = await plugin.checkPermissions();

    if (result.display === 'prompt' || result.display === 'prompt-with-rationale') {
      const permResult = await plugin.requestPermissions();
      return permResult.display === 'granted';
    }

    return result.display === 'granted';
  } catch (error) {
    console.error('[Notification] Permission request failed:', error);
    return false;
  }
}

export async function scheduleDailyReminder(): Promise<void> {
  await notificationScheduler.scheduleEngagementNotifications();
}

export async function cancelAllNotifications(): Promise<void> {
  if (!isNotificationSupported()) return;

  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;

    const pending = await plugin.getPending();
    if (pending.notifications.length > 0) {
      await plugin.cancel(pending);
    }
  } catch (error) {
    console.error('[Notification] Failed to cancel notifications:', error);
  }
}

export async function addNotificationActionListener(
  callback: (action: any) => void
): Promise<void> {
  if (!isNotificationSupported()) return;

  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;

    await plugin.addListener('localNotificationActionPerformed', callback);
  } catch (error) {
    console.error('[Notification] Failed to add action listener:', error);
  }
}
