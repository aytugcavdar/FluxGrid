import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import type {
  UserData,
  GameData,
  ModeStats,
  DailyData,
  GameMode,
} from './types';

const db = getFirebaseFirestore();

/**
 * Sync game data to Firestore
 */
export async function syncGameData(uid: string, data: GameData): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    
    await setDoc(
      userRef,
      {
        ...data,
        lastSeenAt: serverTimestamp(),
        lastModified: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync game data:', error);
    throw error;
  }
}

/**
 * Sync score to Firestore and leaderboard
 */
export async function syncScore(
  uid: string,
  mode: GameMode,
  score: number,
  displayName: string,
  photoURL: string | null
): Promise<void> {
  try {
    // Validation 1: Score must be between 0 and 9,999,999
    if (score < 0 || score > 9999999) {
      console.warn(`Invalid score ${score} for user ${uid}. Score must be between 0 and 9,999,999.`);
      return;
    }

    const userRef = doc(db, 'users', uid);
    const leaderboardRef = doc(db, `leaderboards/${mode}/scores`, uid);

    // Validation 2: Rate limiting - only apply for same or lower scores
    const leaderboardDoc = await getDoc(leaderboardRef);
    let shouldApplyRateLimit = false;
    
    if (leaderboardDoc.exists()) {
      const existingScore = leaderboardDoc.data()?.score || 0;
      
      // If new score is higher, always allow immediately (no rate limit)
      if (score > existingScore) {
        shouldApplyRateLimit = false;
      } else {
        // For same or lower scores, apply rate limit
        shouldApplyRateLimit = true;
        const lastSubmittedAt = leaderboardDoc.data()?.lastScoreSubmittedAt;
        
        if (lastSubmittedAt) {
          const lastSubmittedTimestamp = lastSubmittedAt instanceof Timestamp 
            ? lastSubmittedAt.toMillis() 
            : lastSubmittedAt;
          const now = Date.now();
          const timeSinceLastSubmit = now - lastSubmittedTimestamp;
          
          if (timeSinceLastSubmit < 60000) { // 60 seconds
            console.warn(`Rate limit: User ${uid} submitted a score ${timeSinceLastSubmit}ms ago. Must wait 60 seconds between submissions.`);
            return;
          }
        }
      }
    }

    // Update user's high score
    const userDoc = await getDoc(userRef);
    const currentHighScores = userDoc.data()?.highScores || {};
    const currentHighScore = currentHighScores[mode] || 0;

    if (score > currentHighScore) {
      await updateDoc(userRef, {
        [`highScores.${mode}`]: score,
        lastModified: Date.now(),
      });

      // Update leaderboard entry
      await setDoc(leaderboardRef, {
        uid,
        displayName: displayName || 'Anonymous',
        photoURL,
        score,
        achievedAt: serverTimestamp(),
        lastScoreSubmittedAt: Date.now(),
        platform: 'web',
        appVersion: '1.0.0', // TODO: Get from package.json
      });
    } else {
      // Even if not a new high score, update lastScoreSubmittedAt for rate limiting
      await updateDoc(userRef, {
        [`highScores.${mode}`]: score,
        lastModified: Date.now(),
      });
    }
  } catch (error) {
    console.error('Failed to sync score:', error);
    throw error;
  }
}

/**
 * Sync mode-specific statistics
 */
