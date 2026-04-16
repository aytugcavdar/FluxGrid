/**
 * Multi-Account Detector
 * 
 * Detects users creating multiple accounts using the same device.
 * Allows up to 2 accounts per device (family sharing).
 * 
 * Requirements: 3.5, 3.6, 3.7, 3.10
 */

import * as admin from 'firebase-admin';

/**
 * Detect multi-accounting
 * 
 * Queries Firestore for accounts with the same device fingerprint.
 * Flags accounts if more than 2 share the same fingerprint.
 * 
 * @param uid - User ID submitting the score
 * @param fingerprint - Device fingerprint hash
 */
export async function detectMultiAccounting(
  uid: string,
  fingerprint: string
): Promise<void> {
  if (!fingerprint) {
    console.log('[MultiAccount] No fingerprint provided, skipping detection');
    return;
  }

  try {
    // Query for all accounts with this fingerprint
    const accountsQuery = await admin.firestore()
      .collection('users')
      .where('deviceFingerprint', '==', fingerprint)
      .get();

    const accountCount = accountsQuery.size;
    const accountIds = accountsQuery.docs.map(doc => doc.id);

    console.log(`[MultiAccount] Found ${accountCount} accounts with fingerprint ${fingerprint.substring(0, 8)}...`);

    // Allow up to 2 accounts (family sharing)
    if (accountCount > 2) {
      console.warn(`[MultiAccount] Multiple accounts detected: ${accountCount} accounts`, {
        fingerprint: fingerprint.substring(0, 8) + '...',
        accounts: accountIds,
      });

      // Check if already flagged
      const existingFlag = await admin.firestore()
        .collection('multi_account_detection')
        .where('fingerprint', '==', fingerprint)
        .limit(1)
        .get();

      if (existingFlag.empty) {
        // Create new flag entry
        await admin.firestore().collection('multi_account_detection').add({
          fingerprint,
          accounts: accountIds,
          accountCount,
          detectedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'flagged',
          reviewedAt: null,
          notes: null,
        });

        console.log(`[MultiAccount] Flagged ${accountCount} accounts for review`);
      } else {
        // Update existing flag
        const flagDoc = existingFlag.docs[0];
        await flagDoc.ref.update({
          accounts: accountIds,
          accountCount,
          lastDetectedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[MultiAccount] Updated existing flag for ${accountCount} accounts`);
      }
    } else {
      console.log(`[MultiAccount] Account count (${accountCount}) within allowed limit (2)`);
    }

    // Update user document with fingerprint
    await admin.firestore().doc(`users/${uid}`).set({
      deviceFingerprint: fingerprint,
      lastFingerprintUpdate: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

  } catch (error) {
    console.error('[MultiAccount] Error detecting multi-accounting', error);
    // Don't throw - this is a monitoring feature, not critical
  }
}

/**
 * Check if account is flagged for multi-accounting
 * 
 * @param uid - User ID to check
 * @returns true if flagged
 */
export async function isAccountFlagged(uid: string): Promise<boolean> {
  try {
    // Get user's fingerprint
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return false;
    }

    const fingerprint = userDoc.data()?.deviceFingerprint;
    if (!fingerprint) {
      return false;
    }

    // Check if fingerprint is flagged
    const flagQuery = await admin.firestore()
      .collection('multi_account_detection')
      .where('fingerprint', '==', fingerprint)
      .where('status', '==', 'flagged')
      .limit(1)
      .get();

    return !flagQuery.empty;
  } catch (error) {
    console.error('[MultiAccount] Error checking account flag', error);
    return false;
  }
}
