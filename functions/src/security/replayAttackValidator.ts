/**
 * Replay Attack Validator
 * 
 * Validates nonces and timestamps to prevent replay attacks.
 * Ensures each score submission is unique and recent.
 * 
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.9
 */

import * as admin from 'firebase-admin';

/**
 * Validate replay attack prevention
 * 
 * Checks:
 * 1. Timestamp is within 5 minutes of server time
 * 2. Nonce hasn't been used before
 * 3. Stores nonce with TTL for cleanup
 * 
 * @param nonce - Unique nonce for this submission
 * @param timestamp - Client timestamp in milliseconds
 * @param uid - User ID for logging
 * @returns true if valid, false if replay attack detected
 */
export async function validateReplayAttack(
  nonce: string,
  timestamp: number,
  uid: string
): Promise<boolean> {
  const now = Date.now();
  
  // Check 1: Timestamp must be within 5 minutes
  const timeDiff = Math.abs(now - timestamp);
  const fiveMinutes = 5 * 60 * 1000;
  
  if (timeDiff > fiveMinutes) {
    console.warn('[ReplayAttack] Timestamp too old or in future', {
      uid,
      timestamp,
      serverTime: now,
      diffMinutes: Math.round(timeDiff / 60000),
    });
    return false;
  }
  
  // Check 2: Nonce must be unique (not used before)
  const nonceRef = admin.firestore().doc(`nonces/${nonce}`);
  const nonceDoc = await nonceRef.get();
  
  if (nonceDoc.exists) {
    // Replay attack detected!
    console.error('[ReplayAttack] Duplicate nonce detected', {
      uid,
      nonce,
      timestamp,
      originalTimestamp: nonceDoc.data()?.timestamp,
    });
    
    // Log to suspicious_scores collection
    await logSuspiciousActivity('replay_attack', {
      uid,
      nonce,
      timestamp,
      detectedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return false;
  }
  
  // Check 3: Store nonce with TTL (expires in 10 minutes)
  const expiresAt = admin.firestore.Timestamp.fromMillis(now + 10 * 60 * 1000);
  
  await nonceRef.set({
    uid,
    timestamp,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
  });
  
  console.log('[ReplayAttack] Validation passed', {
    uid,
    nonce: nonce.substring(0, 8) + '...', // Log only first 8 chars for privacy
  });
  
  return true;
}

/**
 * Log suspicious activity to Firestore
 * 
 * @param type - Type of suspicious activity
 * @param data - Additional data to log
 */
async function logSuspiciousActivity(type: string, data: any): Promise<void> {
  try {
    await admin.firestore().collection('suspicious_scores').add({
      type,
      ...data,
      status: 'pending_review',
    });
  } catch (error) {
    console.error('[ReplayAttack] Failed to log suspicious activity', error);
  }
}
