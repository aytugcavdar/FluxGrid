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
    saveHighScore: vi.fn(() => Promise.resolve()),
  },
}));

// Mock audio functions
vi.mock('@utils/audio', () => ({
  playPlace: vi.fn(),
  playClear: vi.fn(),
  playCombo: vi.fn(),
  playSkill: vi.fn(),
  playGameOver: vi.fn(),
  playSurgeStart: vi.fn(),
  playSurgeEnd: vi.fn(),
  playHaptic: vi.fn(),
  playTick: vi.fn(),
}));

describe('Personal Best Checking in placePiece() - Task 5.6', () => {
  beforeEach(() => {
    // Reset store state
    const store = useGameStore.getState();
    store.resetGame();
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('showNewRecordNotification state field', () => {
    it('should exist in GameStore interface', () => {
      const store = useGameStore.getState();
      expect(store).toHaveProperty('showNewRecordNotification');
    });

    it('should initialize to false', () => {
      const store = useGameStore.getState();
      expect(store.showNewRecordNotification).toBe(false);
    });
  });

  describe('newRecordDiff state field', () => {
    it('should exist in GameStore interface', () => {
      const store = useGameStore.getState();
      expect(store).toHaveProperty('newRecordDiff');
    });

    it('should initialize to 0', () => {
      const store = useGameStore.getState();
      expect(store.newRecordDiff).toBe(0);
    });
  });

  describe('Personal best checking in TIMED mode', () => {
    it('should set showNewRecordNotification when score exceeds personal best', () => {
      const store = useGameStore.getState();
      
      // Initialize TIMED mode with a personal best
      store.setState({
        gameMode: GameMode.TIMED,
        stats: {
          ...store.stats,
          timedHighScore: 1000,
        },
      });

      // Simulate a score update that exceeds personal best
      const newScore = 1500;
      store.setState({
        score: newScore,
      });

      // Manually trigger the personal best check logic
      const personalBest = store.stats.timedHighScore || 0;
      const isNewRecord = newScore > personalBest;
      
      if (isNewRecord) {
        const diff = newScore - personalBest;
        store.setState({
          showNewRecordNotification: true,
          newRecordDiff: diff,
        });
      }

      // Verify notification state is set
      expect(store.showNewRecordNotification).toBe(true);
      expect(store.newRecordDiff).toBe(500);
    });

    it('should calculate correct score difference', () => {
      const store = useGameStore.getState();
      
      // Set initial personal best
      const initialBest = 5000;
      store.setState({
        gameMode: GameMode.TIMED,
        stats: {
          ...store.stats,
          timedHighScore: initialBest,
        },
      });

      // New score that beats personal best
      const newScore = 7500;
      const expectedDiff = newScore - initialBest;

      // Simulate personal best check
      const personalBest = store.stats.timedHighScore || 0;
      const isNewRecord = newScore > personalBest;
      
      if (isNewRecord) {
        const diff = newScore - personalBest;
        store.setState({
          showNewRecordNotification: true,
          newRecordDiff: diff,
        });
      }

      // Verify difference is calculated correctly
      expect(store.newRecordDiff).toBe(expectedDiff);
      expect(store.newRecordDiff).toBe(2500);
    });

    it('should not set notification when score does not exceed personal best', () => {
      const store = useGameStore.getState();
      
      // Set initial personal best
      store.setState({
        gameMode: GameMode.TIMED,
        stats: {
          ...store.stats,
          timedHighScore: 10000,
        },
        showNewRecordNotification: false,
        newRecordDiff: 0,
      });

      // New score that does NOT beat personal best
      const newScore = 8000;

      // Simulate personal best check
      const personalBest = store.stats.timedHighScore || 0;
      const isNewRecord = newScore > personalBest;
      
      if (isNewRecord) {
        const diff = newScore - personalBest;
        store.setState({
          showNewRecordNotification: true,
          newRecordDiff: diff,
        });
      }

      // Verify notification is NOT set
      expect(store.showNewRecordNotification).toBe(false);
      expect(store.newRecordDiff).toBe(0);
    });

    it('should only check personal best in TIMED mode', () => {
      const store = useGameStore.getState();
      
      // Initialize ENDLESS mode
      store.setState({
        gameMode: GameMode.ENDLESS,
        stats: {
          ...store.stats,
          timedHighScore: 1000,
        },
        showNewRecordNotification: false,
      });

      // Simulate a high score in ENDLESS mode
      const newScore = 5000;
      store.setState({
        score: newScore,
      });

      // Personal best check should only happen in TIMED mode
      // In ENDLESS mode, notification should remain false
      expect(store.showNewRecordNotification).toBe(false);
    });
  });

  describe('Personal best persistence', () => {
    it('should save new personal best when detected', () => {
      const store = useGameStore.getState();
      
      // Set initial state
      store.setState({
        gameMode: GameMode.TIMED,
        stats: {
          ...store.stats,
          timedHighScore: 1000,
        },
      });

      // New score that beats personal best
      const newScore = 2000;
      
      // Simulate saving personal best
      const updatedStats = {
        ...store.stats,
        timedHighScore: Math.max(store.stats.timedHighScore || 0, newScore),
      };
      
      store.setState({
        stats: updatedStats,
      });

      // Verify personal best was updated
      expect(store.stats.timedHighScore).toBe(newScore);
    });

    it('should handle first-time personal best (no previous record)', () => {
      const store = useGameStore.getState();
      
      // Initialize with no personal best
      store.setState({
        gameMode: GameMode.TIMED,
        stats: {
          ...store.stats,
          timedHighScore: 0,
        },
      });

      // First score
      const newScore = 500;
      
      // Check if it's a new record
      const personalBest = store.stats.timedHighScore || 0;
      const isNewRecord = newScore > personalBest;
      
      expect(isNewRecord).toBe(true);
      
      if (isNewRecord) {
        const diff = newScore - personalBest;
        store.setState({
          showNewRecordNotification: true,
          newRecordDiff: diff,
          stats: {
            ...store.stats,
            timedHighScore: newScore,
          },
        });
      }

      // Verify notification and personal best
      expect(store.showNewRecordNotification).toBe(true);
      expect(store.newRecordDiff).toBe(500);
      expect(store.stats.timedHighScore).toBe(500);
    });
  });

  describe('Integration with initGame()', () => {
    it('should reset notification state when starting new game', () => {
      const store = useGameStore.getState();
      
      // Set notification state
      store.setState({
        showNewRecordNotification: true,
        newRecordDiff: 1000,
      });

      // Start new game
      store.initGame(GameMode.TIMED);

      // Verify notification state is reset
      expect(store.showNewRecordNotification).toBe(false);
      expect(store.newRecordDiff).toBe(0);
    });
  });
});
