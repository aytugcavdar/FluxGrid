/**
 * Cleanup Expired Nonces
 * 
 * Scheduled Cloud Function to clean up expired nonces from Firestore.
 * Runs daily as backup to Firestore TTL policy.
 * 
 * Requirements: 2.10
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Clean up expired nonces
 * Runs daily at 2:00 AM UTC
 * 
 * Firestore TTL policy should handle most cleanup automatically,
 * but this function provides backup cleanup for any missed entries.
 */
export const cleanupExpiredNonces = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2:00 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    console.log('[NonceCleanup] Starting cleanup of expired nonces');
    
    try {
      // Query for expired nonces
      const expiredNonces = await admin.firestore()
        .collection('nonces')
        .where('expiresAt', '<=', now)
        .limit(500) // Process in batches
        .get();
      
      if (expiredNonces.empty) {
        console.log('[NonceCleanup] No expired nonces found');
        return null;
      }
      
      // Delete expired nonces in batch
      const batch = admin.firestore().batch();
      let deleteCount = 0;
      
      expiredNonces.docs.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });
      
      await batch.commit();
      
      console.log(`[NonceCleanup] Deleted ${deleteCount} expired nonces`);
      
      // If we hit the limit, there might be more to clean
      if (deleteCount === 500) {
        console.log('[NonceCleanup] More expired nonces may exist, will clean on next run');
      }
      
      return { deleted: deleteCount };
    } catch (error) {
      console.error('[NonceCleanup] Error cleaning up nonces', error);
      throw error;
    }
  });
