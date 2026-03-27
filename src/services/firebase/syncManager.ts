import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import { GameMode } from '@shared/types';
import {
  UserDocument,
  UserDocumentUpdate,
  LeaderboardEntry,
  DailyHistoryDocument,
  AchievementDocument,
  PendingWriteDocument,
  PendingWriteType,
  DEFAULT_USER_STATS,
  DEFAULT_PROGRESSION,
  DEFAULT_ABILITIES,
  detectPlatform,
  AbilitiesData,
} from './types';

// 1. loadUserFromFirestore
export async function loadUserFromFirestore(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    // Read Firestore document
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    // If document doesn't exist, return (no data to load)
    if (!userDoc.exists()) {
      console.log('loadUserFromFirestore: No document found for uid', uid);
      return;
    }

    // Parse data as UserDocument
    const userData = userDoc.data() as UserDocument;

    // Dynamic import to avoid circular dependency
    const { useGameStore } = await import('@features/game/store/gameStore');
    const { usePassiveAbilityStore } = await import('@features/abilities/store/passiveAbilityStore');

    // Update gameStore with Firestore data
    useGameStore.setState({
      highScores: userData.highScores ?? {},
      stats: userData.stats ?? DEFAULT_USER_STATS,
      maxLevelReached: userData.progression?.maxLevelReached ?? 0,
    });

    // Update passiveAbilityStore with Firestore data
    const abilities = userData.abilities ?? DEFAULT_ABILITIES;
    usePassiveAbilityStore.getState().initializeFromFirestore(
      abilities.passiveUnlocks,
      abilities.passiveEquipped,
      abilities.maxUnlockedLevel
    );

    console.log('loadUserFromFirestore: Successfully loaded user data');
  } catch (error) {
    console.error('loadUserFromFirestore error:', error);
    // Use default values on error - stores already have defaults
  }
}

// 2. subscribeToUserChanges
export function subscribeToUserChanges(
  uid: string,
  callback: (data: UserDocument) => void
): () => void {
  const db = getFirebaseFirestore();

  try {
    // Setup onSnapshot listener for real-time updates
    const userDocRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        console.log('subscribeToUserChanges: Document does not exist');
        return;
      }

      // Parse data as UserDocument
      const userData = snapshot.data() as UserDocument;

      // Call the callback with the updated data
      callback(userData);

      // Dynamic import to avoid circular dependency
      const { useGameStore } = await import('@features/game/store/gameStore');
      const { usePassiveAbilityStore } = await import('@features/abilities/store/passiveAbilityStore');

      // Update gameStore with Firestore data
      useGameStore.setState({
        highScores: userData.highScores ?? {},
        stats: userData.stats ?? DEFAULT_USER_STATS,
        maxLevelReached: userData.progression?.maxLevelReached ?? 0,
      });

      // Update passiveAbilityStore with Firestore data
      const abilities = userData.abilities ?? DEFAULT_ABILITIES;
      usePassiveAbilityStore.getState().initializeFromFirestore(
        abilities.passiveUnlocks,
        abilities.passiveEquipped,
        abilities.maxUnlockedLevel
      );

      console.log('subscribeToUserChanges: Store updated from Firestore');
    }, (error) => {
      console.error('subscribeToUserChanges error:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('subscribeToUserChanges setup error:', error);
    // Return no-op unsubscribe function on error
    return () => {};
  }
}