export async function syncModeStats(
  uid: string,
  mode: GameMode,
  stats: Partial<ModeStats>
): Promise<void> {
  try {
    const modeStatsRef = doc(db, `users/${uid}/modeStats`, mode);
    
    await setDoc(
      modeStatsRef,
      {
        ...stats,
        lastPlayedAt: serverTimestamp(),
        lastModified: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync mode stats:', error);
    throw error;
  }
}

/**
 * Sync daily challenge completion with streak logic
 */
export async function syncDailyChallenge(
  uid: string,
  date: string,
  data: DailyData
): Promise<void> {
  try {
    const dailyRef = doc(db, `users/${uid}/dailyHistory`, date);
    const userRef = doc(db, 'users', uid);

    // Calculate streak
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayDoc = await getDoc(doc(db, `users/${uid}/dailyHistory`, yesterdayStr));
    
    let currentStreak = 1;
    let longestStreak = data.longestStreak || 1;

    if (yesterdayDoc.exists() && !data.freezeUsed) {
      // Continue streak
      const yesterdayData = yesterdayDoc.data();
      currentStreak = (yesterdayData.currentStreak || 0) + 1;
    } else if (!yesterdayDoc.exists() && !data.freezeUsed) {
      // Streak broken, reset to 1
      currentStreak = 1;
    }

    // Update longest streak if current exceeds it
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Write daily history
    await setDoc(dailyRef, {
      ...data,
      currentStreak,
      longestStreak,
      lastCompletedDate: date,
      completedAt: serverTimestamp(),
      lastModified: Date.now(),
    });

    // Update user document with streak info
    await setDoc(
      userRef,
      {
        currentStreak,
        longestStreak,
        lastModified: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync daily challenge:', error);
    throw error;
  }
}

/**
 * Load user data from Firestore
 */
export async function loadUserData(uid: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as UserData;
  } catch (error) {
    console.error('Failed to load user data:', error);
    throw error;
  }
}

/**
 * Sync data from Firestore to localStorage
 * Firebase is the source of truth - always overwrites localStorage
 */
export async function syncFromFirestore(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('No user data found in Firebase');
      return;
    }

    const userData = userDoc.data() as UserData;

    // Firebase is the source of truth - always overwrite localStorage cache
    
    // Cache stats (read-only cache for offline access)
    const stats = {
      gamesPlayed: userData.totalGamesPlayed || 0,
      totalScore: 0, // Will be calculated from highScores
      linesCleared: 0, // TODO: Add to UserData type
      blocksPlaced: 0, // TODO: Add to UserData type
      maxCombo: 0, // TODO: Add to UserData type
      totalTimePlayed: userData.totalTimePlayed || 0,
      bombsExploded: 0, // TODO: Add to UserData type
      iceBroken: 0, // TODO: Add to UserData type
    };
    localStorage.setItem('flux_stats', JSON.stringify(stats));

    // Cache high scores
    if (userData.highScores) {
      localStorage.setItem('flux_highscores', JSON.stringify(userData.highScores));
      
      // Also set individual mode high scores for backward compatibility
      Object.entries(userData.highScores).forEach(([mode, score]) => {
        localStorage.setItem(`flux_highscore_${mode}`, score.toString());
      });
    }

    // Cache max level
    if (userData.maxLevelReached !== undefined) {
      localStorage.setItem('flux_max_level', userData.maxLevelReached.toString());
    }

    // Cache daily streak
    if (userData.currentStreak !== undefined) {
      localStorage.setItem('flux_daily_streak', userData.currentStreak.toString());
    }

    // Cache achievements (fetch from subcollection)
    try {
      const achievementsRef = collection(db, `users/${uid}/achievements`);
      const achievementsSnapshot = await getDoc(doc(achievementsRef.parent!, achievementsRef.id));
      // TODO: Implement proper achievements fetching
      // For now, just set empty array
      localStorage.setItem('flux_achievements', JSON.stringify([]));
    } catch (error) {
      console.warn('Failed to fetch achievements:', error);
      localStorage.setItem('flux_achievements', JSON.stringify([]));
    }

    // Cache player profile
    const profile = {
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      createdAt: userData.createdAt,
      lastSeenAt: userData.lastSeenAt,
    };
    localStorage.setItem('flux_player_profile', JSON.stringify(profile));

    // Sync preferences (these are read-write)
    if (userData.preferences?.theme) {
      localStorage.setItem('flux_theme', userData.preferences.theme);
    }

    if (userData.preferences?.language) {
      localStorage.setItem('flux_language', userData.preferences.language);
    }

    console.log('Successfully synced from Firebase to localStorage cache');
  } catch (error) {
    console.error('Failed to sync from Firestore:', error);
    throw error;
  }
}

/**
 * Sync local data to Firestore
 */
export async function syncLocalToFirestore(uid: string): Promise<void> {
  try {
    const gameData: GameData = {};

    // Collect high scores
    const highScores: any = {};
    const modes = ['endless', 'timed', 'blitz', 'zen', 'daily', 'survival'];
    
    modes.forEach((mode) => {
      const score = localStorage.getItem(`flux_highscore_${mode}`);
      if (score) {
        highScores[mode] = parseInt(score, 10);
      }
    });

    if (Object.keys(highScores).length > 0) {
      gameData.highScores = highScores;
    }

    // Collect progression
    const maxLevel = localStorage.getItem('flux_max_level');
    if (maxLevel) {
      gameData.maxLevelReached = parseInt(maxLevel, 10);
    }

    const streak = localStorage.getItem('flux_daily_streak');
    if (streak) {
      gameData.currentStreak = parseInt(streak, 10);
    }

    // Collect preferences
    const theme = localStorage.getItem('flux_theme');
    if (theme) {
      gameData.preferences = { theme };
    }

    // Sync to Firestore
    if (Object.keys(gameData).length > 0) {
      await syncGameData(uid, gameData);
    }
  } catch (error) {
    console.error('Failed to sync local to Firestore:', error);
    throw error;
  }
}

/**
 * Validate user document structure
 */
export function validateUserDocument(data: any): boolean {
  const requiredFields = [
    'displayName',
    'createdAt',
    'lastSeenAt',
    'platform',
    'appVersion',
    'isAnonymous',
    'maxLevelReached',
    'totalGamesPlayed',
    'totalTimePlayed',
    'currentStreak',
    'longestStreak',
    'highScores',
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`Missing required field in user document: ${field}`);
      return false;
    }
  }

  // Validate highScores structure
  if (typeof data.highScores !== 'object') {
    console.error('highScores must be an object');
    return false;
  }

  return true;
}

