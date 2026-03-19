import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from './config';

/**
 * Get daily challenge seed from Firestore
 * If seed doesn't exist for today, create it
 */
export async function getDailySeedFromServer(): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const dailyChallengeRef = doc(db, 'dailyChallenges', today);

    // Try to get existing seed
    const dailyChallengeDoc = await getDoc(dailyChallengeRef);

    if (dailyChallengeDoc.exists()) {
      return dailyChallengeDoc.data().seed;
    }

    // Seed doesn't exist, create it
    // Use server-side deterministic seed based on date
    const dateNum = parseInt(today.replace(/-/g, '')); // e.g., 20260319
    const seed = dateNum;

    await setDoc(dailyChallengeRef, {
      seed,
      date: today,
      createdAt: Date.now(),
    });

    return seed;
  } catch (error) {
    console.error('Failed to get daily seed from server:', error);
    
    // Fallback to client-side seed if Firebase fails
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
}

/**
 * Get cached daily seed from localStorage
 * Used for offline mode
 */
export function getCachedDailySeed(): { seed: number; date: string } | null {
  try {
    const cached = localStorage.getItem('flux_daily_seed_cache');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const today = new Date().toISOString().split('T')[0];
    
    // Check if cache is for today
    if (data.date === today) {
      return data;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache daily seed to localStorage
 */
export function cacheDailySeed(seed: number, date: string): void {
  try {
    localStorage.setItem('flux_daily_seed_cache', JSON.stringify({ seed, date }));
  } catch (error) {
    console.warn('Failed to cache daily seed:', error);
  }
}
