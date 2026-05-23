import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import type { Piece } from '@features/game/types';
import { GRID_SIZE } from '@features/game/types';
import { AppState, GameMode } from '@shared/types';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      appState: AppState.HOME,
      gameMode: GameMode.ENDLESS,
      isGameOver: false,
      score: 0,
      combo: 0,
      activeEvent: null,
      eventMovesRemaining: 0,
      totalMovesPlayed: 0,
      difficultyTier: 0,
      draggedPiece: null,
    });
    vi.clearAllMocks();
  });

  it('starts with a valid grid and piece collection', () => {
    const state = useGameStore.getState();

    expect(state.grid).toHaveLength(GRID_SIZE);
    expect(state.grid[0]).toHaveLength(GRID_SIZE);
    expect(Array.isArray(state.pieces)).toBe(true);
    expect(state.score).toBe(0);
    expect(state.combo).toBe(0);
  });

  it.each([GameMode.ENDLESS, GameMode.TIMED, GameMode.DAILY_CHALLENGE])(
    'initializes %s games',
    (mode) => {
      useGameStore.getState().initGame(mode);

      const state = useGameStore.getState();
      expect(state.gameMode).toBe(mode);
      expect(state.appState).toBe(AppState.GAME);
      expect(state.pieces).toHaveLength(3);
      expect(state.isGameOver).toBe(false);
      if (mode === GameMode.TIMED) {
        expect(state.timeLeft).toBe(60);
      }
    }
  );

  it('updates app state, game mode, and dragged piece', () => {
    const store = useGameStore.getState();
    const piece: Piece = {
      id: 'single',
      instanceId: 'single-instance',
      shape: [[1]],
      color: '#00d4ff',
    };

    store.setAppState(AppState.GAME);
    store.setGameMode(GameMode.TIMED);
    store.setDraggedPiece(piece);

    expect(useGameStore.getState().appState).toBe(AppState.GAME);
    expect(useGameStore.getState().gameMode).toBe(GameMode.TIMED);
    expect(useGameStore.getState().draggedPiece).toEqual(piece);

    store.setDraggedPiece(null);
    expect(useGameStore.getState().draggedPiece).toBeNull();
  });

  it('validates piece placement bounds and collisions', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.ENDLESS);
    const state = useGameStore.getState();
    const piece = state.pieces[0];

    expect(piece).toBeDefined();
    expect(store.canPlacePiece(state.grid, piece, 0, 0)).toBe(true);
    expect(store.canPlacePiece(state.grid, piece, GRID_SIZE, GRID_SIZE)).toBe(false);

    expect(store.placePiece(piece, 0, 0)).toBe(true);
    expect(store.canPlacePiece(useGameStore.getState().grid, piece, 0, 0)).toBe(false);
  });

  it('places a piece, scores, and removes the placed instance', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.ENDLESS);
    const before = useGameStore.getState();
    const piece = before.pieces[0];

    expect(store.placePiece(piece, 0, 0)).toBe(true);

    const after = useGameStore.getState();
    expect(after.score).toBeGreaterThan(before.score);
    expect(after.pieces.some(p => p.instanceId === piece.instanceId)).toBe(false);
  });

  it('does not place a piece outside the grid', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.ENDLESS);
    const piece = useGameStore.getState().pieces[0];

    expect(store.placePiece(piece, GRID_SIZE + 1, GRID_SIZE + 1)).toBe(false);
  });

  it('checks game over without crashing on a fresh game', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.ENDLESS);

    expect(() => store.checkGameOver()).not.toThrow();
    expect(useGameStore.getState().isGameOver).toBe(false);
  });

  it('clears achievement notifications', () => {
    useGameStore.setState({ unlockedAchievementId: 'score_1k' });

    useGameStore.getState().clearAchievementNotification();

    expect(useGameStore.getState().unlockedAchievementId).toBeNull();
  });

  it('tracks stats after a placement', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.ENDLESS);
    const before = useGameStore.getState().stats.blocksPlaced;
    const piece = useGameStore.getState().pieces[0];

    store.placePiece(piece, 0, 0);

    expect(useGameStore.getState().stats.blocksPlaced).toBeGreaterThan(before);
  });

  it('allows external store snapshots to update high scores and stats', () => {
    const store = useGameStore.getState();
    const highScores = {
      [GameMode.ENDLESS]: 15000,
      [GameMode.TIMED]: 8000,
      [GameMode.DAILY_CHALLENGE]: 5000,
    };
    const stats = {
      gamesPlayed: 50,
      totalScore: 100000,
      linesCleared: 500,
      blocksPlaced: 2000,
      bombsExploded: 10,
      iceBroken: 20,
      skillUses: {},
    };

    store.setState({ highScores, stats, maxLevelReached: 25 });

    const state = useGameStore.getState();
    expect(state.highScores).toEqual(highScores);
    expect(state.stats).toEqual(stats);
    expect(state.maxLevelReached).toBe(25);
  });

  it('keeps mini-event breakdown empty in non-endless modes', () => {
    const store = useGameStore.getState();
    store.initGame(GameMode.TIMED);
    const miniEventState = useGameStore.getState().miniEventState;
    miniEventState.activeEvents.add('LEGACY_EVENT');
    useGameStore.setState({ miniEventState });
    const piece = useGameStore.getState().pieces[0];

    store.placePiece(piece, 0, 0);

    const breakdown = useGameStore.getState().lastMultiplierBreakdown;
    expect(breakdown?.miniEvents ?? []).toEqual([]);
  });
});
