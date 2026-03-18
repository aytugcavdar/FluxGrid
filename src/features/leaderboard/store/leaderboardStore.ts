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
  startAfter,
  DocumentSnapshot,
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
  lastVisible: null,
  hasMore: false,
  isLoading: false,
  error: null,

  // Actions
  fetchLeaderboard: async (mode: GameMode, limitCount = 50) => {
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

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = snapshot.docs.length === limitCount;

      const { leaderboards } = get();
      leaderboards.set(mode, entries);

      set({ 
        leaderboards: new Map(leaderboards), 
        lastVisible,
        hasMore,
        isLoading: false 
      });
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

      // OPTIMIZED: Try to use count aggregation query first (faster on mobile)
      try {
        // Import getCountFromServer for aggregation query
        const { getCountFromServer } = await import('firebase/firestore');
        
        // Count users with higher scores
        const higherScoresQuery = query(
          collection(db, `leaderboards/${mode}/scores`),
          where('score', '>', userScore)
        );
        
        const countSnapshot = await getCountFromServer(higherScoresQuery);
        const rank = countSnapshot.data().count + 1;
        
        const { userRanks } = get();
        userRanks.set(mode, rank);
        set({ userRanks: new Map(userRanks) });
        return;
      } catch (countError) {
        console.log('Count aggregation not available, falling back to document fetch');
      }

      // FALLBACK: Fetch only top 1001 documents if count() is not available
      const q = query(
        collection(db, `leaderboards/${mode}/scores`),
        orderBy('score', 'desc'),
        limit(1001)
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs;

      // Find user in top 1001
      const userIndex = entries.findIndex(doc => doc.id === uid);

      let rank: number | string;
      if (userIndex !== -1) {
        rank = userIndex + 1; // Exact rank in top 1000
      } else {
        rank = 'Top 1000+'; // User is outside top 1000
      }

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

      if (!userRank || typeof userRank === 'string') {
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

  loadMore: async (mode: GameMode) => {
    const { lastVisible, hasMore } = get();
    if (!hasMore || !lastVisible) return;

    set({ isLoading: true });

    try {
      const q = query(
        collection(db, `leaderboards/${mode}/scores`),
        orderBy('score', 'desc'),
        startAfter(lastVisible),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const currentEntries = get().leaderboards.get(mode) || [];
      const startRank = currentEntries.length + 1;

      const newEntries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: startRank + index,
      } as LeaderboardEntry));

      const allEntries = [...currentEntries, ...newEntries];
      const newLastVisible = snapshot.docs[snapshot.docs.length - 1];
      const newHasMore = snapshot.docs.length === 50;

      const { leaderboards } = get();
      leaderboards.set(mode, allEntries);

      set({ 
        leaderboards: new Map(leaderboards),
        lastVisible: newLastVisible,
        hasMore: newHasMore,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load more:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load more',
        isLoading: false 
      });
    }
  },
}));
