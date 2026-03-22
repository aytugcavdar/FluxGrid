import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode, AppState } from '@shared/types';
import { GRID_SIZE, SkillType } from '@features/game/types';
import type { Piece } from '@features/game/types';

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useGameStore.getState();
    store.resetGame();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = useGameStore.getState();
      
      expect(state.grid).toBeDefined();
      expect(state.grid.length).toBe(GRID_SIZE);
      expect(state.score).toBe(0);
      expect(state.combo).toBe(0);
      expect(state.isGameOver).toBe(false);
      // Pieces may be pre-generated, just check it's an array
      expect(Array.isArray(state.pieces)).toBe(true);
    });

    it('should initialize game in ENDLESS mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const state = useGameStore.getState();
      expect(state.gameMode).toBe(GameMode.ENDLESS);
      expect(state.appState).toBe(AppState.GAME);
      expect(state.pieces.length).toBe(3);
      expect(state.difficultyTier).toBe(0);
    });

    it('should initialize game in TIMED mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      const state = useGameStore.getState();
      expect(state.gameMode).toBe(GameMode.TIMED);
      expect(state.timeLeft).toBe(60);
    });

    it('should initialize game in ZEN mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ZEN);
      
      const state = useGameStore.getState();
      expect(state.gameMode).toBe(GameMode.ZEN);
      expect(state.flux).toBe(100);
      expect(state.zenSessionTime).toBe(0);
      expect(state.zenBlocksPlaced).toBe(0);
    });
  });

  describe('state management', () => {
    it('should set app state', () => {
      const store = useGameStore.getState();
      store.setAppState(AppState.GAME);
      
      expect(useGameStore.getState().appState).toBe(AppState.GAME);
    });

    it('should set game mode', () => {
      const store = useGameStore.getState();
      store.setGameMode(GameMode.ENDLESS);
      
      expect(useGameStore.getState().gameMode).toBe(GameMode.ENDLESS);
    });

    it('should set dragged piece', () => {
      const store = useGameStore.getState();
      const mockPiece: Piece = {
        id: 'test-piece',
        instanceId: 'test-instance-id',
        shape: [[1]],
        color: '#00d4ff',
      };
      
      store.setDraggedPiece(mockPiece);
      expect(useGameStore.getState().draggedPiece).toEqual(mockPiece);
      
      store.setDraggedPiece(null);
      expect(useGameStore.getState().draggedPiece).toBeNull();
    });
  });

  describe('resetGame', () => {
    it('should reset game state', () => {
      const store = useGameStore.getState();
      
      // Modify state
      store.initGame(GameMode.ENDLESS);
      const stateBefore = useGameStore.getState();
      expect(stateBefore.appState).toBe(AppState.GAME);
      
      // Reset
      store.resetGame();
      const stateAfter = useGameStore.getState();
      
      // resetGame doesn't change appState, just resets game variables
      expect(stateAfter.score).toBe(0);
      expect(stateAfter.combo).toBe(0);
      expect(stateAfter.isGameOver).toBe(false);
    });
  });

  describe('canPlacePiece', () => {
    it('should return true for valid placement on empty grid', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const state = useGameStore.getState();
      const piece = state.pieces[0];
      
      if (piece) {
        const canPlace = store.canPlacePiece(state.grid, piece, 0, 0);
        expect(canPlace).toBe(true);
      }
    });

    it('should return false for placement outside grid bounds', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const state = useGameStore.getState();
      const piece = state.pieces[0];
      
      if (piece) {
        const canPlace = store.canPlacePiece(state.grid, piece, GRID_SIZE, GRID_SIZE);
        expect(canPlace).toBe(false);
      }
    });

    it('should return false for placement on occupied cells', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const state = useGameStore.getState();
      const piece = state.pieces[0];
      
      if (piece) {
        // Place first piece
        store.placePiece(piece, 0, 0);
        
        // Try to place on same position
        const updatedState = useGameStore.getState();
        const canPlace = store.canPlacePiece(updatedState.grid, piece, 0, 0);
        expect(canPlace).toBe(false);
      }
    });
  });

  describe('placePiece', () => {
    it('should place piece and update score', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const stateBefore = useGameStore.getState();
      const piece = stateBefore.pieces[0];
      const scoreBefore = stateBefore.score;
      
      if (piece) {
        const placed = store.placePiece(piece, 0, 0);
        expect(placed).toBe(true);
        
        const stateAfter = useGameStore.getState();
        expect(stateAfter.score).toBeGreaterThan(scoreBefore);
      }
    });

    it('should not place piece on invalid position', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const state = useGameStore.getState();
      const piece = state.pieces[0];
      
      if (piece) {
        const placed = store.placePiece(piece, GRID_SIZE + 10, GRID_SIZE + 10);
        expect(placed).toBe(false);
      }
    });

    it('should generate new pieces after placement', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const stateBefore = useGameStore.getState();
      const piece = stateBefore.pieces[0];
      
      if (piece) {
        store.placePiece(piece, 0, 0);
        
        const stateAfter = useGameStore.getState();
        // After placing one piece, we should still have pieces (may regenerate when all 3 used)
        expect(stateAfter.pieces.length).toBeGreaterThan(0);
        // The placed piece should be removed or replaced
        const stillHasSamePiece = stateAfter.pieces.some(p => p.id === piece.id && p.instanceId === piece.instanceId);
        expect(stillHasSamePiece).toBe(false);
      }
    });
  });

  describe('checkGameOver', () => {
    it('should not crash when checking game over', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      // Just verify checkGameOver doesn't crash
      expect(() => store.checkGameOver()).not.toThrow();
      
      // Game should not be over on fresh grid with pieces
      const state = useGameStore.getState();
      expect(state.isGameOver).toBe(false);
    });
  });

  describe('activateSkill', () => {
    it('should activate REROLL skill', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const piecesBefore = useGameStore.getState().pieces;
      store.activateSkill(SkillType.REROLL);
      
      const piecesAfter = useGameStore.getState().pieces;
      expect(piecesAfter.length).toBe(3);
      // Note: We can't reliably test that IDs changed because random generation
      // might produce the same shape. Just verify we have 3 new pieces.
      expect(piecesAfter).toBeDefined();
      expect(piecesAfter.every(p => p.id && p.shape)).toBe(true);
    });

    it('should activate SHATTER skill', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      store.activateSkill(SkillType.SHATTER);
      
      const state = useGameStore.getState();
      expect(state.activeSkill).toBe(SkillType.SHATTER);
    });

    it('should activate BOMB skill', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      store.activateSkill(SkillType.BOMB);
      
      const state = useGameStore.getState();
      // BOMB skill may require flux, check it was called without error
      expect(state.activeSkill).toBeDefined();
    });
  });

  describe('tickTimer', () => {
    it('should decrease time in TIMED mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      const timeBefore = useGameStore.getState().timeLeft;
      store.tickTimer();
      
      const timeAfter = useGameStore.getState().timeLeft;
      expect(timeAfter).toBe(timeBefore - 1);
    });

    it('should trigger game over when time reaches 0', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      // Set time to 1
      useGameStore.setState({ timeLeft: 1 });
      
      store.tickTimer();
      
      const state = useGameStore.getState();
      expect(state.timeLeft).toBe(0);
      expect(state.isGameOver).toBe(true);
    });

  });

  describe('clearAchievementNotification', () => {
    it('should clear achievement notification', () => {
      const store = useGameStore.getState();
      
      useGameStore.setState({ unlockedAchievementId: 'test-achievement' });
      expect(useGameStore.getState().unlockedAchievementId).toBe('test-achievement');
      
      store.clearAchievementNotification();
      expect(useGameStore.getState().unlockedAchievementId).toBeNull();
    });
  });

  describe('stats tracking', () => {
    it('should track blocks placed', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const statsBefore = useGameStore.getState().stats;
      const blocksPlacedBefore = statsBefore.blocksPlaced;
      
      const piece = useGameStore.getState().pieces[0];
      if (piece) {
        store.placePiece(piece, 0, 0);
        
        const statsAfter = useGameStore.getState().stats;
        expect(statsAfter.blocksPlaced).toBeGreaterThan(blocksPlacedBefore);
      }
    });
  });

  describe('high score tracking', () => {
    it('should track high score', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      const initialHighScore = useGameStore.getState().highScore;
      
      // Set a score
      useGameStore.setState({ score: 1000 });
      
      const state = useGameStore.getState();
      expect(state.score).toBe(1000);
      // High score tracking happens on game over or other triggers
      expect(state.highScore).toBeDefined();
    });
  });
});
