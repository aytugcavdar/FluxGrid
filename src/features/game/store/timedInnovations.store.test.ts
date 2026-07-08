import { beforeEach, describe, expect, it } from 'vitest';
import { AppState, GameMode } from '@shared/types';
import { useTutorialStore } from '@features/tutorial/store/tutorialStore';
import { useGameStore } from './gameStore';
import { createEmptyGrid } from './helpers/grid';
import type { Piece } from '../types';

const singleBlock: Piece = {
  id: 'last-chance-dot',
  instanceId: 'last-chance-dot-1',
  shape: [[1]],
  color: '#fbbf24',
};

describe('Timed innovation store flow', () => {
  beforeEach(() => {
    useTutorialStore.setState({ isActive: false, isCompleted: true });
    useGameStore.getState().initGame(GameMode.TIMED);
  });

  it('resumes the timer when the last-chance piece clears a line', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < 9; x++) {
      grid[9][x] = { filled: true, color: '#3b82f6', id: `row-${x}` };
    }

    useGameStore.setState({
      appState: AppState.GAME,
      grid,
      pieces: [singleBlock],
      timeLeft: 0,
      timerStartTime: Date.now() - 60_000,
      timerExpectedEnd: null,
      timedLastChanceAvailable: false,
      timedLastChanceActive: true,
      timedTargets: [],
    });

    expect(useGameStore.getState().placePiece(singleBlock, 9, 9)).toBe(true);

    const state = useGameStore.getState();
    expect(state.isGameOver).toBe(false);
    expect(state.timedLastChanceActive).toBe(false);
    expect(state.timeLeft).toBeGreaterThanOrEqual(5);
    expect(state.timerExpectedEnd).not.toBeNull();
  });

  it('ends the run when the last-chance piece does not clear', () => {
    useGameStore.setState({
      appState: AppState.GAME,
      grid: createEmptyGrid(),
      pieces: [singleBlock],
      timeLeft: 0,
      timerStartTime: Date.now() - 60_000,
      timerExpectedEnd: null,
      timedLastChanceAvailable: false,
      timedLastChanceActive: true,
      timedTargets: [],
    });

    expect(useGameStore.getState().placePiece(singleBlock, 0, 0)).toBe(true);
    expect(useGameStore.getState().isGameOver).toBe(true);
    expect(useGameStore.getState().timedLastChanceActive).toBe(false);
  });
});
