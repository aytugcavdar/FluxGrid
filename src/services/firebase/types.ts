import { GameMode } from '@shared/types';

// Cihaz kaydı — multi-platform FCM/APNs için
export interface DeviceInfo {
  token: string;
  platform: 'web' | 'android' | 'ios';
  appVersion: string;
  addedAt: number;
  lastSeenAt: number;
}

// Oyuncu istatistikleri map'i
export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  linesCleared: number;
  blocksPlaced: number;
  bombsExploded: number;
  iceBroken: number;
  highestCombo: number;
  totalPlaytimeSecs: number;
  skillUses: Record<string, number>;
}

// Kariyer ve streak
export interface UserProgression {
  maxLevelReached: number;
  currentStreak: number;
  longestStreak: number;
  lastDailyDate: string | null; // 'YYYY-MM-DD'
}

// Kullanıcı tercihleri
export interface UserPreferences {
  theme: string;
  language: string;
  muted: boolean;
}

// Ana users/{uid} belgesi
export interface UserDocument {
  uid: string;
  schemaVersion: number; // şu an: 2
  displayName: string;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: number;
  lastSeenAt: number;
  onboardingComplete: boolean;
  devices: Record<string, DeviceInfo>; // key = token.substring(0,16)
  highScores: Partial<Record<GameMode, number>>;
  stats: UserStats;
  progression: UserProgression;
  preferences: UserPreferences;
  lastPlatform: 'web' | 'android' | 'ios';
  lastAppVersion: string;
  deviceTokens?: string[]; // deprecated — migration için tutulacak
}

// Leaderboard skor belgesi — leaderboards/{mode}/scores/{uid}
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  achievedAt: number;
  platform: 'web' | 'android' | 'ios';
  appVersion: string;
  sessionDurationSecs: number;
  flagged: boolean;
  rank?: number; // client tarafı hesaplanır, Firestore'da opsiyonel
}

// Leaderboard meta cache — leaderboards/{mode}/meta/summary
export interface LeaderboardMeta {
  top10: LeaderboardEntry[];
  totalPlayers: number;
  updatedAt: number;
}

// Günlük meydan okuma — dailyChallenges/{YYYY-MM-DD}
export interface DailyChallengeDocument {
  date: string;
  seed: number;
  createdAt: number;
  totalPlayers: number;
}

// Kariyer seviye ilerlemesi — users/{uid}/careerProgress/{levelIndex}
export interface CareerProgressDocument {
  levelIndex: string; // '001' formatı
  completed: boolean;
  stars: number; // 0-3
  bestScore: number;
  attempts: number;
  completedAt: number | null;
}

// Günlük geçmiş — users/{uid}/dailyHistory/{YYYY-MM-DD}
export interface DailyHistoryDocument {
  date: string;
  score: number;
  attempts: number;
  completedAt: number;
  streakAtCompletion: number;
}

// Başarım — users/{uid}/achievements/{id}
export interface AchievementDocument {
  id: string;
  unlocked: boolean;
  currentValue: number;
  unlockedAt: number | null;
}

// Offline yazma kuyruğu — users/{uid}/pendingWrites/{writeId}
export type PendingWriteType = 'score' | 'career' | 'daily' | 'stats';

export interface PendingWriteDocument {
  type: PendingWriteType;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'done' | 'failed';
}

// Uygulama konfigürasyonu — appConfig/v1
export interface AppConfigDocument {
  minVersionWeb: string;
  minVersionAndroid: string;
  minVersionIOS: string;
  maintenanceMode: boolean;
  maintenanceMessage: { tr: string; en: string } | null;
  featureFlags: Record<string, boolean>;
  updatedAt: number;
}

// Sync için kullanılan partial update tipi
export type UserDocumentUpdate = Partial<Omit<UserDocument, 'uid' | 'createdAt' | 'schemaVersion'>>;

// Platform yardımcı fonksiyonu
export function detectPlatform(): 'web' | 'android' | 'ios' {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'web';
}

// Default UserStats
export const DEFAULT_USER_STATS: UserStats = {
  gamesPlayed: 0,
  totalScore: 0,
  linesCleared: 0,
  blocksPlaced: 0,
  bombsExploded: 0,
  iceBroken: 0,
  highestCombo: 0,
  totalPlaytimeSecs: 0,
  skillUses: {},
};

// Default UserProgression
export const DEFAULT_PROGRESSION: UserProgression = {
  maxLevelReached: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastDailyDate: null,
};
