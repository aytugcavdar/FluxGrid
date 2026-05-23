import { GRID_SIZE, type GridState, type Piece } from '../types';

export interface TrayPieceDecision {
  canPlace: boolean;
  canClear: boolean;
}

function isValidGrid(grid: GridState | undefined): grid is GridState {
  return Array.isArray(grid) &&
    grid.length === GRID_SIZE &&
    grid.every(row => Array.isArray(row) && row.length === GRID_SIZE);
}

function canPlaceAt(grid: GridState, piece: Piece, startX: number, startY: number): boolean {
  if (!piece.shape.length || !piece.shape[0]?.length) return false;

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 1) continue;

      const gridX = startX + x;
      const gridY = startY + y;

      if (
        gridX < 0 ||
        gridX >= GRID_SIZE ||
        gridY < 0 ||
        gridY >= GRID_SIZE ||
        grid[gridY][gridX]?.filled
      ) {
        return false;
      }
    }
  }

  return true;
}

function placementWouldClear(grid: GridState, piece: Piece, startX: number, startY: number): boolean {
  const occupied = new Set<string>();

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] === 1) {
        occupied.add(`${startX + x},${startY + y}`);
      }
    }
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    let rowFull = true;
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x]?.filled && !occupied.has(`${x},${y}`)) {
        rowFull = false;
        break;
      }
    }
    if (rowFull) return true;
  }

  for (let x = 0; x < GRID_SIZE; x++) {
    let colFull = true;
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!grid[y][x]?.filled && !occupied.has(`${x},${y}`)) {
        colFull = false;
        break;
      }
    }
    if (colFull) return true;
  }

  return false;
}

export function getTrayPieceDecision(grid: GridState | undefined, piece: Piece): TrayPieceDecision {
  if (!isValidGrid(grid) || !piece.shape.length || !piece.shape[0]?.length) {
    return { canPlace: false, canClear: false };
  }

  let canPlace = false;

  for (let y = 0; y <= GRID_SIZE - piece.shape.length; y++) {
    for (let x = 0; x <= GRID_SIZE - piece.shape[0].length; x++) {
      if (!canPlaceAt(grid, piece, x, y)) continue;

      canPlace = true;
      if (placementWouldClear(grid, piece, x, y)) {
        return { canPlace: true, canClear: true };
      }
    }
  }

  return { canPlace, canClear: false };
}

export function getTrayDecisionSupport(grid: GridState | undefined, pieces: Piece[]): Record<string, TrayPieceDecision> {
  return Object.fromEntries(
    pieces.map(piece => [piece.instanceId, getTrayPieceDecision(grid, piece)])
  );
}
