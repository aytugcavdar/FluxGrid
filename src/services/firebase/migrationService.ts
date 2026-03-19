import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import type { GameData } from './types';

const db = getFirebaseFirestore();

const MIGRATION_COMPLETE_KEY = 'firebase_migration_complete';
const MAX_MIGRATION_RETRIES = 3;

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  failedKeys: string[];
  errors: Error[];
}

// Mapping of localStorage keys to Firestore paths
const MIGRATION_MAP: Record<string, string> = {
  // High scores
  flux_highscore: 'users/{uid}.highScores.endless',
  flux_highscores: 'users/{uid}.highScores',
  flux_survival_highscore: 'users/{uid}.highScores.survival',

  // Progression
  flux_max_level: 'users/{uid}.maxLevelReached',
  flux_daily_streak: 'users/{uid}.currentStreak',

  // Stats
  flux_stats: 'users/{uid}',

  // Profile
  flux_player_profile: 'users/{uid}',

  // Preferences
  flux_theme: 'users/{uid}.preferences.theme',
  flux_language: 'users/{uid}.preferences.language',
  flux_muted: 'users/{uid}.preferences.muted',
  flux_onboard_v1: 'users/{uid}.onboardingComplete',

  // Achievements (subcollection)
  flux_achievements: 'users/{uid}/achievements',

  // Passive abilities
  flux_passive_unlocks: 'users/{uid}.progression.unlockedPassives',
  flux_passive_equipped: 'users/{uid}.progression.equippedPassives',
};

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  return localStorage.getItem(MIGRATION_COMPLETE_KEY) !== 'true';
}

/**
 * Mark migration as complete
 */
export function markComplete(): void {
  localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
}

/**
 * Parse localStorage value
 */
function parseLocalStorageValue(key: string, value: string): any {
  try {
    // Try to parse as JSON
    return JSON.parse(value);
  } catch {
    // If not JSON, check if it's a number
    const num = Number(value);
    if (!isNaN(num)) {
      return num;
    }
    // Otherwise return as string
    return value;
  }
}

/**
 * Migrate high scores
 */
export async function migrateHighScores(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const highScores: any = {};

  // Migrate individual high score
  const singleScore = localStorage.getItem('flux_highscore');
  if (singleScore) {
    highScores.endless = parseInt(singleScore, 10);
  }

  // Migrate all high scores
  const allScores = localStorage.getItem('flux_highscores');
  if (allScores) {
    const parsed = parseLocalStorageValue('flux_highscores', allScores);
    Object.assign(highScores, parsed);
  }

  // Migrate survival high score
  const survivalScore = localStorage.getItem('flux_survival_highscore');
  if (survivalScore) {
    highScores.survival = parseInt(survivalScore, 10);
  }

  if (Object.keys(highScores).length > 0) {
    await setDoc(userRef, { highScores }, { merge: true });
  }
}

/**
 * Migrate stats
 */
export async function migrateStats(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const statsData = localStorage.getItem('flux_stats');

  if (statsData) {
    const stats = parseLocalStorageValue('flux_stats', statsData);
    await setDoc(userRef, stats, { merge: true });
  }
}

/**
 * Migrate achievements
 * IDEMPOTENT: Uses achievement.id as document ID to prevent duplicates
 */
export async function migrateAchievements(uid: string): Promise<void> {
  const achievementsData = localStorage.getItem('flux_achievements');

  if (achievementsData) {
    const achievements = parseLocalStorageValue('flux_achievements', achievementsData);
    
    if (Array.isArray(achievements)) {
      const batch = writeBatch(db);
      
      achievements.forEach((achievement: any) => {
        // Use achievement.id as document ID for idempotency
        const achievementId = achievement.id || `achievement_${Date.now()}_${Math.random()}`;
        const achievementRef = doc(db, `users/${uid}/achievements`, achievementId);
        
        // Use set with merge to prevent duplicates
        batch.set(achievementRef, {
          ...achievement,
          migratedAt: Date.now(),
        }, { merge: true });
      });

      await batch.commit();
    }
  }
}

