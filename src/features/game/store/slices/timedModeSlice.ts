import { StateCreator } from 'zustand';
import { GameStore } from '../gameStore';
import { COMBO_TIMER } from '../../constants';

/**
 * Timed Mode slice — timer, boost, milestones, sprint bonus, record tracking.
 * All state and actions specific to GameMode.TIMED.
 */
export interface TimedModeSlice {
  timeLeft: number;
  timerStartTime: number | null;
  timerExpectedEnd: number | null;
  timedBoostMovesLeft: number;
  maxCombo: number;
  finalSprintBonus: number;
  timedMilestones: Set<string>;
  lastMilestoneShown: { id: string; label: string } | null;
  showNewRecordNotification: boolean;
  newRecordDiff: number;
  // Combo Timer (shared with core but driven by timed logic)
  comboTimerStartTime: number | null;
  comboTimerDuration: number;
  comboTimeLeft: number;
}

export const TIMED_MODE_INITIAL: TimedModeSlice = {
  timeLeft: 0,
  timerStartTime: null,
  timerExpectedEnd: null,
  timedBoostMovesLeft: 0,
  maxCombo: 0,
  finalSprintBonus: 0,
  timedMilestones: new Set<string>(),
  lastMilestoneShown: null,
  showNewRecordNotification: false,
  newRecordDiff: 0,
  comboTimerStartTime: null,
  comboTimerDuration: COMBO_TIMER.DURATION,
  comboTimeLeft: 0,
};
