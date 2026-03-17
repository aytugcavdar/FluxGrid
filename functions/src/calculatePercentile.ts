import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Calculate user's percentile rank when they submit a score
 * Triggered on: leaderboards/{mode}/scores/{uid} onCreate
 */
export const calculatePercentile = functions.firestore
  .document('leaderboards/{mode}/scores/{uid}')
  .onCreate(async (snapshot, context) => {
    const { mode, uid } = context.params;
    const userScore = snapshot.data().score;

    try {
      // Query all scores for this mode
      const scoresRef = db.collection(`leaderboards/${mode}/scores`);
      const allScores = await scoresRef.get();
      const totalPlayers = allScores.size;

      if (totalPlayers === 0) {
        return { percentile: 0 };
      }

      // Count players with lower scores
      const playersBelow = allScores.docs.filter(
        (doc) => doc.data().score < userScore
      ).length;

      // Calculate percentile
      const percentile = Math.round((playersBelow / totalPlayers) * 100);

      // Update user's modeStats
      await db
        .doc(`users/${uid}/modeStats/${mode}`)
        .set({ topPercentile: percentile }, { merge: true });

      console.log(`Calculated percentile for ${uid} in ${mode}: ${percentile}%`);

      return { percentile };
    } catch (error) {
      console.error('Error calculating percentile:', error);
      throw error;
    }
  });
