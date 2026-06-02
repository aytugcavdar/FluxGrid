/**
 * Save FCM Token Cloud Function
 * Stores FCM tokens for push notifications
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface FCMTokenRequest {
  token: string;
  platform: string;
  timestamp: number;
  locale?: string;
  timezone?: string;
  appVersion?: string | null;
  active?: boolean;
}

/**
 * Save FCM token to Firestore
 * Endpoint: POST /saveFCMToken
 */
export const saveFCMToken = functions.https.onRequest(async (req, res) => {
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
    const { token, platform, timestamp, locale, timezone, appVersion, active } = req.body as FCMTokenRequest;

    // Validate input
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    if (!platform || typeof platform !== 'string') {
      res.status(400).json({ error: 'Invalid platform' });
      return;
    }

    // Save to Firestore
    const db = admin.firestore();
    const tokenRef = db.collection('fcm_tokens').doc(token);
    const tokenSnapshot = await tokenRef.get();
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    const tokenData: admin.firestore.DocumentData = {
      token,
      platform,
      timestamp: timestamp || Date.now(),
      locale: typeof locale === 'string' ? locale : null,
      timezone: typeof timezone === 'string' ? timezone : null,
      appVersion: typeof appVersion === 'string' ? appVersion : null,
      updatedAt: serverTimestamp,
      lastSeenAt: serverTimestamp,
      active: typeof active === 'boolean' ? active : true,
    };

    if (!tokenSnapshot.exists) {
      tokenData.createdAt = serverTimestamp;
    }

    await tokenRef.set(tokenData, { merge: true });

    console.log('[FCM] Token saved:', { token: token.substring(0, 20) + '...', platform });

    res.status(200).json({ 
      success: true,
      message: 'Token saved successfully' 
    });
  } catch (error) {
    console.error('[FCM] Error saving token:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