// 3. syncAbilities
export async function syncAbilities(
  uid: string,
  abilities: Partial<import('./types').AbilitiesData>
): Promise<void> {
  const db = getFirebaseFirestore();
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          abilities,
          lastSeenAt: Date.now(),
        },
        { merge: true }
      );
      
      console.log('syncAbilities: Successfully synced abilities');
      return;
    } catch (error) {
      console.error(`syncAbilities error (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Son denemede hata fırlat
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

// 4. createOrUpdateUser
export async function createOrUpdateUser(
  uid: string,
  data: Partial<UserDocument>
): Promise<void> {
  const db = getFirebaseFirestore();
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        ...data,
        schemaVersion: 2,
        lastSeenAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('createOrUpdateUser error:', error);
    throw error;
  }
}

// 5. syncGameData
export async function syncGameData(
  uid: string,
  update: UserDocumentUpdate
): Promise<void> {
  const db = getFirebaseFirestore();
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          ...update,
          lastSeenAt: Date.now(),
        } as any,
        { merge: true }
      );
      
      console.log('syncGameData: Successfully synced game data');
      return;
    } catch (error) {
      console.error(`syncGameData error (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Son denemede hata fırlat
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

// 4. syncScore
export async function syncScore(
  uid: string,
  mode: GameMode,
  score: number,
  displayName: string,
  photoURL: string | null,
  sessionDurationSecs: number,
  abilities: AbilitiesData
): Promise<void> {
  const db = getFirebaseFirestore();

  try {
    // Get current user to check if anonymous - Requirement 1.2, 1.3
    const { useAuthStore } = await import('@features/auth/store/authStore');
    const { user } = useAuthStore.getState();
    const isAnonymous = user?.isAnonymous ?? false;

    // a) Validation
    if (score < 0 || score > 9999999) {
      console.warn('syncScore: Invalid score', score);
      return;
    }

    // b) Anti-cheat - Strengthened validation (applies to all users - Requirement 1.4)
    // Minimum time requirements based on score tiers
    const minTimeRequired =
      score <= 1000 ? 5 :            // 5 seconds for scores up to 1000
      score <= 5000 ? 15 :           // 15 seconds for scores up to 5000
      score <= 10000 ? 30 :          // 30 seconds for scores up to 10000
      (score / 1000) * 2;            // 2 seconds per 1000 points for higher scores

    if (sessionDurationSecs < minTimeRequired) {
      console.warn('syncScore: Suspicious session duration', {
        score,
        sessionDurationSecs,
        minTimeRequired,
      });
      return;
    }

    // Additional check: Maximum reasonable score per second
    const maxScorePerSecond = 300; // Maximum 300 points per second (combo/surge ile yüksek skorlar makul)
    const maxPossibleScore = sessionDurationSecs * maxScorePerSecond;

    if (score > maxPossibleScore) {
      console.warn('syncScore: Score too high for session duration', {
        score,
        sessionDurationSecs,
        maxPossibleScore,
      });
      return;
    }

    // c) Mevcut leaderboard skorunu oku
    const leaderboardDocRef = doc(db, 'leaderboards', mode, 'scores', uid);
    const existingDoc = await getDoc(leaderboardDocRef);
    const existingScore = existingDoc.exists() ? existingDoc.data()?.score ?? 0 : 0;

    // d) Mevcut skorden yüksekse: LeaderboardEntry belgesi yaz
    if (score > existingScore) {
      const entry: LeaderboardEntry = {
        uid,
        displayName: isAnonymous ? 'Anonim' : displayName, // Requirement 1.2
        photoURL: isAnonymous ? null : photoURL, // Requirement 1.2
        score,
        achievedAt: Date.now(),
        platform: detectPlatform(),
        appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
        sessionDurationSecs,
        isAnonymous, // NEW FIELD - Requirement 1.3
        flagged: false, // Ensure anti-cheat flag is set
      };
      await setDoc(leaderboardDocRef, entry);
    }

    // e) users/{uid} highScores.{mode} ve abilities güncelle
    await updateDoc(doc(db, 'users', uid), {
      [`highScores.${mode}`]: score,
      'abilities.passiveUnlocks': abilities.passiveUnlocks,
      'abilities.passiveEquipped': abilities.passiveEquipped,
      'abilities.maxUnlockedLevel': abilities.maxUnlockedLevel,
    });
  } catch (error) {
    console.error('syncScore error:', error);
    throw error;
  }
}


// 5. syncFromFirestore
export async function syncFromFirestore(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    // a) doc(db, 'users', uid) oku
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    // b) Belge yoksa return
    if (!userDoc.exists()) {
      return;
    }

    // c) userData al
    const userData = userDoc.data() as UserDocument;

    // d) localStorage'a yaz
    localStorage.setItem(
      'flux_stats',
      JSON.stringify(userData.stats ?? DEFAULT_USER_STATS)
    );
    
    // HighScores: Her mod için en yüksek olanı koru (local veya Firebase)
    const firestoreHighScores = userData.highScores ?? {};
    let localHighScores: Record<string, number> = {};
    try {
      localHighScores = JSON.parse(localStorage.getItem('flux_highscores') || '{}');
    } catch {}
    
    const mergedHighScores: Record<string, number> = { ...localHighScores };
    Object.entries(firestoreHighScores).forEach(([mode, score]) => {
      const localScore = localHighScores[mode] || 0;
      mergedHighScores[mode] = Math.max(localScore, score as number);
    });
    
    localStorage.setItem('flux_highscores', JSON.stringify(mergedHighScores));
    
    const maxHighScore = Object.values(mergedHighScores).length > 0 
      ? Math.max(...Object.values(mergedHighScores)) 
      : 0;
    localStorage.setItem('flux_highscore', String(maxHighScore));
    
    localStorage.setItem(
      'flux_max_level',
      String(userData.progression?.maxLevelReached ?? 0)
    );
    localStorage.setItem(
      'flux_daily_streak',
      String(userData.progression?.currentStreak ?? 0)
    );

    // Preferences (sadece locale'de yoksa yaz)
    if (userData.preferences?.theme && !localStorage.getItem('flux_theme')) {
      localStorage.setItem('flux_theme', userData.preferences.theme);
    }
    if (userData.preferences?.language && !localStorage.getItem('flux_language')) {
      localStorage.setItem('flux_language', userData.preferences.language);
    }
  } catch (error) {
    console.error('syncFromFirestore error:', error);
    throw error;
  }
}

// 6. syncDailyChallenge
export async function syncDailyChallenge(
  uid: string,
  date: string,
  score: number,
  attempts: number,
  currentStreak: number
): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    // users/{uid}/dailyHistory/{date} yaz
    const dailyHistoryDoc: DailyHistoryDocument = {
      date,
      score,
      attempts,
      completedAt: Date.now(),
      streakAtCompletion: currentStreak,
    };
    await setDoc(
      doc(db, 'users', uid, 'dailyHistory', date),
      dailyHistoryDoc,
      { merge: true }
    );

    // longestStreak hesabı
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    const existing = userDoc.data()?.progression?.longestStreak ?? 0;
    const newLongest = Math.max(existing, currentStreak);

    // users/{uid} progression güncelle
    await updateDoc(userDocRef, {
      'progression.currentStreak': currentStreak,
      'progression.longestStreak': newLongest,
      'progression.lastDailyDate': date,
    });
  } catch (error) {
    console.error('syncDailyChallenge error:', error);
    throw error;
  }
}

