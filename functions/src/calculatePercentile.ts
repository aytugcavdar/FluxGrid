import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Calculate user's percentile rank when they submit a score
 * Triggered on: leaderboards/{mode}/scores/{uid} onWrite
 * Only processes non-suspicious scores
 * 
 * OPTIMIZED: Uses getCountFromServer() instead of fetching all documents
 */
export const calculatePercentile = functions.firestore
  .document('leaderboards/{mode}/scores/{uid}')
  .onWrite(async (change, context) => {
    const { mode, uid } = context.params;
    
    // Get the data after the write
    const data = change.after.data();
    
    // If document was deleted, skip
    if (!data) {
      return null;
    }
    
    // If score is marked as suspicious, skip percentile calculation
    if (data.suspicious === true) {
      console.log(`Skipping percentile calculation for suspicious score: ${uid} in ${mode}`);
      return null;
    }
    
    const userScore = data.score;

    try {
      const scoresRef = db.collection(`leaderboards/${mode}/scores`);

      // Get total player count efficiently
      const totalPlayersSnapshot = await scoresRef.count().get();
      const totalPlayers = totalPlayersSnapshot.data().count;

      if (totalPlayers === 0) {
        return { percentile: 0 };
      }

      // Count players with lower scores efficiently
      const playersBelowSnapshot = await scoresRef
        .where('score', '<', userScore)
        .count()
        .get();
      const playersBelow = playersBelowSnapshot.data().count;

      // Calculate percentile
      const percentile = Math.round((playersBelow / totalPlayers) * 100);

      // Update user's modeStats
      await db
        .doc(`users/${uid}/modeStats/${mode}`)
        .set({ topPercentile: percentile }, { merge: true });

      console.log(`Calculated percentile for ${uid} in ${mode}: ${percentile}% (${playersBelow}/${totalPlayers})`);

      return { percentile, totalPlayers, playersBelow };
    } catch (error) {
      console.error('Error calculating percentile:', error);
      throw error;
    }
  });
