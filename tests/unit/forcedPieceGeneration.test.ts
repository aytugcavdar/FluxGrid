import { describe, it, expect, beforeEach } from 'vitest';
import { getRandomPiecesSync } from '@features/game/store/helpers/pieces';
import { useTutorialStore } from '@shared/store/tutorialStore';
import { GameMode } from '@shared/types';

describe('Forced Piece Generation for Tutorial', () => {
  beforeEach(() => {
    // Reset tutorial store before each test
    const store = useTutorialStore.getState();
    store.skip();
  });

  it('should generate forced piece at step 1', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS, 1);
    
    expect(pieces).toHaveLength(3);
    
    // Step 1 forced piece should be at index 0
    const forcedPiece = pieces[0];
    expect(forcedPiece.shape).toEqual([[1, 1, 1]]); // Horizontal line
    expect(forcedPiece.color).toBe('#3b82f6'); // Blue
    expect(forcedPiece.id).toBe('forced-1');
  });

  it('should generate forced piece at step 2', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS, 2);
    
    expect(pieces).toHaveLength(3);
    
    // Step 2 forced piece should be at index 1
    const forcedPiece = pieces[1];
    expect(forcedPiece.shape).toEqual([[1], [1], [1]]); // Vertical line
    expect(forcedPiece.color).toBe('#10b981'); // Green
    expect(forcedPiece.id).toBe('forced-2');
  });

  it('should generate forced piece at step 5', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS, 5);
    
    expect(pieces).toHaveLength(3);
    
    // Step 5 forced piece should be at index 0
    const forcedPiece = pieces[0];
    expect(forcedPiece.shape).toEqual([[1, 1]]); // Small horizontal
    expect(forcedPiece.color).toBe('#f59e0b'); // Orange
    expect(forcedPiece.id).toBe('forced-5');
  });

  it('should generate random pieces for non-forced slots', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS, 1);
    
    expect(pieces).toHaveLength(3);
    
    // Pieces at index 1 and 2 should be random (not forced)
    expect(pieces[1].id).not.toBe('forced-1');
    expect(pieces[2].id).not.toBe('forced-1');
  });

  it('should generate all random pieces when no tutorial step provided', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS);
    
    expect(pieces).toHaveLength(3);
    
    // All pieces should be random (no forced pieces)
    pieces.forEach(piece => {
      expect(piece.id).not.toContain('forced');
    });
  });

  it('should generate all random pieces for steps without forced config', () => {
    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 0, GameMode.ENDLESS, 3);
    
    expect(pieces).toHaveLength(3);
    
    // Step 3 has no forced piece config, so all should be random
    pieces.forEach(piece => {
      expect(piece.id).not.toContain('forced');
    });
  });
});
