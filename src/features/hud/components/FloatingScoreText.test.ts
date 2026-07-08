import { describe, expect, it } from 'vitest';
import { distributeScoreAcrossChips, getScoreChipCount } from './FloatingScoreText';

describe('distributeScoreAcrossChips', () => {
  it('keeps the visible chip values equal to the score delta', () => {
    const values = distributeScoreAcrossChips(100, 3);

    expect(values).toEqual([33, 33, 34]);
    expect(values.reduce((total, value) => total + value, 0)).toBe(100);
  });

  it('does not create zero-value chips for small score deltas', () => {
    expect(distributeScoreAcrossChips(2, 5)).toEqual([1, 1]);
    expect(distributeScoreAcrossChips(0, 3)).toEqual([]);
  });
});

describe('getScoreChipCount', () => {
  it('limits visible score chips by clear size', () => {
    expect(getScoreChipCount(1, 10, false, false)).toBe(2);
    expect(getScoreChipCount(2, 10, false, false)).toBe(3);
    expect(getScoreChipCount(4, 10, false, false)).toBe(4);
  });

  it('keeps low-end and reduced devices lighter', () => {
    expect(getScoreChipCount(4, 10, true, false)).toBe(2);
    expect(getScoreChipCount(4, 10, false, true)).toBe(0);
  });
});
