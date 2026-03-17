import { create } from 'zustand';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  setDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../../../services/firebase/config';
import type { LeaderboardEntry, GameMode } from '../../../services/firebase/types';
import type { LeaderboardStore } from '../types';

const db = getFirebaseFirestore();

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  // State
  leaderboards: new Map(),
  userRanks: new Map(),
  userPercentiles: new Map(),
  isLoading: false,
  error: null,

  // Actions
  fetchLeaderboard: async (mode: GameMode, limitCount = 100) => {
    set({ isLoading: true, error: null });

    try {
      const q = query(
        collection(db, `leaderboards/${mode}/scores`),
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: index + 1,
      } as LeaderboardEntry));

      const { leaderboards } = get();
      leaderboards.set(mode, entries);

      set({ leaderboards: new Map(leaderboards), isLoading: false });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
        isLoading: false,
      });
    }
  },

  fetchUserRank: async (uid: string, mode: GameMode) => {
    try {
      const userDoc = await getDoc(doc(db, `leaderboards/${mode}/scores`, uid));

      if (!userDoc.exists()) {
        return;
      }

      const userScore = userDoc.data().score;

      // Count users with higher scores
      const q = query(
        collection(db, `leaderboards/${mode}/scores`),
        where('score', '>', userScore)
      );

      const snapshot = await getDocs(q);
      const rank = snapshot.size + 1;

      const { userRanks } = get();
      userRanks.set(mode, rank);

      set({ userRanks: new Map(userRanks) });
    } catch (error) {
      console.error('Failed to fetch user rank:', error);
    }
  },

  submitScore: async (
    uid: string,
    mode: GameMode,
    score: number,
    displayName: string,
    photoURL: string | null
  ) => {
    set({ isLoading: true, error: null });

    try {
      const leaderboardRef = doc(db, `leaderboards/${mode}/scores`, uid);

      // Check if user already has a score
      const existingDoc = await getDoc(leaderboardRef);

      if (existingDoc.exists()) {
        const existingScore = existingDoc.data().score;

        // Only update if new score is higher
        if (score <= existingScore) {
          set({ isLoading: false });
          return;
        }
      }

      // Submit new score
      await setDoc(leaderboardRef, {
        uid,
        displayName: displayName || 'Anonymous',
        photoURL,
        score,
        achievedAt: serverTimestamp(),
        platform: 'web',
        appVersion: '1.0.0', // TODO: Get from package.json
      });

      // Refresh leaderboard
      await get().fetchLeaderboard(mode);
      await get().fetchUserRank(uid, mode);

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to submit score:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to submit score',
        isLoading: false,
      });
    }
  },

  getNearbyCompetitors: async (uid: string, mode: GameMode) => {
    try {
      // Get user's rank first
      await get().fetchUserRank(uid, mode);
      const userRank = get().userRanks.get(mode);

      if (!userRank) {
        return [];
      }

      const startRank = Math.max(1, userRank - 5);
      const endRank = userRank + 5;

      // Fetch leaderboard with enough entries
      const q = query(
        collection(db, `leaderboards/${mode}/scores`),
        orderBy('score', 'desc'),
        limit(endRank)
      );

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = snapshot.docs
        .slice(startRank - 1, endRank)
        .map((doc, index) => ({
          ...doc.data(),
          rank: startRank + index,
        } as LeaderboardEntry));

      return entries;
    } catch (error) {
      console.error('Failed to get nearby competitors:', error);
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
