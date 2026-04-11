import { useMemo } from 'react';
import { useGameStore } from '../../features/game/store/gameStore';
import { calculateSpectralIndex, calculateConsistency } from '../utils/performanceCalculations';

export interface PerformanceMetrics {
  spectralIndex: number; // 0-100, calculated overall performance
  winRate: number; // 0-100, percentage of successful games
  totalSessions: number;
  activeDays: number;
  avgScore: number;
  peakScore: number;
  consistency: number; // 0-100, performance consistency
  lastUpdated: number; // timestamp
}

/**
 * Hook to calculate and return performance metrics
 * 
 * @returns PerformanceMetrics object
 * 
 * Preconditions:
 * - GameStore initialized
 * - Valid stats and highScores available
 * 
 * Postconditions:
 * - Returns valid PerformanceMetrics object
 * - spectralIndex: 0-100 with 1 decimal
 * - All numeric fields >= 0
 * - lastUpdated is current timestamp
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const { stats, highScores } = useGameStore();

  return useMemo(() => {
    // Validate stats
    if (!stats) {
      return {
        spectralIndex: 0,
        winRate: 0,
        totalSessions: 0,
        activeDays: 0,
        avgScore: 0,
        peakScore: 0,
        consistency: 0,
        lastUpdated: Date.now(),
      };
    }

    // Calculate metrics
    const totalGames = stats.gamesPlayed || 0;
    const totalScore = stats.totalScore || 0;
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

    // Peak score: highest score across all modes
    const endlessHigh = highScores?.ENDLESS || 0;
    const timedHigh = highScores?.TIMED || 0;
    const peakScore = Math.max(endlessHigh, timedHigh);

    // Win rate: percentage of games with score > 1000 (arbitrary threshold)
    // Since we don't track individual game scores, we'll estimate based on avg score
    const winRate = avgScore > 1000 ? Math.min(100, (avgScore / 10000) * 100) : 0;

    // Consistency: calculate from recent scores (we'll use a simplified version)
    // Since we don't have individual game scores, we'll estimate based on variance
    // For now, use a placeholder calculation
    const consistency = totalGames >= 2 ? Math.min(100, 50 + (totalGames / 10)) : 0;

    // Active days: estimate from games played (1 game = 1 day minimum)
    // This is a rough estimate; ideally we'd track actual play dates
    const activeDays = Math.min(totalGames, Math.ceil(totalGames / 3));

    // Calculate spectral index
    const spectralIndex = calculateSpectralIndex(
      peakScore,
      winRate,
      consistency,
      totalGames
    );

    return {
      spectralIndex,
      winRate: Math.round(winRate),
      totalSessions: totalGames,
      activeDays,
      avgScore,
      peakScore,
      consistency: Math.round(consistency),
      lastUpdated: Date.now(),
    };
  }, [stats, highScores]);
}
