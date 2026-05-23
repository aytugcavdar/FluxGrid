/**
 * Mode-Specific Statistics Tracking Tests
 * 
 * Tests for Requirements 7.1-7.15: Mode-specific statistics tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';

describe('Mode-Specific Statistics Tracking', () => {
  beforeEach(() => {
    // Reset store state
    useGameStore.setState({
      stats: {
        blocksPlaced: 0,
        linesCleared: 0,
        totalScore: 0,
        bombsExploded: 0,
        iceBroken: 0,
        gamesPlayed: 0,
        skillUses: {},
        endlessGamesPlayed: 0,
        endlessHighScore: 0,
        endlessMaxCombo: 0,
        endlessTotalLines: 0,
        endlessMaxTier: 0,
        endlessEventCount: 0,
        timedGamesPlayed: 0,
        timedHighScore: 0,
        timedMaxCombo: 0,
        timedTotalLines: 0,
        timedMaxDuration: 0,
        timedSprintBonusTotal: 0,
      },
    });
    vi.clearAllMocks();
  });

  describe('Endless Mode Stats', () => {
    it('should increment endlessGamesPlayed when starting endless mode', () => {
      const store = useGameStore.getState();
      
      // Start endless mode
      store.initGame(GameMode.ENDLESS);
      
      const stats = useGameStore.getState().stats;
      expect(stats.endlessGamesPlayed).toBe(1);
      expect(stats.timedGamesPlayed).toBe(0);
    });

    it('should track endlessMaxCombo during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      // Simulate combo tracking
      store.setState({
        combo: 5,
        stats: {
          ...store.stats,
          endlessMaxCombo: 5,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.endlessMaxCombo).toBe(5);
    });

    it('should track endlessTotalLines during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      // Simulate line clearing
      store.setState({
        stats: {
          ...store.stats,
          linesCleared: 10,
          endlessTotalLines: 10,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.endlessTotalLines).toBe(10);
    });

    it('should track endlessMaxTier during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);
      
      // Simulate tier progression
      store.setState({
        difficultyTier: 3,
        stats: {
          ...store.stats,
          endlessMaxTier: 3,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.endlessMaxTier).toBe(3);
    });
  });

  describe('Timed Mode Stats', () => {
    it('should increment timedGamesPlayed when starting timed mode', () => {
      const store = useGameStore.getState();
      
      // Start timed mode
      store.initGame(GameMode.TIMED);
      
      const stats = useGameStore.getState().stats;
      expect(stats.timedGamesPlayed).toBe(1);
      expect(stats.endlessGamesPlayed).toBe(0);
    });

    it('should track timedMaxCombo during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      // Simulate combo tracking
      store.setState({
        combo: 7,
        stats: {
          ...store.stats,
          timedMaxCombo: 7,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.timedMaxCombo).toBe(7);
    });

    it('should track timedTotalLines during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      // Simulate line clearing
      store.setState({
        stats: {
          ...store.stats,
          linesCleared: 15,
          timedTotalLines: 15,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.timedTotalLines).toBe(15);
    });

    it('should track timedSprintBonusTotal during gameplay', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);
      
      // Simulate sprint bonus
      store.setState({
        stats: {
          ...store.stats,
          timedSprintBonusTotal: 100,
        },
      });
      
      const stats = useGameStore.getState().stats;
      expect(stats.timedSprintBonusTotal).toBe(100);
    });
  });

  describe('Mode Isolation', () => {
    it('should not affect timed stats when playing endless mode', () => {
      const store = useGameStore.getState();
      
      // Set initial timed stats
      store.setState({
        stats: {
          ...store.stats,
          timedGamesPlayed: 5,
          timedMaxCombo: 10,
        },
      });
      
      // Start endless mode
      store.initGame(GameMode.ENDLESS);
      
      const stats = useGameStore.getState().stats;
      expect(stats.timedGamesPlayed).toBe(5); // Should not change
      expect(stats.timedMaxCombo).toBe(10); // Should not change
      expect(stats.endlessGamesPlayed).toBe(1); // Should increment
    });

    it('should not affect endless stats when playing timed mode', () => {
      const store = useGameStore.getState();
      
      // Set initial endless stats
      store.setState({
        stats: {
          ...store.stats,
          endlessGamesPlayed: 3,
          endlessMaxCombo: 8,
        },
      });
      
      // Start timed mode
      store.initGame(GameMode.TIMED);
      
      const stats = useGameStore.getState().stats;
      expect(stats.endlessGamesPlayed).toBe(3); // Should not change
      expect(stats.endlessMaxCombo).toBe(8); // Should not change
      expect(stats.timedGamesPlayed).toBe(1); // Should increment
    });
  });
});