/**
 * Validate mode stats document structure
 */
export function validateModeStatsDocument(data: any): boolean {
  const requiredFields = [
    'mode',
    'firstPlayedAt',
    'lastPlayedAt',
    'totalSessions',
    'totalTimeSecs',
    'avgSessionSecs',
    'daysActive',
    'highScore',
    'avgScore',
    'topPercentile',
    'bestCombo',
    'linesCleared',
    'retryCount',
    'avgRetriesPerSession',
    'skillUsageRate',
    'quitAfterFirstGame',
    'peakHour',
    'preferredDifficulty',
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`Missing required field in mode stats document: ${field}`);
      return false;
    }
  }

  // Validate daysActive is an array
  if (!Array.isArray(data.daysActive)) {
    console.error('daysActive must be an array');
    return false;
  }

  return true;
}

/**
 * Validate daily history document structure
 */
export function validateDailyHistoryDocument(data: any): boolean {
  const requiredFields = [
    'score',
    'rank',
    'attempts',
    'timeToComplete',
    'currentStreak',
    'longestStreak',
    'lastCompletedDate',
    'freezeUsed',
    'globalPercentile',
    'shareCount',
    'seedId',
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`Missing required field in daily history document: ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Sync achievement to Firestore
 */
export async function syncAchievement(uid: string, achievement: any): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const achRef = doc(db, `users/${uid}/achievements`, achievement.id);
    
    await setDoc(achRef, {
      ...achievement,
      unlockedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Failed to sync achievement:', error);
    throw error;
  }
}

/**
 * Track session and update timestamps
 */
export async function trackSession(
  uid: string,
  mode: GameMode,
  sessionDurationSecs: number
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const modeStatsRef = doc(db, `users/${uid}/modeStats`, mode);

    // Get current date
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Update user document
    await setDoc(
      userRef,
      {
        lastSeenAt: serverTimestamp(),
        totalTimePlayed: sessionDurationSecs * 1000,
        lastModified: Date.now(),
      },
      { merge: true }
    );

    // Get current mode stats
    const modeStatsDoc = await getDoc(modeStatsRef);
    const currentStats = modeStatsDoc.exists() ? modeStatsDoc.data() : {};

    // Calculate new values
    const totalSessions = (currentStats.totalSessions || 0) + 1;
    const totalTimeSecs = (currentStats.totalTimeSecs || 0) + sessionDurationSecs;
    const avgSessionSecs = totalTimeSecs / totalSessions;

    // Update daysActive array
    const daysActive = currentStats.daysActive || [];
    if (!daysActive.includes(today)) {
      daysActive.push(today);
    }

    // Track hour frequency for peakHour calculation
    const hourFrequency = currentStats.hourFrequency || {};
    hourFrequency[currentHour] = (hourFrequency[currentHour] || 0) + 1;

    // Find peak hour
    let peakHour = currentHour;
    let maxFrequency = hourFrequency[currentHour];
    for (const [hour, frequency] of Object.entries(hourFrequency)) {
      const freq = typeof frequency === 'number' ? frequency : 0;
      if (freq > maxFrequency) {
        maxFrequency = freq;
        peakHour = parseInt(hour, 10);
      }
    }

    // Update mode stats
    await setDoc(
      modeStatsRef,
      {
        totalSessions,
        totalTimeSecs,
        avgSessionSecs,
        daysActive,
        hourFrequency,
        peakHour,
        lastPlayedAt: serverTimestamp(),
        lastModified: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to track session:', error);
    throw error;
  }
}
