import { afterEach, describe, expect, it } from 'vitest';
import {
  getTutorialGridState,
  getTutorialGuidance,
  getTutorialPieces,
  isTutorialTargetFilled,
} from './tutorialPieces';
import { useTutorialStore } from '../store/tutorialStore';
import { useGameStore } from '../../game/store/gameStore';
import { AppState, GameMode } from '@shared/types';

describe('tutorialPieces', () => {
  afterEach(() => {
    useTutorialStore.setState({ isActive: false, isCompleted: true, currentStep: 0 });
  });

  it('provides playable setup for placement and first clear', () => {
    expect(getTutorialPieces(0)).toHaveLength(1);
    expect(getTutorialPieces(0)[0].shape).toEqual([[1, 1]]);
    expect(getTutorialPieces(1)).toHaveLength(1);
    expect(getTutorialPieces(1)[0].shape).toEqual([[1, 1, 1]]);
    expect(getTutorialGridState(0)).not.toBeNull();
    expect(getTutorialGridState(1)).not.toBeNull();
    expect(getTutorialGuidance(0).targetCells).toHaveLength(2);
    expect(getTutorialGuidance(1).targetCells).toHaveLength(3);
  });

  it('keeps gravity guidance as an informational step', () => {
    const guidance = getTutorialGuidance(2);

    expect(guidance.targetCells).toEqual([]);
    expect(guidance.targetLines).toEqual([]);
    expect(guidance.fallingCells).toEqual([]);
    expect(guidance.settledCells).toEqual([
      { x: 1, y: 9 },
      { x: 4, y: 9 },
      { x: 8, y: 9 },
    ]);
  });

  it('does not replace the board before the final ready step', () => {
    expect(getTutorialPieces(3)).toEqual([]);
    expect(getTutorialGridState(3)).toBeNull();
  });

  it('keeps one board across placement, clear, and gravity', () => {
    const grid = getTutorialGridState(0);
    const placementPieces = getTutorialPieces(0);
    expect(grid).not.toBeNull();

    useTutorialStore.setState({ isActive: true, isCompleted: false, currentStep: 0 });
    useGameStore.setState({
      appState: AppState.GAME,
      gameMode: GameMode.ENDLESS,
      grid: grid!,
      pieces: placementPieces,
      score: 0,
      combo: 0,
      difficultyTier: 0,
      tier6GravityCharge: 0,
      isGameOver: false,
    });

    expect(useGameStore.getState().placePiece(placementPieces[0], 5, 9)).toBe(true);
    expect(useGameStore.getState().lastAction?.type).toBe('PLACE');
    expect(isTutorialTargetFilled(0, useGameStore.getState().grid)).toBe(true);
    expect(useGameStore.getState().pieces).toEqual([]);

    const clearPieces = getTutorialPieces(1);
    useTutorialStore.setState({ currentStep: 1 });
    useGameStore.setState({ pieces: clearPieces });
    expect(useGameStore.getState().placePiece(clearPieces[0], 7, 9)).toBe(true);

    const state = useGameStore.getState();
    expect(state.lastAction?.type).toBe('CLEAR');
    expect(state.lastAction?.lines).toBe(1);
    expect(state.grid[9][1].filled).toBe(true);
    expect(state.grid[9][4].filled).toBe(true);
    expect(state.grid[9][8].filled).toBe(true);
  });

  it('does not count tutorial moves in persistent player records', () => {
    useTutorialStore.setState({ isActive: false, isCompleted: false, currentStep: 0 });
    useGameStore.getState().initGame(GameMode.ENDLESS);

    const before = useGameStore.getState();
    const statsBefore = { ...before.stats };
    const highScoresBefore = { ...before.highScores };
    const achievementsBefore = before.achievements.map(achievement => ({ ...achievement }));
    const piece = before.pieces[0];

    expect(useTutorialStore.getState().isActive).toBe(true);
    expect(useGameStore.getState().placePiece(piece, 0, 0)).toBe(true);

    const after = useGameStore.getState();
    expect(after.score).toBeGreaterThan(0);
    expect(after.stats).toEqual(statsBefore);
    expect(after.highScores).toEqual(highScoresBefore);
    expect(after.achievements).toEqual(achievementsBefore);
    expect(after.saveCurrentGame()).toBe(false);
  });
});
