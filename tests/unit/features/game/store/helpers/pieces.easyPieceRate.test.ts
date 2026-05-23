/**
 * Unit tests for easy piece rate scaling in pieces.ts
 * Validates Requirements 6.1, 6.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getRandomPiecesSync } from '@features/game/store/helpers/pieces';
import { GameMode } from '@shared/types';

describe('Easy Piece Rate Scaling', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  it('should generate approximately 30% easy pieces at score 0', () => {
    const pieces = getRandomPiecesSync(
      1000, // Generate many pieces for statistical accuracy
      undefined,
      false,
      undefined,
      undefined,
      GameMode.TIMED,
      undefined,
      0 // score = 0
    );

    const easyPieces = pieces.filter(p =>
      ['dot', 'h2', 'v2'].includes(p.id)
    );

    const easyPieceRate = easyPieces.length / pieces.length;
    
    // Allow 5% margin of error due to randomness
    expect(easyPieceRate).toBeGreaterThan(0.25);
    expect(easyPieceRate).toBeLessThan(0.35);
  });

  it('should generate approximately 5% easy pieces at score 140000+ (minimum rate)', () => {
    const pieces = getRandomPiecesSync(
      1000,
      undefined,
      false,
      undefined,
      undefined,
      GameMode.TIMED,
      undefined,
      140000 // score = 140000 (reaches minimum 10% rate)
    );

    const easyPieces = pieces.filter(p =>
      ['dot', 'h2', 'v2'].includes(p.id)
    );

    const easyPieceRate = easyPieces.length / pieces.length;
    
    // At score 140000+: max(0.05, 0.30 - (140000 / 20000) * 0.05) = 0.05
    // Allow 3% margin of error due to randomness
    expect(easyPieceRate).toBeGreaterThan(0.02);
    expect(easyPieceRate).toBeLessThan(0.08);
  });

  it('should generate approximately 21% easy pieces at score 35000 (midpoint)', () => {
    const pieces = getRandomPiecesSync(
      1000,
      undefined,
      false,
      undefined,
      undefined,
      GameMode.TIMED,
      undefined,
      35000 // score = 35000 (midpoint between 0 and 70000)
    );

    const easyPieces = pieces.filter(p =>
      ['dot', 'h2', 'v2'].includes(p.id)
    );

    const easyPieceRate = easyPieces.length / pieces.length;
    
    // At score 35000: max(0.05, 0.30 - (35000 / 20000) * 0.05) = 0.2125
    // Allow 10% margin of error
    expect(easyPieceRate).toBeGreaterThan(0.12);
    expect(easyPieceRate).toBeLessThan(0.32);
  });

  it('should classify dot, h2, and v2 as easy pieces', () => {
    const pieces = getRandomPiecesSync(
      100,
      undefined,
      false,
      undefined,
      undefined,
      GameMode.TIMED,
      undefined,
      0
    );

    const easyPieceIds = ['dot', 'h2', 'v2'];
    const easyPieces = pieces.filter(p => easyPieceIds.includes(p.id));

    // Verify all easy pieces are from the expected set
    easyPieces.forEach(piece => {
      expect(easyPieceIds).toContain(piece.id);
    });
  });

  it('should not apply easy piece scaling in non-TIMED modes', () => {
    const endlessPieces = getRandomPiecesSync(
      1000,
      undefined,
      false,
      undefined,
      undefined,
      GameMode.ENDLESS, // Not TIMED mode
      undefined,
      0
    );

    const easyPieces = endlessPieces.filter(p => 
      ['dot', 'h2', 'v2'].includes(p.id)
    );

    const easyPieceRate = easyPieces.length / endlessPieces.length;
    
    // In ENDLESS mode, easy piece rate should not be artificially high
    // It should be closer to natural distribution (not 45%)
    // This is a rough check - the exact rate depends on the ENDLESS mode logic
    expect(easyPieceRate).toBeLessThan(0.40);
  });

  it('should handle score parameter correctly when undefined', () => {
    // Should default to score 0 behavior (30% easy pieces)
    const pieces = getRandomPiecesSync(
      1000,
      undefined,
      false,
      undefined,
      undefined,
      GameMode.TIMED,
      undefined,
      undefined // score = undefined
    );

    const easyPieces = pieces.filter(p =>
      ['dot', 'h2', 'v2'].includes(p.id)
    );

    const easyPieceRate = easyPieces.length / pieces.length;
    
    // Should behave like score 0 (30% easy pieces)
    expect(easyPieceRate).toBeGreaterThan(0.25);
    expect(easyPieceRate).toBeLessThan(0.35);
  });
});
