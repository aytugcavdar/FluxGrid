import { describe, expect, it } from 'vitest';
import { EXPANDED_ACHIEVEMENTS } from '@features/game/constants';
import { updateAchievements } from '@features/game/store/helpers/achievementSystem';
import { GameMode, type GameStats } from '@shared/types';

const baseStats: GameStats = {
  blocksPlaced: 0,
  linesCleared: 0,
  totalScore: 0,
  bombsExploded: 0,
  iceBroken: 0,
  gamesPlayed: 0,
  skillUses: {},
};

describe('achievement system', () => {
  it('canli basarim listesini 60 kayitta tutar', () => {
    expect(EXPANDED_ACHIEVEMENTS).toHaveLength(60);
    expect(new Set(EXPANDED_ACHIEVEMENTS.map(ach => ach.id)).size).toBe(60);
  });

  it('kaldirilmis sistemlere ait basarimlari listelemez', () => {
    const ids = EXPANDED_ACHIEVEMENTS.map(ach => ach.id);

    expect(ids).not.toContain('zen_master');
    expect(ids).not.toContain('surge_master');
    expect(ids).not.toContain('rotate_master');
    expect(ids).not.toContain('rainbow_5');
    expect(ids).not.toContain('portal_5');
    expect(ids).not.toContain('score_1m');
    expect(ids).not.toContain('combo_25');
    expect(ids).not.toContain('combo_30');
    expect(ids).not.toContain('bomb_250');
    expect(ids).not.toContain('ice_250');
    expect(ids).not.toContain('games_500');
  });

  it('canli oyun metrikleriyle tum ana kategorileri ilerletir', () => {
    const updated = updateAchievements(EXPANDED_ACHIEVEMENTS, {
      newScore: 12000,
      newCombo: 5,
      previousCombo: 4,
      totalBombsExploded: 12,
      totalIceBroken: 30,
      stats: {
        ...baseStats,
        blocksPlaced: 1200,
        linesCleared: 130,
        gamesPlayed: 11,
        timedTotalLines: 25,
        timedSprintBonusTotal: 1200,
        endlessMaxTier: 3,
        endlessEventCount: 5,
        perfectClears: 1,
        recordsBroken: 5,
        largePiecesPlaced: 25,
        lineFivePiecesPlaced: 10,
        hollow3x3PiecesPlaced: 5,
        square3x3PiecesPlaced: 1,
        largePieceClears: 10,
      },
      gameMode: GameMode.TIMED,
      difficultyTier: 3,
      isPerfectClear: true,
      colorBonus: true,
      chainCount: 3,
    });

    const byId = Object.fromEntries(updated.map(ach => [ach.id, ach]));

    expect(byId.score_10k.unlocked).toBe(true);
    expect(byId.combo_5.unlocked).toBe(true);
    expect(byId.combo_streak.currentValue).toBe(1);
    expect(byId.bomb_10.unlocked).toBe(true);
    expect(byId.ice_25.unlocked).toBe(true);
    expect(byId.games_10.unlocked).toBe(true);
    expect(byId.blocks_1000.unlocked).toBe(true);
    expect(byId.lines_100.unlocked).toBe(true);
    expect(byId.timed_lines_25.unlocked).toBe(true);
    expect(byId.sprint_boost_1k.unlocked).toBe(true);
    expect(byId.tier_3.unlocked).toBe(true);
    expect(byId.event_5.unlocked).toBe(true);
    expect(byId.perfect_clear.unlocked).toBe(true);
    expect(byId.color_bonus_10.currentValue).toBe(1);
    expect(byId.record_breaker.unlocked).toBe(true);
    expect(byId.large_piece_1.unlocked).toBe(true);
    expect(byId.large_piece_25.unlocked).toBe(true);
    expect(byId.line5_piece_10.unlocked).toBe(true);
    expect(byId.hollow_3x3_5.unlocked).toBe(true);
    expect(byId.square_3x3_1.unlocked).toBe(true);
    expect(byId.large_piece_clear_10.unlocked).toBe(true);
  });
});
