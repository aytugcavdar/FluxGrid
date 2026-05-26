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

const ENGAGEMENT_TYPES = new Set([
  'daily_reminder',
  'streak_reminder',
  'near_record',
  'timed_mode',
  'inactivity',
]);

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

function dateSeed(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function pickCopy(type: string, variants: NotificationCopy[], date: Date = new Date()): NotificationCopy {
  return variants[stableIndex(`${type}:${dateSeed(date)}`, variants.length)];
}

function getScheduledEngagementCopy(type: 'daily_reminder' | 'inactivity', date: Date = new Date()): NotificationCopy {
  if (type === 'inactivity') {
    return pickCopy(type, [
      {
        title: 'Tahta seni unutmadi',
        body: 'Geri donus turu 2 dakika. Bir hamleyle ritmi yakalayalim.',
      },
      {
        title: 'FluxGrid yoklama aliyor',
        body: 'Bugun bir oyunluk isimiz var.',
      },
      {
        title: 'Kucuk bir geri donus',
        body: 'Bir kisa tur at; tahta tekrar canlansin.',
      },
    ], date);
  }

  return pickCopy(type, [
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
  ], date);
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

    if (!ENGAGEMENT_TYPES.has(notification.type)) {
      res.status(400).json({ error: 'Unsupported phone notification type' });
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
        priority: 'normal',
        collapseKey: notification.type,
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
function getChannelId(_type: string): string {
  return 'daily_reminders';
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
      const copy = getScheduledEngagementCopy('daily_reminder');

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: copy.title,
          body: copy.body,
        },
        data: {
          type: 'daily_reminder',
          target: 'home',
        },
        android: {
          priority: 'normal',
          collapseKey: 'daily_reminder',
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
      const copy = getScheduledEngagementCopy('inactivity');

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: copy.title,
          body: copy.body,
        },
        data: {
          type: 'inactivity',
          target: 'home',
        },
        android: {
          priority: 'normal',
          collapseKey: 'inactivity',
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
