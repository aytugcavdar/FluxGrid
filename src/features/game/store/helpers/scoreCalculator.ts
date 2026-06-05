// Mini-event system removed - imports deprecated
import { MultiplierBreakdown } from '../../types';
import { POINTS } from '../../constants';
import { getTierScoreMultiplier } from './tierSystem';
import { getEventScoreMultiplier } from './eventSystem';

export interface TimedScoreBreakdown {
  placementAndLines: number;
  combo: number;
  bonus: number;
  finalSprint: number;
  total: number;
}

export const createEmptyTimedScoreBreakdown = (): TimedScoreBreakdown => ({
  placementAndLines: 0,
  combo: 0,
  bonus: 0,
  finalSprint: 0,
  total: 0,
});

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

interface TurnScoreParams {
  blocksPlaced: number;
  linesCleared: number;
  comboMultiplier: number;
  colorBonus: boolean;
  tier: number;
  activeEvent: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  miniEventState: any;
  streakMultiplier: number;
  isTimedMode: boolean;
  isFinalSeconds: boolean;
  previousTimedBreakdown: TimedScoreBreakdown;
}

export function calculateTurnScore({
  blocksPlaced,
  linesCleared,
  comboMultiplier,
  colorBonus,
  tier,
  activeEvent,
  miniEventState,
  streakMultiplier,
  isTimedMode,
  isFinalSeconds,
  previousTimedBreakdown,
}: TurnScoreParams): {
  pointsGained: number;
  scoreDelta: number;
  sprintBonusGained: number;
  timedScoreBreakdown: TimedScoreBreakdown;
  breakdown: MultiplierBreakdown;
} {
  const placementAndLinePoints =
    (blocksPlaced * POINTS.BLOCK_PLACED) +
    (linesCleared * POINTS.LINE_CLEARED);
  const comboPoints = comboMultiplier * POINTS.COMBO_MULTIPLIER;
  const basePoints = placementAndLinePoints + comboPoints;

  const { score: pointsGained, breakdown } = calculateScore(
    basePoints,
    colorBonus,
    1.0,
    tier,
    activeEvent,
    miniEventState,
    linesCleared,
    1.0,
    streakMultiplier
  );

  const sprintBonusGained = isFinalSeconds && linesCleared > 0
    ? Math.floor(basePoints * 0.5)
    : 0;
  const scoreBonusPoints = Math.max(0, pointsGained - basePoints);
  const scoreDelta = pointsGained + sprintBonusGained;

  const timedScoreBreakdown = isTimedMode ? {
    placementAndLines: previousTimedBreakdown.placementAndLines + placementAndLinePoints,
    combo: previousTimedBreakdown.combo + comboPoints,
    bonus: previousTimedBreakdown.bonus + scoreBonusPoints,
    finalSprint: previousTimedBreakdown.finalSprint + sprintBonusGained,
    total: previousTimedBreakdown.total + scoreDelta,
  } : previousTimedBreakdown;

  return {
    pointsGained,
    scoreDelta,
    sprintBonusGained,
    timedScoreBreakdown,
    breakdown,
  };
}

