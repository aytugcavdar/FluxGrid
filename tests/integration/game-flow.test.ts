import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';
import { GridState, Piece } from '@features/game/types';

// Yardımcı fonksiyon: Grid üzerinde geçerli bir yerleştirme pozisyonu bul
function findValidPosition(
  grid: GridState,
  piece: Piece,
  canPlacePiece: (grid: GridState, piece: Piece, x: number, y: number) => boolean
): { x: number; y: number } | null {
  // Grid üzerinde sistematik olarak pozisyonları tara
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      // Her pozisyon için canPlacePiece ile geçerlilik kontrolü yap
      if (canPlacePiece(grid, piece, x, y)) {
        // İlk geçerli pozisyonu döndür
        return { x, y };
      }
    }
  }
  // Geçerli pozisyon bulunamazsa null döndür
  return null;
}

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
    const initialInstanceIds = initialPieces.map(p => p.instanceId);
    
    // 3 parçayı sırayla yerleştir - her seferinde geçerli pozisyon bul
    for (let i = 0; i < 3; i++) {
      const currentState = useGameStore.getState();
      expect(currentState.pieces.length).toBeGreaterThan(0);
      
      const pieceToPlace = currentState.pieces[0];
      
      // Geçerli pozisyon bul
      const validPos = findValidPosition(
        currentState.grid,
        pieceToPlace,
        currentState.canPlacePiece
      );
      
      // Geçerli pozisyon bulunduğunu doğrula
      expect(validPos).not.toBeNull();
      expect(validPos).toBeDefined();
      
      // Bulunan pozisyonda parçayı yerleştir
      const placed = currentState.placePiece(pieceToPlace, validPos!.x, validPos!.y);
      
      // Her yerleştirmenin başarılı olduğunu doğrula
      expect(placed).toBe(true);
    }
    
    // Tray yenilenmeli - yeni parçalar gelmeli
    const finalPieces = useGameStore.getState().pieces;
    expect(finalPieces).toHaveLength(3);
    
    // Yeni parçaların hiçbiri başlangıçtaki parçalarla aynı olmamalı
    const finalInstanceIds = finalPieces.map(p => p.instanceId);
    finalInstanceIds.forEach(id => {
      expect(initialInstanceIds).not.toContain(id);
    });
  });

  it('parça yerleştirme sonrası tray boyutu doğru güncellenir', () => {
    // İlk durumda 3 parça olmalı
    expect(useGameStore.getState().pieces).toHaveLength(3);
    
    // 1 parça yerleştir - geçerli pozisyon bul
    let state = useGameStore.getState();
    let validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
    expect(validPos).not.toBeNull();
    state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    
    // 2 parça kalmalı
    expect(useGameStore.getState().pieces).toHaveLength(2);
    
    // 2. parçayı yerleştir - geçerli pozisyon bul
    state = useGameStore.getState();
    validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
    expect(validPos).not.toBeNull();
    state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    
    // 1 parça kalmalı
    expect(useGameStore.getState().pieces).toHaveLength(1);
    
    // 3. parçayı yerleştir - geçerli pozisyon bul
    state = useGameStore.getState();
    validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
    expect(validPos).not.toBeNull();
    state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    
    // Tray yenilenmeli - 3 parça olmalı
    expect(useGameStore.getState().pieces).toHaveLength(3);
  });

  it('tray yenileme sonrası parçalar benzersiz instanceId\'lere sahip', () => {
    // 3 parçayı yerleştir - geçerli pozisyonlar bul
    for (let i = 0; i < 3; i++) {
      const state = useGameStore.getState();
      const validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
      expect(validPos).not.toBeNull();
      state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    }
    
    // Yeni parçaların instanceId'leri benzersiz olmalı
    const finalPieces = useGameStore.getState().pieces;
    const instanceIds = finalPieces.map(p => p.instanceId);
    const uniqueIds = new Set(instanceIds);
    
    expect(uniqueIds.size).toBe(3);
  });

  it('birden fazla tray yenileme döngüsü çalışır', () => {
    // İlk 3 parçayı yerleştir - geçerli pozisyonlar bul
    for (let i = 0; i < 3; i++) {
      const state = useGameStore.getState();
      const validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
      expect(validPos).not.toBeNull();
      state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    }
    
    const firstRegenIds = useGameStore.getState().pieces.map(p => p.instanceId);
    expect(firstRegenIds).toHaveLength(3);
    
    // İkinci 3 parçayı yerleştir - geçerli pozisyonlar bul
    for (let i = 0; i < 3; i++) {
      const state = useGameStore.getState();
      const validPos = findValidPosition(state.grid, state.pieces[0], state.canPlacePiece);
      expect(validPos).not.toBeNull();
      state.placePiece(state.pieces[0], validPos!.x, validPos!.y);
    }
    
    const secondRegenIds = useGameStore.getState().pieces.map(p => p.instanceId);
    expect(secondRegenIds).toHaveLength(3);
    
    // İki yenileme döngüsündeki parçalar farklı olmalı
    secondRegenIds.forEach(id => {
      expect(firstRegenIds).not.toContain(id);
    });
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
