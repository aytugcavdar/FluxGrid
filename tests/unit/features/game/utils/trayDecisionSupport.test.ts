import { describe, expect, it } from 'vitest';
import { createEmptyGrid } from '@features/game/store/helpers/grid';
import { getTrayPieceDecision } from '@features/game/utils/trayDecisionSupport';
import { GRID_SIZE, type GridState, type Piece } from '@features/game/types';

const piece = (shape: number[][]): Piece => ({
  id: 'test-piece',
  instanceId: `test-${shape.length}-${shape[0]?.length || 0}`,
  color: '#22c55e',
  shape,
});

function fillCell(grid: GridState, x: number, y: number): void {
  grid[y][x] = { filled: true, color: '#64748b' };
}

describe('trayDecisionSupport', () => {
  it('marks a placeable piece as playable without clear potential on an empty grid', () => {
    const decision = getTrayPieceDecision(createEmptyGrid(), piece([[1, 1]]));

    expect(decision).toEqual({ canPlace: true, canClear: false });
  });

  it('marks a piece as clear-capable when any valid placement completes a line', () => {
    const grid = createEmptyGrid();
    for (let x = 0; x < GRID_SIZE - 1; x++) {
      fillCell(grid, x, 0);
    }

    const decision = getTrayPieceDecision(grid, piece([[1]]));

    expect(decision).toEqual({ canPlace: true, canClear: true });
  });

  it('marks a piece as unavailable when it cannot fit anywhere', () => {
    const grid = createEmptyGrid();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        fillCell(grid, x, y);
      }
    }

    const decision = getTrayPieceDecision(grid, piece([[1]]));

    expect(decision).toEqual({ canPlace: false, canClear: false });
  });
});
