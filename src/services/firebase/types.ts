import { Timestamp } from 'firebase/firestore';

export type GameMode = 'endless' | 'timed' | 'blitz' | 'zen' | 'daily' | 'survival';

export interface UserData {
  // Profile
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp | number;
  lastSeenAt: Timestamp | number;
  platform: 'web' | 'pwa';
  appVersion: string;
  isAnonymous: boolean;

  // Progression
  maxLevelReached: number;
  totalGamesPlayed: number;
  totalTimePlayed: number;
  currentStreak: number;
  longestStreak: number;

  // High Scores
  highScores: {
    endless: number;
    timed: number;
    blitz: number;
    zen: number;
    daily_best: number;
    survival?: number;
  };

  // Preferences
  preferences: {
    theme: string;
    notifications: boolean;
  };

  // Metadata
  onboardingComplete: boolean;
  deviceTokens: string[];
  lastModified: number;
}

export interface GameData {
  displayName?: string;
  photoURL?: string | null;
  platform?: 'web' | 'pwa';
  appVersion?: string;
  maxLevelReached?: number;
  totalGamesPlayed?: number;
  totalTimePlayed?: number;
  currentStreak?: number;
  longestStreak?: number;
  highScores?: Partial<UserData['highScores']>;
  preferences?: Partial<UserData['preferences']>;
  onboardingComplete?: boolean;
}

export interface ModeStats {
  mode: GameMode;
  
  // Time Data
  firstPlayedAt: Timestamp | number;
  lastPlayedAt: Timestamp | number;
  totalSessions: number;
  totalTimeSecs: number;
  avgSessionSecs: number;
  daysActive: string[];

  // Performance
  highScore: number;
  avgScore: number;
  topPercentile: number;
  bestCombo: number;
  linesCleared: number;

  // Retention Signals
  retryCount: number;
  avgRetriesPerSession: number;
  skillUsageRate: number;
  quitAfterFirstGame: boolean;
  peakHour: number;
  preferredDifficulty: string;

  // Metadata
  lastModified: number;
}

export interface DailyData {
  // Performance
  score: number;
  rank: number;
  attempts: number;
  timeToComplete: number;

  // Streak
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  freezeUsed: boolean;

  // Social
  globalPercentile: number;
  shareCount: number;
  seedId: string;

  // Metadata
  lastModified: number;
}

export interface WriteOperation {
  id: string;
  timestamp: number;
  type: 'score' | 'stats' | 'achievement' | 'daily';
  uid: string;
  data: any;
  retries: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  achievedAt: Timestamp | number;
  platform: string;
  appVersion: string;
  rank?: number;
}
