import { GameMode } from '@shared/types';
import { FIXED_GRID_TIER } from '../../constants';
import { CellType, GRID_SIZE, type GridState } from '../../types';

export const TIER6_GRAVITY_LINE_TARGET = 3;
export const TIER6_GRAVITY_MAX_STORED_CHARGE = TIER6_GRAVITY_LINE_TARGET - 1;

export function clampTier6GravityCharge(charge: number): number {
  if (!Number.isFinite(charge)) return 0;
  return Math.max(0, Math.min(TIER6_GRAVITY_MAX_STORED_CHARGE, Math.floor(charge)));
}

export function countImmediateCompletedLines(grid: GridState): number {
  const fullRows = grid.reduce(
    (total, row) => total + (row.every(cell => cell.filled && cell.type !== CellType.VOID) ? 1 : 0),
    0
  );
  let fullCols = 0;

  for (let x = 0; x < GRID_SIZE; x++) {
    if (grid.every(row => row[x]?.filled && row[x].type !== CellType.VOID)) fullCols++;
  }

  return fullRows + fullCols;
}

export function shouldApplyGravityForTurn(
  gameMode: GameMode,
  difficultyTier: number,
  gravityCharge: number,
  immediateLines: number
): boolean {
  if (gameMode !== GameMode.ENDLESS) return true;
  if (difficultyTier < FIXED_GRID_TIER) return true;
  if (immediateLines <= 0) return false;
  return clampTier6GravityCharge(gravityCharge) + immediateLines >= TIER6_GRAVITY_LINE_TARGET;
}

export function getNextTier6GravityCharge(
  gameMode: GameMode,
  difficultyTier: number,
  gravityCharge: number,
  immediateLines: number
): number {
  if (gameMode !== GameMode.ENDLESS || difficultyTier < FIXED_GRID_TIER) return 0;

  const currentCharge = clampTier6GravityCharge(gravityCharge);
  if (immediateLines <= 0) return currentCharge;

  const totalCharge = currentCharge + immediateLines;
  if (totalCharge >= TIER6_GRAVITY_LINE_TARGET) return 0;
  return Math.min(TIER6_GRAVITY_MAX_STORED_CHARGE, totalCharge);
}
