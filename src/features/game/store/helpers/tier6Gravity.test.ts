import { describe, expect, it } from 'vitest';
import { GameMode } from '@shared/types';
import {
  countImmediateCompletedLines,
  getNextTier6GravityCharge,
  shouldApplyGravityForTurn,
} from './tier6Gravity';
import type { GridState } from '../../types';

describe('Tier 6 gravity charge', () => {
  it('keeps gravity active before Tier 6', () => {
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 5, 0, 0)).toBe(true);
  });

  it('charges by cleared lines and applies gravity when the total reaches three', () => {
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 6, 0, 1)).toBe(false);
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 0, 1)).toBe(1);
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 6, 1, 1)).toBe(false);
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 1, 1)).toBe(2);
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 6, 2, 1)).toBe(true);
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 2, 1)).toBe(0);
  });

  it('rewards multi-line clears with multiple charge segments', () => {
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 6, 0, 2)).toBe(false);
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 0, 2)).toBe(2);
    expect(shouldApplyGravityForTurn(GameMode.ENDLESS, 6, 0, 3)).toBe(true);
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 0, 3)).toBe(0);
  });

  it('does not consume a ready charge when no line clears', () => {
    expect(getNextTier6GravityCharge(GameMode.ENDLESS, 6, 2, 0)).toBe(2);
  });

  it('does not affect other game modes', () => {
    expect(shouldApplyGravityForTurn(GameMode.TIMED, 6, 0, 0)).toBe(true);
    expect(getNextTier6GravityCharge(GameMode.TIMED, 6, 2, 1)).toBe(0);
  });

  it('counts only rows and columns completed before gravity chains', () => {
    const grid: GridState = Array.from({ length: 10 }, () => (
      Array.from({ length: 10 }, () => ({ filled: false, color: '' }))
    ));
    for (let index = 0; index < 10; index++) {
      grid[4][index] = { filled: true, color: '#ffffff' };
      grid[index][7] = { filled: true, color: '#ffffff' };
    }

    expect(countImmediateCompletedLines(grid)).toBe(2);
  });
});
