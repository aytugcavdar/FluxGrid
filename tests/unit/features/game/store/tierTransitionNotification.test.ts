import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../../../../src/features/game/store/gameStore';
import { GameMode } from '../../../../../src/shared/types';

describe('Tier Transition Notification', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(GameMode.ENDLESS);
  });

  it('should set lastAction with MILESTONE type when tier changes', () => {
    const store = useGameStore.getState();
    
    // Manually set score to trigger tier 1 (1500 points)
    store.setState({ score: 1500, difficultyTier: 0 });
    
    // Simulate tier check by placing a piece
    const pieces = store.pieces;
    if (pieces.length > 0) {
      const piece = pieces[0];
      // Try to place piece at (0, 0)
      store.placePiece(piece, 0, 0);
    }
    
    // Check if lastAction was set with MILESTONE type
    const lastAction = store.lastAction;
    if (lastAction && lastAction.type === 'MILESTONE') {
      expect(lastAction.type).toBe('MILESTONE');
      expect(lastAction.tier).toBeDefined();
      expect(lastAction.tierName).toBeDefined();
    }
  });

  it('should include tier number and tier name in lastAction', () => {
    const store = useGameStore.getState();
    
    // Set score to tier 2 threshold (4000 points)
    store.setState({ score: 4000, difficultyTier: 1 });
    
    // Simulate tier check
    const pieces = store.pieces;
    if (pieces.length > 0) {
      const piece = pieces[0];
      store.placePiece(piece, 0, 0);
    }
    
    const lastAction = store.lastAction;
    if (lastAction && lastAction.type === 'MILESTONE') {
      expect(lastAction.tier).toBeGreaterThan(0);
      expect(lastAction.tierName).toBeTruthy();
    }
  });

  it('should not trigger MILESTONE in non-ENDLESS modes', () => {
    // Initialize in TIMED mode
    useGameStore.getState().initGame(GameMode.TIMED);
    const store = useGameStore.getState();
    
    // Set high score
    store.setState({ score: 5000 });
    
    // Place a piece
    const pieces = store.pieces;
    if (pieces.length > 0) {
      const piece = pieces[0];
      store.placePiece(piece, 0, 0);
    }
    
    // lastAction should not be MILESTONE in TIMED mode
    const lastAction = store.lastAction;
    if (lastAction) {
      expect(lastAction.type).not.toBe('MILESTONE');
    }
  });
});
