import { ProgressionState } from '../../types';
import { createMiniEventState } from '../helpers/miniEventSystem';
import { createProgressionState } from '../helpers/progressionSystem';

/**
 * Progression slice — difficulty tiers, events, endless progression.
 */
export interface ProgressionSlice {
  difficultyTier: number;
  tier6GravityCharge: number;
  totalMovesPlayed: number;
  tierStartMove: number;
  activeEvent: 'ICE_STORM' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;
  miniEventState: ReturnType<typeof createMiniEventState>;
  progressionState: ProgressionState;
  lastMultiplierBreakdown: import('../../types').MultiplierBreakdown | null;
}

export const PROGRESSION_INITIAL: ProgressionSlice = {
  difficultyTier: 0,
  tier6GravityCharge: 0,
  totalMovesPlayed: 0,
  tierStartMove: 0,
  activeEvent: null,
  eventMovesRemaining: 0,
  miniEventState: createMiniEventState(),
  progressionState: createProgressionState(),
  lastMultiplierBreakdown: null,
};
