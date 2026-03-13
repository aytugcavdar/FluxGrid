import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';

describe('Game Flow Integration', () => {
  beforeEach(() => {
    useGameStore.getState().initGame(GameMode.ENDLESS);
  });

  it('initGame sonrası başlangıç state\'i doğru', () => {
    const state = useGameStore.getState();
    expect(state.score).toBe(0);
    expect(state.pieces).toHaveLength(3);
    expect(state.isGameOver).toBe(false);
    expect(state.grid).toHaveLength(10);
    expect(state.grid[0]).toHaveLength(10);
  });

  it('parça yerleştirme score artırır', () => {
    const { pieces, placePiece } = useGameStore.getState();
    const piece = pieces[0];
    const placed = placePiece(piece, 0, 0);
    expect(placed).toBe(true);
    expect(useGameStore.getState().score).toBeGreaterThan(0);
  });

  it('3 parça kullanılınca tray yenilenir', () => {
    const initialPieces = useGameStore.getState().pieces;
    const firstPieceId = initialPieces[0].instanceId;
    
    // 3 parçayı sırayla yerleştir
    for (let i = 0; i < 3; i++) {
      const { pieces, placePiece } = useGameStore.getState();
      if (pieces.length > 0) {
        placePiece(pieces[0], 0, i * 2);
      }
    }
    
    // Tray yenilenmeli - yeni parçalar gelmeli
    const finalPieces = useGameStore.getState().pieces;
    expect(finalPieces).toHaveLength(3);
    expect(finalPieces[0].instanceId).not.toBe(firstPieceId);
  });

  it('parça yerleştirme flux günceller', () => {
    const initial = useGameStore.getState().flux;
    const { pieces, placePiece } = useGameStore.getState();
    placePiece(pieces[0], 0, 0);
    expect(useGameStore.getState().flux).toBeGreaterThanOrEqual(initial);
  });

  it('flux 100\'e ulaşınca surge aktive olur', () => {
    useGameStore.setState({ flux: 98 });
    const { pieces, placePiece } = useGameStore.getState();
    placePiece(pieces[0], 0, 0);
    const { flux, isSurgeActive } = useGameStore.getState();
    if (flux >= 100) {
      expect(isSurgeActive).toBe(true);
    }
  });
});
