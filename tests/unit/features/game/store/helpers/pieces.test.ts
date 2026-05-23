import { afterEach, describe, it, expect, vi } from 'vitest';
import { getRandomPieces, getRandomPiecesSync } from '@features/game/store/helpers/pieces';
import { createEmptyGrid } from '@features/game/store/helpers/grid';
import { CellType } from '@features/game/types';
import { GameMode } from '@shared/types';

const colorDistance = (a: string, b: string) => {
  const rgbA = Number.parseInt(a.replace('#', ''), 16);
  const rgbB = Number.parseInt(b.replace('#', ''), 16);
  const dr = ((rgbA >> 16) & 255) - ((rgbB >> 16) & 255);
  const dg = ((rgbA >> 8) & 255) - ((rgbB >> 8) & 255);
  const db = (rgbA & 255) - (rgbB & 255);

  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const blockCount = (piece: { shape: number[][] }) =>
  piece.shape.flat().filter(value => value === 1).length;

const canPlacePiece = (grid: ReturnType<typeof createEmptyGrid>, piece: { shape: number[][] }) => {
  for (let y = 0; y <= grid.length - piece.shape.length; y++) {
    for (let x = 0; x <= grid[0].length - piece.shape[0].length; x++) {
      let canPlace = true;

      for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
          if (piece.shape[py][px] === 1 && grid[y + py][x + px].filled) {
            canPlace = false;
          }
        }
      }

      if (canPlace) return true;
    }
  }

  return false;
};

describe('getRandomPieces', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('istenen sayıda parça döner', async () => {
    expect(await getRandomPieces(3)).toHaveLength(3);
    expect(await getRandomPieces(1)).toHaveLength(1);
  });

  it('her parçanın benzersiz instanceId\'si var', async () => {
    const pieces = await getRandomPieces(20);
    const ids = new Set(pieces.map(p => p.instanceId));
    expect(ids.size).toBe(20);
  });

  it('parça şekilleri geçerli 2D array', async () => {
    const pieces = await getRandomPieces(10);
    pieces.forEach(piece => {
      expect(piece.shape.length).toBeGreaterThan(0);
      expect(piece.shape[0].length).toBeGreaterThan(0);
      // 0 ve 1'den başka değer içermiyor
      piece.shape.flat().forEach(v => expect([0, 1]).toContain(v));
    });
  });

  it('yoğun grid\'de küçük parçalar tercih edilir', async () => {
    const grid = createEmptyGrid();
    // %80 dolu grid
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 10; x++) {
        grid[y][x] = { filled: true, color: '#ff0000' };
      }
    }
    const pieces = await getRandomPieces(30, grid);
    const avgSize = pieces.reduce((sum, p) => {
      return sum + p.shape.flat().filter(v => v === 1).length;
    }, 0) / pieces.length;
    expect(avgSize).toBeLessThan(4.5);
  });

  it('her parçanın type alanı tanımlı', async () => {
    const pieces = await getRandomPieces(20);
    pieces.forEach(piece => {
      expect(piece.type).toBeDefined();
    });
  });
  it('tepside tema renklerini birbirinden ayirt edilebilir secer', () => {
    const palette = ['#e879f9', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#facc15', '#60a5fa', '#fb7185', '#c084fc'];
    const pieces = getRandomPiecesSync(3, undefined, false, palette, undefined, GameMode.TIMED);
    const normalPieceColors = pieces.map(piece => piece.color);

    pieces.forEach(piece => expect(piece.type).toBe(CellType.NORMAL));

    expect(new Set(normalPieceColors).size).toBe(normalPieceColors.length);
    expect(colorDistance(normalPieceColors[0], normalPieceColors[1])).toBeGreaterThanOrEqual(95);
    expect(colorDistance(normalPieceColors[0], normalPieceColors[2])).toBeGreaterThanOrEqual(95);
    expect(colorDistance(normalPieceColors[1], normalPieceColors[2])).toBeGreaterThanOrEqual(95);
  });

  it('sikisik gridde en az bir kolay yerlesebilir parca verir', () => {
    const grid = createEmptyGrid();
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        grid[y][x] = { filled: true, color: '#111111' };
      }
    }
    grid[9][9] = { filled: false, color: '' };

    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const pieces = getRandomPiecesSync(3, grid, false, undefined, 6, GameMode.ENDLESS);

    expect(pieces.some(piece => blockCount(piece) <= 3 && canPlacePiece(grid, piece))).toBe(true);
  });

  it('ust tierda uc buyuk ayni parcalik tepsiyi yumusatir', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const pieces = getRandomPiecesSync(3, undefined, false, undefined, 6, GameMode.ENDLESS);

    expect(pieces.every(piece => blockCount(piece) >= 4)).toBe(false);
  });

  it('eksik grid verildiginde parca uretimi hata firlatmaz', () => {
    const malformedGrid = createEmptyGrid().slice(0, 9);

    expect(() => {
      getRandomPiecesSync(3, malformedGrid, false, undefined, 6, GameMode.ENDLESS);
    }).not.toThrow();
  });
});
