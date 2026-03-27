import { doc, setDoc, writeBatch, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import { DEFAULT_USER_STATS, DEFAULT_PROGRESSION, DEFAULT_ABILITIES, detectPlatform, UserDocument, AbilitiesData } from './types';
import type { GameMode } from '@shared/types';

const MIGRATION_COMPLETE_KEY = 'firebase_migration_complete';
const MIGRATION_V3_COMPLETE_KEY = 'firebase_migration_v3_complete';
const MAX_MIGRATION_RETRIES = 3;

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  failedKeys: string[];
  errors: Error[];
}

// v1 → v2 Schema Migration
export async function migrateUserToV2(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const data = userSnap.data();
  
  // Zaten v2 ise geç
  if (data.schemaVersion >= 2) return;
  
  const updates: Record<string, unknown> = {
    schemaVersion: 2,
    lastPlatform: detectPlatform(),
    lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
  
  // devices map yoksa oluştur, eski deviceTokens'ı dönüştür
  if (!data.devices) {
    const devices: Record<string, unknown> = {};
    if (Array.isArray(data.deviceTokens)) {
      data.deviceTokens.forEach((token: string) => {
        const hash = token.substring(0, 16);
        devices[hash] = {
          token,
          platform: 'web',
          appVersion: '1.0.0',
          addedAt: Date.now(),
          lastSeenAt: Date.now(),
        };
      });
    }
    updates.devices = devices;
  }
  
  // stats yoksa veya eksik alanlara default ekle
  if (!data.stats) {
    updates.stats = DEFAULT_USER_STATS;
  } else {
    // Eksik alanları doldur
    const statsDefaults: Record<string, unknown> = {};
    if (data.stats.linesCleared === undefined) statsDefaults['stats.linesCleared'] = 0;
    if (data.stats.blocksPlaced === undefined) statsDefaults['stats.blocksPlaced'] = 0;
    if (data.stats.bombsExploded === undefined) statsDefaults['stats.bombsExploded'] = 0;
    if (data.stats.iceBroken === undefined) statsDefaults['stats.iceBroken'] = 0;
    if (data.stats.highestCombo === undefined) statsDefaults['stats.highestCombo'] = 0;
    if (data.stats.totalPlaytimeSecs === undefined) statsDefaults['stats.totalPlaytimeSecs'] = 0;
    if (data.stats.skillUses === undefined) statsDefaults['stats.skillUses'] = {};
    Object.assign(updates, statsDefaults);
  }
  
  // progression yoksa oluştur
  if (!data.progression) {
    updates.progression = {
      ...DEFAULT_PROGRESSION,
      maxLevelReached: data.maxLevelReached || parseInt(localStorage.getItem('flux_max_level') || '0'),
      currentStreak: parseInt(localStorage.getItem('flux_daily_streak') || '0'),
    };
  }
  
  // preferences yoksa oluştur
  if (!data.preferences) {
    updates.preferences = {
      theme: data.theme || localStorage.getItem('flux_theme') || 'dark',
      language: localStorage.getItem('flux_language') || 'tr',
      muted: localStorage.getItem('flux_muted') === 'true',
    };
  }
  
  // highScores map yoksa veya eski lowercase key'leri dönüştür
  if (!data.highScores) {
    const hs: Record<string, number> = {};
    // localStorage'dan oku
    ['ENDLESS', 'TIMED', 'DAILY_CHALLENGE', 'ZEN', 'SURVIVAL', 'CAREER'].forEach(mode => {
      const val = parseInt(localStorage.getItem(`flux_highscore_${mode}`) || '0');
      if (val > 0) hs[mode] = val;
    });
    updates.highScores = hs;
  } else {
    // Eski lowercase key'leri büyük harfe dönüştür
    const keyMap: Record<string, string> = {
      endless: 'ENDLESS',
      timed: 'TIMED',
      daily_challenge: 'DAILY_CHALLENGE',
      zen: 'ZEN',
      survival: 'SURVIVAL',
      career: 'CAREER',
    };
    const newHighScores = { ...data.highScores };
    let changed = false;
    Object.keys(keyMap).forEach(lower => {
      if (newHighScores[lower] !== undefined) {
        newHighScores[keyMap[lower]] = Math.max(
          newHighScores[keyMap[lower]] || 0,
          newHighScores[lower]
        );
        delete newHighScores[lower];
        changed = true;
      }
    });
    if (changed) updates.highScores = newHighScores;
  }
  
  // onboardingComplete yoksa ekle
  if (data.onboardingComplete === undefined) {
    updates.onboardingComplete = localStorage.getItem('flux_onboard_v1') === 'true';
  }
  
  await updateDoc(userRef, updates as any);
  console.log(`[migration] User ${uid} migrated to v2`);
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
  const db = getFirebaseFirestore();
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
  const db = getFirebaseFirestore();
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
  const db = getFirebaseFirestore();
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
  const db = getFirebaseFirestore();
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

/**
 * localStorage keys that should be removed after v3 migration
 */
const KEYS_TO_REMOVE = [
  'flux_highscores',
  'flux_stats',
  'flux_achievements',
  'flux_max_level',
  'flux_passive_unlocks',
  'flux_passive_equipped',
  'flux_player_profile',
  'flux_daily_streak',
  'flux_daily_streak_date',
  'flux_daily_played',
  'flux_highscore',
  'flux_daily_seed_cache',
  'flux_onboard_v1',
  'signin_dismiss_count',
  'ios_pwa_instructions_shown',
  'flux_mode_stats',
  'flux_survival_highscore',
  'flux_level_progress',
];

/**
 * Parse localStorage value safely
 */
function parseValue(value: string | null): any {
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch {
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    // Return as string
    return value;
  }
}

/**
 * Transform localStorage data to UserDocument v3 format
 */
function transformLocalStorageToV3(): Partial<UserDocument> {
  const update: Partial<UserDocument> = {};
  
  // High scores
  const highscoresStr = localStorage.getItem('flux_highscores');
  if (highscoresStr) {
    const parsed = parseValue(highscoresStr);
    if (parsed && typeof parsed === 'object') {
      update.highScores = parsed as Partial<Record<GameMode, number>>;
    }
  }
  
  // Individual high score (legacy)
  const singleScore = localStorage.getItem('flux_highscore');
  if (singleScore) {
    if (!update.highScores) update.highScores = {};
    update.highScores.ENDLESS = parseInt(singleScore, 10);
  }
  
  // Survival high score (legacy)
  const survivalScore = localStorage.getItem('flux_survival_highscore');
  if (survivalScore) {
    if (!update.highScores) update.highScores = {};
    // SURVIVAL mode doesn't exist in current GameMode enum, skip it
    // update.highScores.SURVIVAL = parseInt(survivalScore, 10);
  }
  
  // Stats
  const statsStr = localStorage.getItem('flux_stats');
  if (statsStr) {
    const parsed = parseValue(statsStr);
    if (parsed && typeof parsed === 'object') {
      update.stats = { ...DEFAULT_USER_STATS, ...parsed };
    }
  }
  
  // Progression
  const maxLevel = localStorage.getItem('flux_max_level');
  const dailyStreak = localStorage.getItem('flux_daily_streak');
  
  if (maxLevel || dailyStreak) {
    update.progression = { ...DEFAULT_PROGRESSION };
    
    if (maxLevel) {
      update.progression.maxLevelReached = parseInt(maxLevel, 10);
    }
    
    if (dailyStreak) {
      update.progression.currentStreak = parseInt(dailyStreak, 10);
    }
  }
  
  // Abilities (NEW in v3)
  const passiveUnlocksStr = localStorage.getItem('flux_passive_unlocks');
  const passiveEquippedStr = localStorage.getItem('flux_passive_equipped');
  
  const abilities: AbilitiesData = { ...DEFAULT_ABILITIES };
  
  if (passiveUnlocksStr) {
    const parsed = parseValue(passiveUnlocksStr);
    if (Array.isArray(parsed)) {
      abilities.passiveUnlocks = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Handle old format where unlocks might be stored as object
      abilities.passiveUnlocks = Object.keys(parsed).filter(key => parsed[key]);
    }
  }
  
  if (passiveEquippedStr) {
    const parsed = parseValue(passiveEquippedStr);
    if (Array.isArray(parsed)) {
      abilities.passiveEquipped = parsed.filter(Boolean);
    }
  }
  
  if (maxLevel) {
    abilities.maxUnlockedLevel = parseInt(maxLevel, 10);
  }
  
  update.abilities = abilities;
  
  // Preferences (keep in localStorage but also sync to Firestore)
  const theme = localStorage.getItem('flux_theme');
  const language = localStorage.getItem('flux_language');
  const muted = localStorage.getItem('flux_muted');
  
  if (theme || language || muted !== null) {
    update.preferences = {
      theme: theme || 'dark',
      language: language || 'tr',
      muted: muted === 'true',
    };
  }
  
  // Onboarding
  const onboarded = localStorage.getItem('flux_onboard_v1');
  if (onboarded) {
    update.onboardingComplete = onboarded === 'true';
  }
  
  return update;
}

/**
 * Migrate localStorage to Firestore v3
 * Requirements: 4.1, 4.2, 4.3
 */
export async function migrateLocalStorageToFirestoreV3(uid: string): Promise<MigrationResult> {
  const db = getFirebaseFirestore();
  const result: MigrationResult = {
    success: true,
    migratedKeys: [],
    failedKeys: [],
    errors: [],
  };
  
  try {
    // Check if v3 migration already complete (idempotency)
    const v3Complete = localStorage.getItem(MIGRATION_V3_COMPLETE_KEY);
    if (v3Complete === 'true') {
      console.log('[migration] v3 migration already complete, skipping');
      return result;
    }
    
    console.log('[migration] Starting v3 migration for user:', uid);
    
    // Read and transform localStorage data
    const localData = transformLocalStorageToV3();
    
    // Check if there's any data to migrate
    if (Object.keys(localData).length === 0) {
      console.log('[migration] No localStorage data to migrate');
      localStorage.setItem(MIGRATION_V3_COMPLETE_KEY, 'true');
      return result;
    }
    
    // Get existing Firestore data
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    let mergedData: Partial<UserDocument>;
    
    if (userSnap.exists()) {
      // Merge with existing data (preserve existing, only fill missing fields)
      // Requirements: 4.6
      const existingData = userSnap.data() as UserDocument;
      
      // Merge highScores: take maximum score for each game mode
      const mergedHighScores: Partial<Record<GameMode, number>> = { ...localData.highScores };
      if (existingData.highScores) {
        Object.entries(existingData.highScores).forEach(([mode, score]) => {
          const localScore = mergedHighScores[mode as GameMode] || 0;
          mergedHighScores[mode as GameMode] = Math.max(localScore, score);
        });
      }
      
      // Merge stats: preserve existing, fill missing fields from localStorage
      const mergedStats = existingData.stats 
        ? { ...localData.stats, ...existingData.stats }
        : localData.stats;
      
      // Merge progression: preserve existing, fill missing fields from localStorage
      const mergedProgression = existingData.progression
        ? { ...localData.progression, ...existingData.progression }
        : localData.progression;
      
      // Merge abilities: preserve existing, fill missing fields from localStorage
      const mergedAbilities = existingData.abilities
        ? {
            passiveUnlocks: existingData.abilities.passiveUnlocks || localData.abilities?.passiveUnlocks || [],
            passiveEquipped: existingData.abilities.passiveEquipped || localData.abilities?.passiveEquipped || [],
            maxUnlockedLevel: Math.max(
              existingData.abilities.maxUnlockedLevel || 0,
              localData.abilities?.maxUnlockedLevel || 0
            ),
          }
        : localData.abilities;
      
      // Merge preferences: preserve existing, fill missing fields from localStorage
      const mergedPreferences = existingData.preferences
        ? { ...localData.preferences, ...existingData.preferences }
        : localData.preferences;
      
      mergedData = {
        ...localData,
        highScores: mergedHighScores,
        stats: mergedStats,
        progression: mergedProgression,
        preferences: mergedPreferences,
        abilities: mergedAbilities,
        onboardingComplete: existingData.onboardingComplete ?? localData.onboardingComplete,
        // Update metadata
        schemaVersion: 3,
        lastSeenAt: Date.now(),
        lastPlatform: detectPlatform(),
        lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      };
    } else {
      // No existing data, use transformed data
      mergedData = {
        ...localData,
        schemaVersion: 3,
        lastSeenAt: Date.now(),
        lastPlatform: detectPlatform(),
        lastAppVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      };
    }
    
    // Write to Firestore with merge
    await setDoc(userRef, mergedData, { merge: true });
    
    // Track migrated keys
    result.migratedKeys = Object.keys(localData);
    
    console.log('[migration] v3 migration successful, migrated keys:', result.migratedKeys);
    
    // Clean up old localStorage keys
    // Requirements: 1.3
    const { cleanupDeprecatedKeys } = await import('@utils/cleanupLocalStorage');
    cleanupDeprecatedKeys();
    
    // Mark v3 migration as complete
    localStorage.setItem(MIGRATION_V3_COMPLETE_KEY, 'true');
    
  } catch (error) {
    console.error('[migration] v3 migration failed:', error);
    result.success = false;
    result.errors.push(error as Error);
    result.failedKeys = Object.keys(transformLocalStorageToV3());
  }
  
  return result;
}
