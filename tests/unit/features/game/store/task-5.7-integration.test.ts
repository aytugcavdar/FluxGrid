import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';
import { storageService as LocalStorageService } from '@core/services/storage/StorageService';

// Mock LocalStorageService
vi.mock('@core/services/storage/StorageService', () => ({
  storageService: {
    loadStats: vi.fn(),
    saveStats: vi.fn(() => Promise.resolve()),
    loadHighScores: vi.fn(() => ({})),
  },
}));

describe('Task 5.7: Personal Best Loading in initGame()', () => {
  beforeEach(() => {
    // Reset the store to initial state
    const store = useGameStore.getState();
    store.resetGame();
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });

  it('should load personal best from storage when initializing TIMED mode', () => {
    // Mock loadStats to return a personal best
    const mockPersonalBest = 25000;
    vi.mocked(LocalStorageService.loadStats).mockReturnValue({
      blocksPlaced: 0,
      linesCleared: 0,
      totalScore: 0,
      bombsExploded: 0,
      iceBroken: 0,
      gamesPlayed: 0,
      skillUses: {},
      timedHighScore: mockPersonalBest,
      timedGamesPlayed: 5,
      timedMaxCombo: 10,
      timedTotalLines: 100,
      timedMaxDuration: 45,
      timedSprintBonusTotal: 500,
    });

    useGameStore.getState().initGame(GameMode.TIMED);
    
    // Get state AFTER initGame
    const store = useGameStore.getState();

    // Verify loadStats was called during initialization
    expect(LocalStorageService.loadStats).toHaveBeenCalled();
    
    // Verify game mode is set correctly
    expect(store.gameMode).toBe(GameMode.TIMED);
    
    // Verify personal best is stored in highScore for HUD display
    expect(store.highScore).toBe(mockPersonalBest);
  });

  it('should default to 0 when no personal best exists', () => {
    // Mock loadStats to return null (no saved stats)
    vi.mocked(LocalStorageService.loadStats).mockReturnValue(null);

    useGameStore.getState().initGame(GameMode.TIMED);
    
    // Get state AFTER initGame
    const store = useGameStore.getState();

    // Verify game mode is set correctly
    expect(store.gameMode).toBe(GameMode.TIMED);
    
    // Verify highScore defaults to 0 when no personal best exists
    expect(store.highScore).toBe(0);
  });

  it('should handle storage errors gracefully', () => {
    // Mock loadStats to throw an error
    vi.mocked(LocalStorageService.loadStats).mockImplementation(() => {
      throw new Error('Storage error');
    });

    // Should not throw - errors are handled gracefully
    expect(() => useGameStore.getState().initGame(GameMode.TIMED)).not.toThrow();
    
    // Get state AFTER initGame
    const store = useGameStore.getState();
    
    // Verify game mode is set correctly
    expect(store.gameMode).toBe(GameMode.TIMED);
    
    // Verify highScore defaults to 0 on error
    expect(store.highScore).toBe(0);
  });

  it('should not load personal best for non-TIMED modes', () => {
    // Mock loadStats to return a personal best for TIMED mode
    vi.mocked(LocalStorageService.loadStats).mockReturnValue({
      blocksPlaced: 0,
      linesCleared: 0,
      totalScore: 0,
      bombsExploded: 0,
      iceBroken: 0,
      gamesPlayed: 0,
      skillUses: {},
      timedHighScore: 25000, // TIMED personal best
      endlessHighScore: 50000, // ENDLESS high score
    });

    useGameStore.getState().initGame(GameMode.ENDLESS);
    
    // Get state AFTER initGame
    const store = useGameStore.getState();

    // Verify game mode is set correctly
    expect(store.gameMode).toBe(GameMode.ENDLESS);
    
    // Verify highScore does NOT use the TIMED personal best (25000)
    // For ENDLESS mode, it should use the ENDLESS high score from stats or highScores
    expect(store.highScore).not.toBe(25000);
  });
});
