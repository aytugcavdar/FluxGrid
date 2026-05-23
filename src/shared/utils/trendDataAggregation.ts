/**
 * Trend data aggregation utilities for analytics charts
 */

import { GameMode } from '../types';

export interface GameLog {
  id: string;
  mode: GameMode;
  score: number;
  timestamp: number;
  duration: number;
  linesCleared: number;
  maxCombo: number;
  badge?: 'new-record' | 'perfect' | 'comeback' | 'speedrun';
  metadata?: {
    tier?: number;
    skillsUsed?: string[];
  };
}

export interface TrendDataPoint {
  timestamp: number;
  score: number;
  combo: number;
  tier?: number;
  gamesPlayed: number;
}

export type TrendPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Aggregates game logs into trend data points for charting
 * 
 * @param gameLogs - Array of game logs
 * @param period - Time period for aggregation
 * @returns Array of trend data points
 * 
 * Preconditions:
 * - gameLogs: valid array (can be empty)
 * - period: valid period type
 * 
 * Postconditions:
 * - Return array length <= maxBuckets for period
 * - Points sorted by timestamp ascending
 * - All values >= 0
 */
export function aggregateTrendData(
  gameLogs: GameLog[],
  period: TrendPeriod
): TrendDataPoint[] {
  // Validate inputs
  if (!Array.isArray(gameLogs) || gameLogs.length === 0) {
    return [];
  }

  const now = Date.now();
  const periodMs = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };

  const bucketSize = periodMs[period];
  const maxBuckets = period === 'daily' ? 7 : period === 'weekly' ? 4 : 6;

  // Initialize buckets
  const buckets: Map<number, GameLog[]> = new Map();

  // Group logs into time buckets
  for (const log of gameLogs) {
    // Validate log
    if (!log || typeof log.timestamp !== 'number' || log.timestamp < 0) {
      continue;
    }

    const bucketKey = Math.floor(log.timestamp / bucketSize) * bucketSize;

    // Only include recent buckets
    if (now - bucketKey <= bucketSize * maxBuckets) {
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(log);
    }
  }

  // Aggregate each bucket
  const trendPoints: TrendDataPoint[] = [];

  for (const [timestamp, logs] of buckets.entries()) {
    if (logs.length === 0) continue;

    const avgScore = logs.reduce((sum, log) => sum + (log.score || 0), 0) / logs.length;
    const maxCombo = Math.max(...logs.map(log => log.maxCombo || 0));
    const maxTier = Math.max(...logs.map(log => log.metadata?.tier || 0));

    trendPoints.push({
      timestamp,
      score: Math.round(avgScore),
      combo: maxCombo,
      tier: maxTier > 0 ? maxTier : undefined,
      gamesPlayed: logs.length,
    });
  }

  // Sort by timestamp ascending
  trendPoints.sort((a, b) => a.timestamp - b.timestamp);

  return trendPoints;
}

/**
 * Formats a timestamp as relative time string
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Localized relative time string
 * 
 * Preconditions:
 * - timestamp is valid Unix timestamp (milliseconds)
 * - timestamp <= Date.now()
 * 
 * Postconditions:
 * - Returns localized relative time string
 * - Never returns future time
 */
export function formatRelativeTime(timestamp: number): string {
  // Validate input
  if (typeof timestamp !== 'number' || timestamp < 0 || !isFinite(timestamp)) {
    return 'Bilinmiyor';
  }

  const now = Date.now();
  
  // Prevent future times
  if (timestamp > now) {
    return 'Şimdi';
  }

  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return 'Az önce';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} dakika önce`;
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`;
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} hafta önce`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ay önce`;
  } else {
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} yıl önce`;
  }
}
