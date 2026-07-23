import { describe, expect, it } from 'vitest';
import { CellType, type GridState, type Piece } from '../../types';
import {
  createClearParticles,
  getBoardMetrics,
  getClearCellProgress,
  getClearEffectConfig,
  getClearPreviewLines,
  getGravityFrame,
  getGravityMoves,
  getGridRenderProfile,
  pieceOriginToPointerLocal,
  pointerToPieceOrigin,
  shouldRenderAnimationFrame,
} from './grid2dHelpers';

const singleCellPiece: Piece = {
  id: 'single',
  instanceId: 'single-1',
  color: '#ffffff',
  shape: [[1]],
};

const createEmptyGrid = (): GridState => (
  Array.from({ length: 10 }, () => (
    Array.from({ length: 10 }, () => ({ filled: false, color: '' }))
  ))
);

describe('grid2dHelpers', () => {
  it('fits ten cells inside the board', () => {
    const metrics = getBoardMetrics(400);
    const occupied = (metrics.padding * 2)
      + (metrics.cellSize * 10)
      + (metrics.gap * 9);

    expect(occupied).toBeCloseTo(400, 5);
  });

  it('maps the first and last cell centers to grid coordinates', () => {
    const metrics = getBoardMetrics(400);
    const firstCenter = metrics.padding + (metrics.cellSize / 2);
    const lastCenter = firstCenter + (metrics.stride * 9);

    expect(pointerToPieceOrigin(firstCenter, firstCenter, 400, singleCellPiece))
      .toEqual({ x: 0, y: 0 });
    expect(pointerToPieceOrigin(lastCenter, lastCenter, 400, singleCellPiece))
      .toEqual({ x: 9, y: 9 });
  });

  it('centers multi-cell pieces under the pointer', () => {
    const piece: Piece = {
      ...singleCellPiece,
      shape: [
        [1, 1, 1],
        [0, 1, 0],
      ],
    };
    const metrics = getBoardMetrics(400);
    const centerX = metrics.padding + (metrics.cellSize / 2) + (metrics.stride * 5);
    const centerY = metrics.padding + (metrics.cellSize / 2) + (metrics.stride * 4);

    expect(pointerToPieceOrigin(centerX, centerY, 400, piece))
      .toEqual({ x: 4, y: 4 });
  });

  it('maps piece origin back to pointer local position for snap feedback', () => {
    const piece: Piece = {
      ...singleCellPiece,
      shape: [
        [1, 1, 1],
        [0, 1, 0],
      ],
    };
    const snapLocal = pieceOriginToPointerLocal(4, 4, 400, piece);

    expect(pointerToPieceOrigin(snapLocal.x, snapLocal.y, 400, piece))
      .toEqual({ x: 4, y: 4 });
  });

  it('maps a gravity move to the block final position', () => {
    const grid = createEmptyGrid();
    grid[9][3] = { filled: true, color: '#ff0000', id: 'falling-block' };

    expect(getGravityMoves(grid, [
      { id: 'falling-block', x: 3, fromY: 5, toY: 7 },
      { id: 'falling-block', x: 3, fromY: 7, toY: 9 },
    ])).toEqual([{
      id: 'falling-block',
      x: 3,
      fromY: 5,
      toY: 9,
      color: '#ff0000',
      cellType: undefined,
    }]);
  });

  it('accelerates the fall and settles on the target', () => {
    expect(getGravityFrame(0.41).positionProgress).toBeGreaterThan(0.25);
    expect(getGravityFrame(0.41).positionProgress).toBeLessThan(0.35);
    expect(getGravityFrame(1)).toEqual({
      positionProgress: 1,
      bounceOffset: 0,
      scaleX: 1,
      scaleY: 1,
    });
  });

  it('caps clear particles for lightweight mobile rendering', () => {
    const cells = Array.from({ length: 20 }, (_, index) => ({
      x: index % 10,
      y: Math.floor(index / 10),
      color: '#ffffff',
    }));

    const particles = createClearParticles(cells, 24);
    expect(particles).toHaveLength(20);
    expect(particles.every(particle => particle.radius > 0)).toBe(true);
  });

  it('finds rows and columns completed by a valid dragged piece', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < 9; x++) grid[5][x] = { filled: true, color: '#ffffff' };
    for (let y = 0; y < 10; y++) {
      if (y !== 5) grid[y][9] = { filled: true, color: '#ffffff' };
    }

    expect(getClearPreviewLines(grid, singleCellPiece, 9, 5))
      .toEqual({ rows: [5], cols: [9] });
  });

  it('does not preview incomplete, occupied, or void lines', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < 9; x++) grid[2][x] = { filled: true, color: '#ffffff' };
    grid[2][4].type = CellType.VOID;

    expect(getClearPreviewLines(grid, singleCellPiece, 9, 2))
      .toEqual({ rows: [], cols: [] });
    expect(getClearPreviewLines(grid, singleCellPiece, 0, 2))
      .toEqual({ rows: [], cols: [] });
  });

  it('uses stronger but still short effects for four-line and combo clears', () => {
    const single = getClearEffectConfig(1, 1);
    const fourLine = getClearEffectConfig(4, 1);
    const highCombo = getClearEffectConfig(1, 8);

    expect(single.duration).toBe(165);
    expect(fourLine.duration).toBeLessThanOrEqual(245);
    expect(fourLine.maxParticles).toBe(24);
    expect(highCombo.duration).toBe(195);
    expect(highCombo.accentColor).toBe('#f472b6');
  });

  it('staggers clear cells from the center toward the edges', () => {
    const centerProgress = getClearCellProgress(0.2, 0, 5, 0.2);
    const edgeProgress = getClearCellProgress(0.2, 5, 5, 0.2);

    expect(centerProgress).toBeGreaterThan(edgeProgress);
    expect(edgeProgress).toBe(0);
  });

  it('caps animation drawing at 60 FPS on high refresh rate screens', () => {
    expect(shouldRenderAnimationFrame(100, 108, 60)).toBe(false);
    expect(shouldRenderAnimationFrame(100, 117, 60)).toBe(true);
  });

  it('uses stable render profiles for every device tier', () => {
    expect(getGridRenderProfile('low', true)).toEqual({
      targetFps: 30,
      pixelRatioCap: 1,
      particleMultiplier: 0,
      effectLevel: 'minimal',
    });
    expect(getGridRenderProfile('low-mid', true)).toEqual({
      targetFps: 45,
      pixelRatioCap: 1.1,
      particleMultiplier: 0.35,
      effectLevel: 'reduced',
    });
    expect(getGridRenderProfile('mid-low', true)).toEqual({
      targetFps: 45,
      pixelRatioCap: 1.1,
      particleMultiplier: 0.35,
      effectLevel: 'reduced',
    });
    expect(getGridRenderProfile('mid', true)).toEqual({
      targetFps: 60,
      pixelRatioCap: 1.2,
      particleMultiplier: 0.65,
      effectLevel: 'reduced',
    });
    expect(getGridRenderProfile('mid-high', true)).toEqual({
      targetFps: 60,
      pixelRatioCap: 1.25,
      particleMultiplier: 0.9,
      effectLevel: 'full',
    });
    expect(getGridRenderProfile('high', true)).toEqual({
      targetFps: 60,
      pixelRatioCap: 1.25,
      particleMultiplier: 1,
      effectLevel: 'full',
    });
    expect(getGridRenderProfile('unknown', true)).toEqual({
      targetFps: 45,
      pixelRatioCap: 1.1,
      particleMultiplier: 0.45,
      effectLevel: 'reduced',
    });
  });

});
