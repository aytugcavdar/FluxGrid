import { describe, it, expect } from 'vitest';
import { getRandomPieces } from '@features/game/store/helpers/pieces';
import { createEmptyGrid } from '@features/game/store/helpers/grid';

describe('getRandomPieces', () => {
  it('istenen sayıda parça döner', () => {
    expect(getRandomPieces(3)).toHaveLength(3);
    expect(getRandomPieces(1)).toHaveLength(1);
  });

  it('her parçanın benzersiz instanceId\'si var', () => {
    const pieces = getRandomPieces(20);
    const ids = new Set(pieces.map(p => p.instanceId));
    expect(ids.size).toBe(20);
  });

  it('parça şekilleri geçerli 2D array', () => {
    getRandomPieces(10).forEach(piece => {
      expect(piece.shape.length).toBeGreaterThan(0);
      expect(piece.shape[0].length).toBeGreaterThan(0);
      // 0 ve 1'den başka değer içermiyor
      piece.shape.flat().forEach(v => expect([0, 1]).toContain(v));
    });
  });

  it('yoğun grid\'de küçük parçalar tercih edilir', () => {
    const grid = createEmptyGrid();
    // %80 dolu grid
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        grid[y][x] = { filled: true, color: '#ff0000' };
      }
    }
    const pieces = getRandomPieces(30, grid);
    const avgSize = pieces.reduce((sum, p) => {
      return sum + p.shape.flat().filter(v => v === 1).length;
    }, 0) / pieces.length;
    expect(avgSize).toBeLessThan(4.5);
  });

  it('her parçanın type alanı tanımlı', () => {
    getRandomPieces(20).forEach(piece => {
      expect(piece.type).toBeDefined();
    });
  });
});
