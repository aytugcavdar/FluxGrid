import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameMode, type GameStats } from '@shared/types';

vi.mock('./achievementSystem', () => ({
  updateAchievements: (achievements: unknown[]) => achievements,
  syncNewAchievement: vi.fn(),
}));

vi.mock('@core/services/ads/AdManager', () => ({
  AdManager: { recordGameEnd: vi.fn() },
}));

vi.mock('@shared/store/streakStore', () => ({
  useStreakStore: {
    getState: () => ({
      recordGameCompleted: vi.fn(),
      currentStreak: 0,
      todayPlayed: false,
    }),
  },
}));

vi.mock('@utils/native/widgetHelper', () => ({ syncAllWidgetData: vi.fn() }));
vi.mock('@utils/native/dynamicShortcutHelper', () => ({ saveRecentMode: vi.fn() }));

import { finalizeGameRun } from './runFinalizer';

const createStats = (): GameStats => ({
  blocksPlaced: 12,
  linesCleared: 9,
  totalScore: 800,
  bombsExploded: 0,
  iceBroken: 0,
  gamesPlayed: 2,
  skillUses: {},
  endlessGamesPlayed: 1,
  endlessHighScore: 500,
  endlessMaxCombo: 3,
  endlessTotalLines: 9,
  endlessMaxTier: 1,
  endlessEventCount: 0,
  timedGamesPlayed: 1,
  timedHighScore: 300,
  timedMaxCombo: 2,
  timedTotalLines: 2,
  timedMaxDuration: 60,
  timedSprintBonusTotal: 0,
  perfectClears: 0,
  recordsBroken: 0,
});

describe('finalizeGameRun statistics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records completed games with run-specific lines and real duration once', () => {
    const state: any = {
      isGameOver: true,
      gameOverFinalized: false,
      gameMode: GameMode.ENDLESS,
      stats: createStats(),
      score: 1200,
      timerStartTime: Date.now() - 125_000,
      maxCombo: 4,
      runLinesCleared: 7,
      totalMovesPlayed: 12,
      perfectClearDetected: false,
      achievements: [],
      unlockedAchievementId: null,
      difficultyTier: 2,
      gameLogs: [],
      highScores: {},
    };
    const get = () => state;
    const set = (partial: Record<string, unknown>) => Object.assign(state, partial);
    const saveStats = vi.fn();

    finalizeGameRun(get, set, saveStats);

    expect(state.stats.gamesPlayed).toBe(3);
    expect(state.stats.endlessGamesPlayed).toBe(2);
    expect(state.gameLogs).toHaveLength(1);
    expect(state.gameLogs[0]).toEqual(expect.objectContaining({
      duration: 125,
      linesCleared: 7,
      metadata: expect.objectContaining({ statsVersion: 2 }),
    }));

    finalizeGameRun(get, set, saveStats);
    expect(state.stats.gamesPlayed).toBe(3);
    expect(state.gameLogs).toHaveLength(1);
    expect(saveStats).toHaveBeenCalledTimes(1);
  });
});
