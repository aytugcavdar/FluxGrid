import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function: transferAnonymousScores
 * 
 * Triggers when a user document is updated and isAnonymous changes from true to false.
 * Migrates all leaderboard scores from the anonymous UID to the new Google UID.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
export const transferAnonymousScores = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const uid = context.params.uid;

    // Check if isAnonymous changed from true to false - Requirement 6.1
    if (before.isAnonymous !== true || after.isAnonymous !== false) {
      return null;
    }

    // Check if migration already completed (idempotency) - Requirement 6.6
    if (after.migrationCompleted === true) {
      console.log(`Migration already completed for ${uid}`);
      return null;
    }

    // Get previousUid from user document - Requirement 6.2
    const previousUid = after.previousUid;
    if (!previousUid) {
      console.error(`No previousUid found for ${uid}`);
      return null;
    }

    console.log(`Starting score migration: ${previousUid} -> ${uid}`);

    const db = admin.firestore();
    const gameModes = ['endless', 'timed', 'zen', 'daily']; // Requirement 6.3
    
    try {
      // For each game mode, copy scores - Requirement 3.1, 3.2
      for (const mode of gameModes) {
        const oldScoreRef = db.doc(`leaderboards/${mode}/scores/${previousUid}`);
        const newScoreRef = db.doc(`leaderboards/${mode}/scores/${uid}`);
        
        const oldScoreDoc = await oldScoreRef.get();
        
        if (oldScoreDoc.exists) {
          const oldScore = oldScoreDoc.data();
          const newScoreDoc = await newScoreRef.get();
          
          // Only copy if new score is higher (or doesn't exist) - Requirement 3.2
          if (!newScoreDoc.exists || (oldScore?.score ?? 0) > (newScoreDoc.data()?.score ?? 0)) {
            await newScoreRef.set({
              ...oldScore,
              uid, // Update UID to new Google UID
              displayName: after.displayName || 'Oyuncu',
              photoURL: after.photoURL || null,
              isAnonymous: false, // Update flag
              migratedFrom: previousUid, // Track migration source
              migratedAt: Date.now(),
            });
            
            console.log(`Migrated ${mode} score: ${oldScore?.score}`);
          }
          
          // Delete old anonymous score - Requirement 3.3, 6.4
          await oldScoreRef.delete();
        }
      }
      
      // Mark migration as completed - Requirement 6.5
      await db.doc(`users/${uid}`).update({
        migrationCompleted: true,
        migrationCompletedAt: Date.now(),
      });
      
      console.log(`Migration completed successfully for ${uid}`);
      return null;
    } catch (error) {
      console.error(`Migration failed for ${uid}:`, error);
      
      // Log error but don't retry (idempotency prevents issues) - Requirement 6.7
      await db.doc(`users/${uid}`).update({
        migrationError: error instanceof Error ? error.message : 'Unknown error',
        migrationAttemptedAt: Date.now(),
      });
      
      return null;
    }
  });
