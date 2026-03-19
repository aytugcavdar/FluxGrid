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
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import { GameMode } from '@shared/types';
import {
  UserDocument,
  UserDocumentUpdate,
  LeaderboardEntry,
  CareerProgressDocument,
  DailyHistoryDocument,
  AchievementDocument,
  PendingWriteDocument,
  PendingWriteType,
  DEFAULT_USER_STATS,
  detectPlatform,
} from './types';

// 1. createOrUpdateUser
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

// 2. syncGameData
export async function syncGameData(
  uid: string,
  update: UserDocumentUpdate
): Promise<void> {
  const db = getFirebaseFirestore();
  try {
    await updateDoc(doc(db, 'users', uid), update as any);
  } catch (error) {
    console.error('syncGameData error:', error);
    throw error;
  }
}

// 3. syncScore
export async function syncScore(
  uid: string,
  mode: GameMode,
  score: number,
  displayName: string,
  photoURL: string | null,
  sessionDurationSecs: number
): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    // a) Validation
    if (score < 0 || score > 9999999) {
      console.warn('syncScore: Invalid score', score);
      return;
    }

    // b) Anti-cheat
    if (score > 5000 && sessionDurationSecs < (score / 1000) * 8) {
      console.warn('syncScore: Suspicious session duration', {
        score,
        sessionDurationSecs,
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
        displayName,
        photoURL,
        score,
        achievedAt: Date.now(),
        platform: detectPlatform(),
        appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
        sessionDurationSecs,
        flagged: false,
      };
      await setDoc(leaderboardDocRef, entry);
    }

    // e) users/{uid} highScores.{mode} güncelle (her zaman)
    await updateDoc(doc(db, 'users', uid), {
      [`highScores.${mode}`]: score,
    });
  } catch (error) {
    console.error('syncScore error:', error);
    throw error;
  }
}

// 4. syncFromFirestore
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
    localStorage.setItem(
      'flux_highscores',
      JSON.stringify(userData.highScores ?? {})
    );
    
    const highScoreValues = Object.values(userData.highScores ?? {});
    const maxHighScore = highScoreValues.length > 0 ? Math.max(...highScoreValues) : 0;
    localStorage.setItem('flux_highscore', String(maxHighScore));
    
    localStorage.setItem(
      'flux_max_level',
      String(userData.progression?.maxLevelReached ?? 0)
    );
    localStorage.setItem(
      'flux_daily_streak',
      String(userData.progression?.currentStreak ?? 0)
    );

    // Theme ve language - mevcut değeri koru veya userData'dan al
    if (userData.preferences?.theme) {
      localStorage.setItem('flux_theme', userData.preferences.theme);
    }
    if (userData.preferences?.language) {
      localStorage.setItem('flux_language', userData.preferences.language);
    }
  } catch (error) {
    console.error('syncFromFirestore error:', error);
    throw error;
  }
}

// 5. syncCareerProgress
export async function syncCareerProgress(
  uid: string,
  levelIndex: number,
  data: Omit<CareerProgressDocument, 'levelIndex'>
): Promise<void> {
  const db = getFirebaseFirestore();
  
  try {
    const key = String(levelIndex).padStart(3, '0');
    await setDoc(
      doc(db, 'users', uid, 'careerProgress', key),
      { ...data, levelIndex: key },
      { merge: true }
    );
  } catch (error) {
    console.error('syncCareerProgress error:', error);
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
              write.payload.sessionDurationSecs as number
            );
            break;
          case 'career':
            await syncCareerProgress(
              uid,
              write.payload.levelIndex as number,
              write.payload.data as Omit<CareerProgressDocument, 'levelIndex'>
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
