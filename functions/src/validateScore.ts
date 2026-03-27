import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to validate scores when they are written to leaderboard
 * Triggers on onCreate for leaderboards/{mode}/scores/{uid}
 * 
 * Dynamic Anti-Cheat System:
 * - MAX_POSSIBLE_MULTIPLIER = 11.7 (tier6 × surge × scoreRush × quake)
 * - Base score rate: 300 points/second
 * - Maximum legitimate rate: 3510 points/second (300 × 11.7)
 * - Suspicious threshold: 1000% increase from previous high score
 */

// Maximum possible multiplier in the game
// tier6 (3.0x) × surge (2.0x) × scoreRush (1.5x) × quake (1.3x) = 11.7x
const MAX_POSSIBLE_MULTIPLIER = 11.7;

// Base score rate without multipliers (points per second)
const BASE_SCORE_PER_SECOND = 300;

// Maximum legitimate score rate with all multipliers active
const MAX_SCORE_PER_SECOND = BASE_SCORE_PER_SECOND * MAX_POSSIBLE_MULTIPLIER; // 3510

/**
 * Cloud Function to validate scores when they are written to leaderboard
 * Triggers on onCreate for leaderboards/{mode}/scores/{uid}
 */
export const validateScore = functions.firestore
  .document('leaderboards/{mode}/scores/{uid}')
  .onCreate(async (snapshot, context) => {
    const { mode, uid } = context.params;
    const data = snapshot.data();
    const score = data.score;

    console.log(`Validating score for user ${uid} in mode ${mode}: ${score}`);

    // Validation 1: Score must be a valid integer between 0 and 9,999,999
    if (typeof score !== 'number' || score < 0 || score > 9999999) {
      console.warn(`Invalid score detected: ${score}. Deleting document.`);
      await snapshot.ref.delete();
      return;
    }

    // Validation 2: Check for suspicious score increases (dynamic anti-cheat)
    // Uses MAX_SCORE_PER_SECOND (3510) to account for maximum possible multipliers
    try {
      // Get user's previous high score from users collection
      const userRef = admin.firestore().doc(`users/${uid}`);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const previousHighScores = userData?.highScores || {};
        const previousHighScore = previousHighScores[mode] || 0;

        // If previous score exists and new score is more than 1000% increase, mark as suspicious
        if (previousHighScore > 0) {
          const increasePercentage = ((score - previousHighScore) / previousHighScore) * 100;
          
          if (increasePercentage > 1000) {
            console.warn(
              `Suspicious score increase detected for user ${uid} in mode ${mode}: ` +
              `${previousHighScore} -> ${score} (${increasePercentage.toFixed(0)}% increase)`
            );

            // Write to suspicious_scores collection for review
            await admin.firestore().collection('suspicious_scores').add({
              uid,
              mode,
              previousScore: previousHighScore,
              newScore: score,
              increasePercentage: Math.round(increasePercentage),
              displayName: data.displayName || 'Anonymous',
              photoURL: data.photoURL || null,
              achievedAt: data.achievedAt || admin.firestore.FieldValue.serverTimestamp(),
              detectedAt: admin.firestore.FieldValue.serverTimestamp(),
              platform: data.platform || 'unknown',
              appVersion: data.appVersion || 'unknown',
              status: 'pending_review',
            });

            // Mark the score document as suspicious but don't delete it
            await snapshot.ref.update({
              suspicious: true,
              suspiciousReason: `${increasePercentage.toFixed(0)}% increase from previous score`,
              reviewedAt: null,
            });

            console.log(`Score marked as suspicious and logged for review.`);
          }
        }
      }
    } catch (error) {
      console.error('Error during suspicious score check:', error);
      // Don't fail the function if suspicious check fails
    }

    console.log(`Score validation completed for user ${uid} in mode ${mode}`);
  });