// 7. syncAchievement
export async function syncAchievement(
  uid: string,
  achievement: AchievementDocument
): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    await setDoc(
      doc(db, 'users', uid, 'achievements', achievement.id),
      achievement,
      { merge: true }
    );
  } catch (error) {
    console.error('syncAchievement error:', error);
    throw error;
  }
}

// 8. processPendingWrites
export async function processPendingWrites(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    const pendingWritesRef = collection(db, 'users', uid, 'pendingWrites');
    const q = query(pendingWritesRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    for (const docSnapshot of snapshot.docs) {
      const write = docSnapshot.data() as PendingWriteDocument;
      const writeId = docSnapshot.id;
      
      try {
        // Type'a göre ilgili sync fonksiyonunu çağır
        switch (write.type) {
          case 'score':
            await syncScore(
              uid,
              write.payload.mode as GameMode,
              write.payload.score as number,
              write.payload.displayName as string,
              write.payload.photoURL as string | null,
              write.payload.sessionDurationSecs as number,
              write.payload.abilities as AbilitiesData
            );
            break;
          case 'daily':
            await syncDailyChallenge(
              uid,
              write.payload.date as string,
              write.payload.score as number,
              write.payload.attempts as number,
              write.payload.currentStreak as number
            );
            break;
          case 'stats':
            await syncGameData(uid, write.payload as UserDocumentUpdate);
            break;
        }

        // Başarılı - status:'done' güncelle
        await updateDoc(doc(db, 'users', uid, 'pendingWrites', writeId), {
          status: 'done',
        });
      } catch (error) {
        console.error('processPendingWrites: write failed', error);
        
        const newAttempts = write.attempts + 1;
        
        // 3 deneme sonrası status:'failed'
        if (newAttempts >= 3) {
          await updateDoc(doc(db, 'users', uid, 'pendingWrites', writeId), {
            status: 'failed',
            attempts: newAttempts,
          });
        } else {
          await updateDoc(doc(db, 'users', uid, 'pendingWrites', writeId), {
            attempts: newAttempts,
          });
        }
      }
    }
  } catch (error) {
    console.error('processPendingWrites error:', error);
    throw error;
  }
}

// 9. addToPendingWrites
export async function addToPendingWrites(
  uid: string,
  type: PendingWriteType,
  payload: Record<string, unknown>
): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    const pendingWrite: PendingWriteDocument = {
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending',
    };
    
    await addDoc(collection(db, 'users', uid, 'pendingWrites'), pendingWrite);
  } catch (error) {
    console.error('addToPendingWrites error:', error);
    throw error;
  }
}

// 10. syncLocalToFirestore (eski fonksiyon, uyumlu tut)
export async function syncLocalToFirestore(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    const statsStr = localStorage.getItem('flux_stats');
    const highScoresStr = localStorage.getItem('flux_highscores');
    const maxLevelStr = localStorage.getItem('flux_max_level');

    const update: UserDocumentUpdate = {};

    if (statsStr) {
      try {
        update.stats = JSON.parse(statsStr);
      } catch (e) {
        console.warn('Failed to parse flux_stats', e);
      }
    }

    if (highScoresStr) {
      try {
        update.highScores = JSON.parse(highScoresStr);
      } catch (e) {
        console.warn('Failed to parse flux_highscores', e);
      }
    }

    if (maxLevelStr) {
      const maxLevel = parseInt(maxLevelStr, 10);
      if (!isNaN(maxLevel)) {
        if (!update.progression) {
          update.progression = {
            maxLevelReached: maxLevel,
            currentStreak: 0,
            longestStreak: 0,
            lastDailyDate: null,
          };
        } else {
          update.progression.maxLevelReached = maxLevel;
        }
      }
    }

    if (Object.keys(update).length > 0) {
      await syncGameData(uid, update);
    }
  } catch (error) {
    console.error('syncLocalToFirestore error:', error);
    throw error;
  }
}
