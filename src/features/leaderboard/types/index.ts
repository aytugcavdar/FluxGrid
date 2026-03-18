import type { LeaderboardEntry, GameMode } from '../../../services/firebase/types';
import type { DocumentSnapshot } from 'firebase/firestore';

export type { LeaderboardEntry, GameMode };

export interface LeaderboardState {
  leaderboards: Map<GameMode, LeaderboardEntry[]>;
  userRanks: Map<GameMode, number | string>; // number or "Top 1000+"
  userPercentiles: Map<GameMode, number>;
  lastVisible: DocumentSnapshot | null; // For pagination
  hasMore: boolean; // Whether more entries exist
  isLoading: boolean;
  error: string | null;
}

export interface LeaderboardActions {
  fetchLeaderboard: (mode: GameMode, limit?: number) => Promise<void>;
  fetchUserRank: (uid: string, mode: GameMode) => Promise<void>;
  submitScore: (
    uid: string,
    mode: GameMode,
    score: number,
    displayName: string,
    photoURL: string | null
  ) => Promise<void>;
  getNearbyCompetitors: (uid: string, mode: GameMode) => Promise<LeaderboardEntry[]>;
  loadMore: (mode: GameMode) => Promise<void>;
  clearError: () => void;
}

export type LeaderboardStore = LeaderboardState & LeaderboardActions;
