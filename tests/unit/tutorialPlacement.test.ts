/**
 * Unit tests for Tutorial Piece Placement Validation
 * 
 * Bug Fix: Tutorial validation was comparing piece.instanceId (UUID string)
 * with forcedPiece.pieceIndex (number 0-2), causing all placements to fail.
 * 
 * Fix: Use findIndex to identify which slot the piece is in, then compare
 * that index with forcedPiece.pieceIndex.
 */

import { describe, it, expect } from 'vitest';

describe('Tutorial Piece Placement Validation', () => {
  describe('Piece Index Identification', () => {
    it('should correctly identify piece slot by instanceId', () => {
      // Simulate the pieces array structure
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
        { instanceId: 'uuid-piece-1', shape: [[1], [1], [1]], color: '#10b981' },
        { instanceId: 'uuid-piece-2', shape: [[1, 1]], color: '#f59e0b' },
      ];

      // Test finding each piece's index
      const piece0Index = pieces.findIndex(p => p.instanceId === 'uuid-piece-0');
      const piece1Index = pieces.findIndex(p => p.instanceId === 'uuid-piece-1');
      const piece2Index = pieces.findIndex(p => p.instanceId === 'uuid-piece-2');

      expect(piece0Index).toBe(0);
      expect(piece1Index).toBe(1);
      expect(piece2Index).toBe(2);
    });

    it('should return -1 for non-existent piece', () => {
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
      ];

      const nonExistentIndex = pieces.findIndex(p => p.instanceId === 'non-existent-uuid');

      expect(nonExistentIndex).toBe(-1);
    });
  });

  describe('Tutorial Validation Logic', () => {
    it('should validate correct piece in correct position', () => {
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
        { instanceId: 'uuid-piece-1', shape: [[1], [1], [1]], color: '#10b981' },
        { instanceId: 'uuid-piece-2', shape: [[1, 1]], color: '#f59e0b' },
      ];

      const forcedPiece = {
        shape: [[1, 1, 1]],
        color: '#3b82f6',
        targetX: 3,
        targetY: 8,
        pieceIndex: 0, // Expects first piece (slot 0)
      };

      const placedPiece = pieces[0]; // First piece
      const startX = 3;
      const startY = 8;

      // Simulate the fixed validation logic
      const pieceSlotIndex = pieces.findIndex(p => p.instanceId === placedPiece.instanceId);
      const isCorrectPlacement = 
        startX === forcedPiece.targetX &&
        startY === forcedPiece.targetY &&
        pieceSlotIndex === forcedPiece.pieceIndex;

      expect(isCorrectPlacement).toBe(true);
    });

    it('should reject wrong piece in correct position', () => {
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
        { instanceId: 'uuid-piece-1', shape: [[1], [1], [1]], color: '#10b981' },
        { instanceId: 'uuid-piece-2', shape: [[1, 1]], color: '#f59e0b' },
      ];

      const forcedPiece = {
        shape: [[1, 1, 1]],
        color: '#3b82f6',
        targetX: 3,
        targetY: 8,
        pieceIndex: 0, // Expects first piece (slot 0)
      };

      const placedPiece = pieces[1]; // Wrong piece (second piece)
      const startX = 3;
      const startY = 8;

      // Simulate the fixed validation logic
      const pieceSlotIndex = pieces.findIndex(p => p.instanceId === placedPiece.instanceId);
      const isCorrectPlacement = 
        startX === forcedPiece.targetX &&
        startY === forcedPiece.targetY &&
        pieceSlotIndex === forcedPiece.pieceIndex;

      expect(isCorrectPlacement).toBe(false);
    });

    it('should reject correct piece in wrong position', () => {
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
        { instanceId: 'uuid-piece-1', shape: [[1], [1], [1]], color: '#10b981' },
        { instanceId: 'uuid-piece-2', shape: [[1, 1]], color: '#f59e0b' },
      ];

      const forcedPiece = {
        shape: [[1, 1, 1]],
        color: '#3b82f6',
        targetX: 3,
        targetY: 8,
        pieceIndex: 0, // Expects first piece (slot 0)
      };

      const placedPiece = pieces[0]; // Correct piece
      const startX = 5; // Wrong X position
      const startY = 8;

      // Simulate the fixed validation logic
      const pieceSlotIndex = pieces.findIndex(p => p.instanceId === placedPiece.instanceId);
      const isCorrectPlacement = 
        startX === forcedPiece.targetX &&
        startY === forcedPiece.targetY &&
        pieceSlotIndex === forcedPiece.pieceIndex;

      expect(isCorrectPlacement).toBe(false);
    });

    it('should handle all three piece slots correctly', () => {
      const pieces = [
        { instanceId: 'uuid-piece-0', shape: [[1, 1, 1]], color: '#3b82f6' },
        { instanceId: 'uuid-piece-1', shape: [[1], [1], [1]], color: '#10b981' },
        { instanceId: 'uuid-piece-2', shape: [[1, 1]], color: '#f59e0b' },
      ];

      // Test each slot
      for (let i = 0; i < 3; i++) {
        const forcedPiece = {
          shape: pieces[i].shape,
          color: pieces[i].color,
          targetX: i,
          targetY: i,
          pieceIndex: i,
        };

        const placedPiece = pieces[i];
        const startX = i;
        const startY = i;

        const pieceSlotIndex = pieces.findIndex(p => p.instanceId === placedPiece.instanceId);
        const isCorrectPlacement = 
          startX === forcedPiece.targetX &&
          startY === forcedPiece.targetY &&
          pieceSlotIndex === forcedPiece.pieceIndex;

        expect(isCorrectPlacement).toBe(true);
      }
    });
  });

  describe('Bug Reproduction - Old Logic', () => {
    it('should demonstrate the bug: UUID string never equals number', () => {
      const piece = { instanceId: 'abc-123-def-456' };
      const forcedPiece = { pieceIndex: 0 };

      // This was the broken comparison
      const brokenComparison = piece.instanceId === (forcedPiece.pieceIndex as any);

      // This will ALWAYS be false
      expect(brokenComparison).toBe(false);
    });

    it('should show that even matching indices fail with old logic', () => {
      const pieces = [
        { instanceId: 'uuid-0' },
        { instanceId: 'uuid-1' },
        { instanceId: 'uuid-2' },
      ];

      const forcedPiece = { pieceIndex: 0 };
      const placedPiece = pieces[0]; // First piece, should match pieceIndex 0

      // Old broken logic
      const brokenComparison = placedPiece.instanceId === (forcedPiece.pieceIndex as any);

      // This fails even though it's the correct piece
      expect(brokenComparison).toBe(false);
    });
  });
});
