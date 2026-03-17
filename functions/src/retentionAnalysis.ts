import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Identify inactive users and schedule retention notifications
 * Triggered: Daily at 00:00 UTC
 */
export const retentionAnalysis = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    try {
      // Query inactive users
      const usersRef = db.collection('users');
      const inactiveUsers = await usersRef
        .where('lastSeenAt', '<', sevenDaysAgo)
        .where('isAnonymous', '==', false)
        .get();

      console.log(`Found ${inactiveUsers.size} inactive users`);

      const notifications: Promise<any>[] = [];

      for (const userDoc of inactiveUsers.docs) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        // Get user's peak hour from modeStats
        const modeStatsSnapshot = await db
          .collection(`users/${uid}/modeStats`)
          .get();

        let peakHour = 18; // Default to 6 PM
        if (!modeStatsSnapshot.empty) {
          const stats = modeStatsSnapshot.docs[0].data();
          peakHour = stats.peakHour || 18;
        }

        // Get user's current rank
        const leaderboardEntry = await db
          .doc(`leaderboards/endless/scores/${uid}`)
          .get();

        let rank: number | null = null;
        if (leaderboardEntry.exists) {
          const userScore = leaderboardEntry.data()!.score;
          const higherScores = await db
            .collection('leaderboards/endless/scores')
            .where('score', '>', userScore)
            .get();
          rank = higherScores.size + 1;
        }

        // Prepare notification message
        const message: admin.messaging.MulticastMessage = {
          notification: {
            title: 'Your rank is dropping!',
            body: rank
              ? `You're now #${rank}. Competitors are catching up!`
              : 'Come back and set a new high score!',
          },
          data: {
            type: 'retention',
            screen: 'leaderboard',
            peakHour: peakHour.toString(),
          },
          tokens: userData.deviceTokens || [],
        };

        // Send notification if user has device tokens
        if (message.tokens && message.tokens.length > 0) {
          notifications.push(
            admin
              .messaging()
              .sendMulticast(message)
              .then(async (response) => {
                console.log(`Sent notification to ${uid}: ${response.successCount} successful`);
                
                // Remove invalid tokens
                if (response.failureCount > 0) {
                  const tokensToRemove: string[] = [];
                  response.responses.forEach((resp, idx) => {
                    if (!resp.success && message.tokens) {
                      tokensToRemove.push(message.tokens[idx]);
                    }
                  });

                  if (tokensToRemove.length > 0) {
                    await db.doc(`users/${uid}`).update({
                      deviceTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
                    });
                  }
                }
              })
              .catch((error) => {
                console.error(`Failed to send notification to ${uid}:`, error);
              })
          );
        }
      }

      await Promise.all(notifications);

      console.log(`Processed ${inactiveUsers.size} inactive users`);

      return { processedUsers: inactiveUsers.size };
    } catch (error) {
      console.error('Error in retention analysis:', error);
      throw error;
    }
  });
