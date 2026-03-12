import { describe, it, expect } from 'vitest';
import { generateLevel } from '@features/career/utils/levelGenerator';

describe('generateLevel', () => {
  it('level 1 temel SCORE hedefi içerir', () => {
    const level = generateLevel(1);
    expect(level.index).toBe(1);
    const scoreObj = level.objectives.find(o => o.type === 'SCORE');
    expect(scoreObj).toBeDefined();
    expect(scoreObj!.target).toBeGreaterThan(0);
  });

  it('level arttıkça hedef yükselir', () => {
    const getScore = (lvl: number) =>
      generateLevel(lvl).objectives.find(o => o.type === 'SCORE')!.target;
    expect(getScore(10)).toBeGreaterThan(getScore(1));
    expect(getScore(50)).toBeGreaterThan(getScore(10));
  });

  it('level 5+ BREAK_ICE hedefi içerir', () => {
    const level = generateLevel(5);
    expect(level.objectives.some(o => o.type === 'BREAK_ICE')).toBe(true);
  });

  it('level 4\'te BREAK_ICE hedefi yok', () => {
    const level = generateLevel(4);
    expect(level.objectives.some(o => o.type === 'BREAK_ICE')).toBe(false);
  });

  it('movesLimit pozitif sayı', () => {
    const level = generateLevel(1);
    expect(level.movesLimit).toBeGreaterThan(0);
  });

  it('rewardFlux 150\'yi geçmez', () => {
    for (const lvl of [10, 50, 100, 200]) {
      expect(generateLevel(lvl).rewardFlux).toBeLessThanOrEqual(150);
    }
  });

  it('tüm level\'lar geçerli yapıda', () => {
    for (let i = 1; i <= 20; i++) {
      const level = generateLevel(i);
      expect(level.index).toBe(i);
      expect(Array.isArray(level.objectives)).toBe(true);
      expect(level.objectives.length).toBeGreaterThan(0);
    }
  });
});
