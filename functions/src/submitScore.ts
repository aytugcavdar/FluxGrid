/**
 * Submit Score Cloud Function
 * 
 * Callable function for submitting scores with App Check enforcement.
 * This replaces direct Firestore writes from the client.
 * 
 * Requirements: 1.7
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { requireAppCheck } from './middleware/appCheckMiddleware';
import { validateReplayAttack } from './security/replayAttackValidator';
import { detectMultiAccounting } from './security/multiAccountDetector';

interface SubmitScoreData {
  score: number;
  mode: string;
  nonce: string;
  timestamp: number;
  deviceFingerprint?: string;
  checksum?: string;
  displayName?: string;
  photoURL?: string;
  platform?: string;
  appVersion?: string;
}

/**
 * Submit score with App Check enforcement
 * Replaces direct client writes to leaderboards collection
 */
export const submitScore = functions.https.onCall(
  requireAppCheck(async (data: SubmitScoreData, context) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to submit scores'
      );
    }

    const uid = context.auth.uid;
    const { score, mode, nonce, timestamp, deviceFingerprint, checksum, displayName, photoURL, platform, appVersion } = data;

    // Validate input
    if (typeof score !== 'number' || score < 0 || score > 9999999) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Score must be a number between 0 and 9,999,999'
      );
    }

    if (!mode || typeof mode !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Mode is required and must be a string'
      );
    }

    if (!nonce || typeof nonce !== 'string' || nonce.length !== 32) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Nonce is required and must be a 32-character hex string'
      );
    }

    if (!timestamp || typeof timestamp !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Timestamp is required and must be a number'
      );
    }

    try {
      // Validate replay attack (nonce + timestamp)
      const isValid = await validateReplayAttack(nonce, timestamp, uid);
      if (!isValid) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Invalid submission: replay attack detected or timestamp expired'
        );
      }

      // Detect multi-accounting (if fingerprint provided)
      if (deviceFingerprint) {
        await detectMultiAccounting(uid, deviceFingerprint);
      }

      // Write score to leaderboard
      // This will trigger the validateScore function
      await admin.firestore()
        .doc(`leaderboards/${mode}/scores/${uid}`)
        .set({
          score,
          displayName: displayName || 'Anonymous',
          photoURL: photoURL || null,
          achievedAt: admin.firestore.FieldValue.serverTimestamp(),
          platform: platform || 'unknown',
          appVersion: appVersion || 'unknown',
          deviceFingerprint: deviceFingerprint || null,
          checksum: checksum || null,
          uid,
        });

      console.log(`Score submitted successfully for user ${uid} in mode ${mode}: ${score}`);

      return {
        success: true,
        score,
        mode,
      };
    } catch (error) {
      console.error('Error submitting score:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to submit score',
        { error: String(error) }
      );
    }
  })
);
