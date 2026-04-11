import { useMemo } from 'react';
import { useGameStore } from '../../features/game/store/gameStore';
import { aggregateTrendData, TrendDataPoint, TrendPeriod } from '../utils/trendDataAggregation';

/**
 * Hook to aggregate and return trend data for charting
 * 
 * @param period - Time period for aggregation ('daily' | 'weekly' | 'monthly')
 * @returns Array of TrendDataPoint
 * 
 * Preconditions:
 * - period is valid enum value
 * - GameStore has gameLogs array (can be empty)
 * 
 * Postconditions:
 * - Returns array of TrendDataPoint
 * - Array length <= max for period (7/4/6)
 * - Points sorted by timestamp ascending
 * - All numeric values >= 0
 */
export function useTrendData(period: TrendPeriod): TrendDataPoint[] {
  const { gameLogs } = useGameStore();
  
  return useMemo(() => {
    // Safely check if gameLogs is an array
    if (!Array.isArray(gameLogs) || gameLogs.length === 0) {
      return [];
    }
    
    return aggregateTrendData(gameLogs, period);
  }, [gameLogs, period]);
}