/**
 * Migrate profile
 */
export async function migrateProfile(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const profileData = localStorage.getItem('flux_player_profile');

  if (profileData) {
    const profile = parseLocalStorageValue('flux_player_profile', profileData);
    await setDoc(userRef, profile, { merge: true });
  }

  // Migrate progression data
  const maxLevel = localStorage.getItem('flux_max_level');
  const dailyStreak = localStorage.getItem('flux_daily_streak');

  const progressionData: any = {};

  if (maxLevel) {
    progressionData.maxLevelReached = parseInt(maxLevel, 10);
  }

  if (dailyStreak) {
    progressionData.currentStreak = parseInt(dailyStreak, 10);
  }

  // Migrate passive abilities
  const passiveUnlocks = localStorage.getItem('flux_passive_unlocks');
  const passiveEquipped = localStorage.getItem('flux_passive_equipped');

  if (passiveUnlocks || passiveEquipped) {
    progressionData.progression = {};
    
    if (passiveUnlocks) {
      progressionData.progression.unlockedPassives = parseLocalStorageValue(
        'flux_passive_unlocks',
        passiveUnlocks
      );
    }

    if (passiveEquipped) {
      progressionData.progression.equippedPassives = parseLocalStorageValue(
        'flux_passive_equipped',
        passiveEquipped
      );
    }
  }

  if (Object.keys(progressionData).length > 0) {
    await setDoc(userRef, progressionData, { merge: true });
  }

  // Migrate preferences
  const theme = localStorage.getItem('flux_theme');
  const language = localStorage.getItem('flux_language');
  const muted = localStorage.getItem('flux_muted');
  const onboarded = localStorage.getItem('flux_onboard_v1');

  const preferencesData: any = {};

  if (theme || language || muted) {
    preferencesData.preferences = {};
    
    if (theme) {
      preferencesData.preferences.theme = theme;
    }

    if (language) {
      preferencesData.preferences.language = language;
    }

    if (muted) {
      preferencesData.preferences.muted = muted === 'true';
    }
  }

  if (onboarded) {
    preferencesData.onboardingComplete = onboarded === 'true';
  }

  if (Object.keys(preferencesData).length > 0) {
    await setDoc(userRef, preferencesData, { merge: true });
  }
}

/**
 * Execute full migration
 */
export async function migrate(uid: string, retryCount = 0): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedKeys: [],
    failedKeys: [],
    errors: [],
  };

  // Check if already migrated
  if (!needsMigration()) {
    return result;
  }

  try {
    // Migrate high scores
    await migrateHighScores(uid);
    result.migratedKeys.push('flux_highscore', 'flux_highscores', 'flux_survival_highscore');

    // Migrate stats
    await migrateStats(uid);
    result.migratedKeys.push('flux_stats');

    // Migrate achievements
    await migrateAchievements(uid);
    result.migratedKeys.push('flux_achievements');

    // Migrate profile and preferences
    await migrateProfile(uid);
    result.migratedKeys.push(
      'flux_player_profile',
      'flux_max_level',
      'flux_daily_streak',
      'flux_theme',
      'flux_language',
      'flux_muted',
      'flux_onboard_v1',
      'flux_passive_unlocks',
      'flux_passive_equipped'
    );

    // Mark migration as complete
    markComplete();
  } catch (error) {
    console.error('Migration failed:', error);
    result.success = false;
    result.errors.push(error as Error);

    // Retry logic
    if (retryCount < MAX_MIGRATION_RETRIES) {
      console.log(`Retrying migration (attempt ${retryCount + 1}/${MAX_MIGRATION_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return migrate(uid, retryCount + 1);
    } else {
      // Store failed migration data for manual intervention
      const failedData = {
        uid,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      localStorage.setItem('firebase_migration_failed', JSON.stringify(failedData));
    }
  }

  return result;
}
