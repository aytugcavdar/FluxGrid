import type { LeaderboardEntry, GameMode } from '../../../services/firebase/types';

export type { LeaderboardEntry, GameMode };

export interface LeaderboardState {
  leaderboards: Map<GameMode, LeaderboardEntry[]>;
  userRanks: Map<GameMode, number>;
  userPercentiles: Map<GameMode, number>;
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
  clearError: () => void;
}

export type LeaderboardStore = LeaderboardState & LeaderboardActions;
