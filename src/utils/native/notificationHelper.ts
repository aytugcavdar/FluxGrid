/**
 * Notification Helper for Achievement Notifications
 * Uses Capacitor Local Notifications plugin for native notifications
 */

import { Achievement } from '@features/game/types';
import { Capacitor } from '@capacitor/core';

// Lazy load Local Notifications plugin
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

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Request notification permission (Android 13+)
 */
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

/**
 * Show achievement unlock notification with rich content
 */
export async function showAchievementNotification(
  achievement: Achievement
): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    // Check permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('[Notification] Permission not granted');
      return;
    }
    
    // Schedule rich notification
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: '🏅 Başarım Açıldı!',
          body: `${achievement.name}\n${achievement.description}`,
          channelId: 'achievements',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: 'default',
          autoCancel: true,
          group: 'achievements',
          groupSummary: false,
          extra: {
            achievementId: achievement.id,
          },
          actionTypeId: 'ACHIEVEMENT_ACTIONS',
        }
      ]
    });
    
    console.log('[Notification] Achievement notification scheduled:', achievement.name);
  } catch (error) {
    console.error('[Notification] Failed to show achievement notification:', error);
  }
}

/**
 * Show daily streak reminder notification
 */
export async function showDailyStreakReminder(streak: number): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const messages = [
      `🔥 ${streak} günlük serin devam ediyor! Bugün de oyna!`,
      `⚡ ${streak} gün üst üste! Serini kırma!`,
      `🎮 ${streak} günlük başarı! Devam et!`,
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: 'FluxGrid - Günlük Hatırlatıcı',
          body: message,
          channelId: 'daily_reminders',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: null,
          autoCancel: true,
          group: 'reminders',
        }
      ]
    });
  } catch (error) {
    console.error('[Notification] Failed to show daily reminder:', error);
  }
}

/**
 * Show achievement progress notification
 */
export async function showAchievementProgress(
  achievementName: string,
  current: number,
  target: number
): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const remaining = target - current;
    const percentage = Math.floor((current / target) * 100);
    
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: `📊 ${achievementName}`,
          body: `Sadece ${remaining} kaldı! (%${percentage})`,
          channelId: 'achievements',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: null,
          autoCancel: true,
          group: 'achievements',
          ongoing: false,
        }
      ]
    });
  } catch (error) {
    console.error('[Notification] Failed to show progress notification:', error);
  }
}

/**
 * Schedule daily reminder notification
 */
export async function scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    // Calculate next reminder time
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    await plugin.schedule({
      notifications: [
        {
          id: 999, // Fixed ID for daily reminder
          title: 'FluxGrid',
          body: 'Günlük görevlerini tamamlamayı unutma! 🎮',
          channelId: 'daily_reminders',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: null,
          autoCancel: true,
          schedule: {
            at: scheduledTime,
            repeats: true,
            every: 'day',
          },
        }
      ]
    });
    
    console.log('[Notification] Daily reminder scheduled for', scheduledTime);
  } catch (error) {
    console.error('[Notification] Failed to schedule daily reminder:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    await plugin.cancel({ notifications: [] });
    console.log('[Notification] All notifications cleared');
  } catch (error) {
    console.error('[Notification] Failed to cancel notifications:', error);
  }
}

/**
 * Show combo milestone notification
 */
export async function showComboMilestoneNotification(combo: number): Promise<void> {
  if (!isNotificationSupported() || combo < 5) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const messages: Record<number, string> = {
      5: '🔥 5x Combo! Harika başlangıç!',
      10: '⚡ 10x Combo! İnanılmaz!',
      15: '💥 15x Combo! Efsanesin!',
      20: '🌟 20x Combo! Tanrı modu!',
    };
    
    const message = messages[combo] || `🎯 ${combo}x Combo! Devam et!`;
    
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: 'Combo Başarısı!',
          body: message,
          channelId: 'achievements',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: 'default',
          autoCancel: true,
          group: 'combo',
          actionTypeId: 'COMBO_ACTIONS',
          extra: {
            combo: combo.toString(),
          },
        }
      ]
    });
  } catch (error) {
    console.error('[Notification] Failed to show combo notification:', error);
  }
}

/**
 * Show high score notification
 */
export async function showHighScoreNotification(score: number, mode: string): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const modeNames: Record<string, string> = {
      'ENDLESS': 'Sonsuz',
      'TIMED': 'Zamanlı',
      'ZEN': 'Zen',
    };
    
    const modeName = modeNames[mode] || mode;
    
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: '🏆 Yeni Rekor!',
          body: `${modeName} modda ${score.toLocaleString('tr-TR')} puan!`,
          channelId: 'achievements',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: 'default',
          autoCancel: true,
          group: 'highscore',
          actionTypeId: 'HIGHSCORE_ACTIONS',
          extra: {
            score: score.toString(),
            mode: mode,
          },
        }
      ]
    });
  } catch (error) {
    console.error('[Notification] Failed to show high score notification:', error);
  }
}

/**
 * Show event notification
 */
export async function showEventNotification(eventName: string): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;
    
    const eventNames: Record<string, string> = {
      'ICE_STORM': '❄️ Buz Fırtınası',
      'GRAVITY_RUSH': '🌀 Yerçekimi Dalgası',
      'QUAKE': '💥 Deprem',
      'MIRROR': '🪞 Ayna',
      'CHAOS': '🌪️ Kaos',
      'VOID': '🕳️ Boşluk',
    };
    
    const displayName = eventNames[eventName] || eventName;
    
    await plugin.schedule({
      notifications: [
        {
          id: Date.now(),
          title: 'Yeni Event!',
          body: `${displayName} başladı!`,
          channelId: 'events',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_launcher',
          sound: 'default',
          autoCancel: true,
          group: 'events',
        }
      ]
    });
  } catch (error) {
    console.error('[Notification] Failed to show event notification:', error);
  }
}


/**
 * Register notification action types
 * Call this on app initialization
 */
export async function registerNotificationActions(): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    // Register action types
    await plugin.registerActionTypes({
      types: [
        {
          id: 'COMBO_ACTIONS',
          actions: [
            {
              id: 'play_again',
              title: 'Tekrar Oyna',
            },
            {
              id: 'share',
              title: 'Paylaş',
            },
          ],
        },
        {
          id: 'HIGHSCORE_ACTIONS',
          actions: [
            {
              id: 'play_again',
              title: 'Tekrar Oyna',
            },
            {
              id: 'share',
              title: 'Paylaş',
            },
            {
              id: 'view_stats',
              title: 'İstatistikler',
            },
          ],
        },
        {
          id: 'ACHIEVEMENT_ACTIONS',
          actions: [
            {
              id: 'view',
              title: 'Görüntüle',
            },
            {
              id: 'share',
              title: 'Paylaş',
            },
          ],
        },
      ],
    });
    
    console.log('[Notification] Action types registered');
  } catch (error) {
    console.error('[Notification] Failed to register action types:', error);
  }
}

/**
 * Add notification action listener
 * Call this on app initialization
 */
export async function addNotificationActionListener(
  callback: (action: any) => void
): Promise<void> {
  if (!isNotificationSupported()) {
    return;
  }
  
  try {
    const plugin = await getLocalNotifications();
    if (!plugin) return;
    
    await plugin.addListener('localNotificationActionPerformed', callback);
    console.log('[Notification] Action listener added');
  } catch (error) {
    console.error('[Notification] Failed to add action listener:', error);
  }
}
