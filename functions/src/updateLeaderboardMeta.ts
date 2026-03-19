import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Update leaderboard meta/summary when a new score is submitted
 * Triggered on: leaderboards/{mode}/scores/{uid} onWrite
 * 
 * Creates/updates: leaderboards/{mode}/meta/summary
 * Contains:
 * - top10: Array of top 10 players (cached)
 * - totalPlayers: Total number of players
 * - lastUpdated: Timestamp
 */
export const updateLeaderboardMeta = functions.firestore
  .document('leaderboards/{mode}/scores/{uid}')
  .onWrite(async (change, context) => {
    const { mode } = context.params;
    
    try {
      const scoresRef = db.collection(`leaderboards/${mode}/scores`);
      const metaRef = db.doc(`leaderboards/${mode}/meta/summary`);

      // Get total player count efficiently
      const totalPlayersSnapshot = await scoresRef.count().get();
      const totalPlayers = totalPlayersSnapshot.data().count;

      // Get top 10 players
      const top10Snapshot = await scoresRef
        .orderBy('score', 'desc')
        .limit(10)
        .get();

      const top10 = top10Snapshot.docs.map((doc, index) => ({
        uid: doc.id,
        rank: index + 1,
        ...doc.data(),
      }));

      // Update meta document
      await metaRef.set({
        top10,
        totalPlayers,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        mode,
      });

      console.log(`Updated leaderboard meta for ${mode}: ${totalPlayers} players, top score: ${top10[0]?.score || 0}`);

      return { success: true, totalPlayers, top10Count: top10.length };
    } catch (error) {
      console.error('Error updating leaderboard meta:', error);
      throw error;
    }
  });
