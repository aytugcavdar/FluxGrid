/**
 * Send Push Notification Cloud Function
 * Sends push notifications to registered devices
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
}

interface SendNotificationRequest {
  tokens?: string[];
  topic?: string;
  notification: NotificationPayload;
}

/**
 * Send push notification to specific tokens or topic
 * Endpoint: POST /sendPushNotification
 */
export const sendPushNotification = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { tokens, topic, notification } = req.body as SendNotificationRequest;

    // Validate input
    if (!notification || !notification.title || !notification.body) {
      res.status(400).json({ error: 'Invalid notification payload' });
      return;
    }

    if (!tokens && !topic) {
      res.status(400).json({ error: 'Either tokens or topic must be provided' });
      return;
    }

    const message: Partial<admin.messaging.Message> = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: notification.type,
        ...(notification.data || {}),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: getChannelId(notification.type),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    let result;

    if (tokens && tokens.length > 0) {
      // Send to specific tokens
      result = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: message.notification,
        data: message.data,
        android: message.android,
        apns: message.apns,
      });

      console.log('[FCM] Sent to tokens:', {
        success: result.successCount,
        failure: result.failureCount,
      });
    } else if (topic) {
      // Send to topic
      result = await admin.messaging().send({
        topic,
        notification: message.notification,
        data: message.data,
        android: message.android,
        apns: message.apns,
      });

      console.log('[FCM] Sent to topic:', topic);
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get Android notification channel ID based on notification type
 */
function getChannelId(type: string): string {
  switch (type) {
    case 'daily_challenge':
      return 'daily_reminders';
    case 'daily_reward':
      return 'daily_reminders';
    case 'achievement':
      return 'achievements';
    case 'leaderboard_update':
      return 'events';
    case 'weekly_stats':
      return 'events';
    default:
      return 'default';
  }
}

/**
 * Scheduled function to send daily challenge reminder
 * Runs every day at 9 AM UTC
 */
export const sendDailyChallengeReminder = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const tokensSnapshot = await db
        .collection('fcm_tokens')
        .where('active', '==', true)
        .get();

      if (tokensSnapshot.empty) {
        console.log('[FCM] No active tokens found');
        return;
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: 'FluxGrid Günlük Meydan Okuma! 🎮',
          body: 'Günlük görevini tamamla ve ödüllerini kazan!',
        },
        data: {
          type: 'daily_challenge',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'daily_reminders',
          },
        },
        tokens,
      };

      const result = await admin.messaging().sendEachForMulticast(message);

      console.log('[FCM] Daily challenge reminder sent:', {
        success: result.successCount,
        failure: result.failureCount,
      });

      // Remove invalid tokens
      if (result.failureCount > 0) {
        const batch = db.batch();
        result.responses.forEach((response, index) => {
          if (!response.success) {
            const tokenDoc = tokensSnapshot.docs[index];
            batch.update(tokenDoc.ref, { active: false });
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('[FCM] Error sending daily challenge reminder:', error);
    }
  });

/**
 * Scheduled function to send daily reward reminder
 * Runs every day at 8 PM UTC
 */
export const sendDailyRewardReminder = functions.pubsub
  .schedule('0 20 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const tokensSnapshot = await db
        .collection('fcm_tokens')
        .where('active', '==', true)
        .get();

      if (tokensSnapshot.empty) {
        console.log('[FCM] No active tokens found');
        return;
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: 'Günlük Ödülün Seni Bekliyor! 🎁',
          body: 'FluxGrid\'e gir ve günlük ödülünü topla!',
        },
        data: {
          type: 'daily_reward',
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'daily_reminders',
          },
        },
        tokens,
      };

      const result = await admin.messaging().sendEachForMulticast(message);

      console.log('[FCM] Daily reward reminder sent:', {
        success: result.successCount,
        failure: result.failureCount,
      });

      // Remove invalid tokens
      if (result.failureCount > 0) {
        const batch = db.batch();
        result.responses.forEach((response, index) => {
          if (!response.success) {
            const tokenDoc = tokensSnapshot.docs[index];
            batch.update(tokenDoc.ref, { active: false });
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('[FCM] Error sending daily reward reminder:', error);
    }
  });
