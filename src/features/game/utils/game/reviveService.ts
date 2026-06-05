import { GameMode } from '@shared/types';
import type { GridState } from '../../types';
import { getRandomPiecesSync } from '../../store/helpers/pieces';
import { createContinueGrid } from './gameHelpers';

export const CONTINUE_TIMED_SECONDS = 15;

interface RewardedContinueParams {
  grid: GridState;
  gameMode: GameMode;
  difficultyTier: number;
  timerStartTime: number | null;
  pieceColors: string[];
}

export function createRewardedContinueState({
  grid,
  gameMode,
  difficultyTier,
  timerStartTime,
  pieceColors,
}: RewardedContinueParams): Record<string, any> {
  const rescueGrid = createContinueGrid(grid);
  const rescueTier = gameMode === GameMode.ENDLESS ? Math.max(0, difficultyTier - 1) : 0;
  const now = Date.now();
  const timedResumeState = gameMode === GameMode.TIMED
    ? {
        timeLeft: CONTINUE_TIMED_SECONDS,
        timerStartTime: timerStartTime ?? now,
        timerExpectedEnd: now + CONTINUE_TIMED_SECONDS * 1000,
      }
    : {};

  return {
    grid: rescueGrid,
    pieces: getRandomPiecesSync(
      3,
      rescueGrid,
      gameMode === GameMode.DAILY_CHALLENGE,
      pieceColors,
      rescueTier,
      gameMode
    ),
    isGameOver: false,
    gameOverFinalized: false,
    combo: 0,
    comboTimerStartTime: null,
    comboTimeLeft: 0,
    lastAction: null,
    ...timedResumeState,
  };
}
