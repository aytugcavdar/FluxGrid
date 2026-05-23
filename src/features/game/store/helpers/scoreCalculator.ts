// Mini-event system removed - imports deprecated
import { MultiplierBreakdown } from '../../types';
import { POINTS } from '../../constants';
import { getTierScoreMultiplier } from './tierSystem';
import { getEventScoreMultiplier } from './eventSystem';

/**
 * Calculate final score with all multipliers (mini-events removed)
 */
export function calculateScore(
  basePoints: number,
  colorBonus: boolean,
  _deprecatedExternalMultiplier: number,
  tier: number,
  activeEvent: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null,
  miniEventState: any, // Deprecated, kept for compatibility
  linesCleared: number,
  passiveScoreMultiplier: number,
  streakMultiplier: number = 1.0
): { score: number; breakdown: MultiplierBreakdown } {
  const colorMultiplier = colorBonus ? POINTS.COLOR_BONUS_MULTIPLIER : 1.0;
  const tierMultiplier = getTierScoreMultiplier(tier);
  const eventMultiplier = getEventScoreMultiplier(activeEvent);
  
  const totalMultiplier = colorMultiplier * tierMultiplier * eventMultiplier * passiveScoreMultiplier * streakMultiplier;
  const finalScore = Math.floor(basePoints * totalMultiplier);
  
  const breakdown: MultiplierBreakdown = {
    tier: tierMultiplier,
    event: eventMultiplier,
    miniEvents: [], // Mini-events removed
    total: totalMultiplier,
  };
  
  return { score: finalScore, breakdown };
}

