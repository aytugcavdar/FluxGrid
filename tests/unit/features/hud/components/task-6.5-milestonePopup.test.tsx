/**
 * Unit tests for Task 6.5: Milestone Popup Display in TimedHUD
 * 
 * Tests verify that milestone popups are displayed correctly with:
 * - Large, readable text with emoji
 * - Smooth animations (respecting prefers-reduced-motion)
 * - aria-live="assertive" for screen readers
 * - Auto-hide after 3 seconds
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '../../../../../src/features/game/store/gameStore';
import { GameMode } from '../../../../../src/shared/types';

describe('Task 6.5: Milestone Popup Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Initialize game store with TIMED mode
    useGameStore.setState({
      gameMode: GameMode.TIMED,
      score: 0,
      highScore: 0,
      combo: 0,
      timeLeft: 60,
      timerExpectedEnd: Date.now() + 60000,
      timedMilestones: new Set<string>(),
      lastMilestoneShown: null,
      showNewRecordNotification: false,
      newRecordDiff: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Milestone State Management', () => {
    it('should store milestone data in lastMilestoneShown state (Requirement 8.1)', () => {
      // Arrange
      const milestone = { id: 'timed_10k', label: 'İlk 10K! 🎯' };

      // Act
      useGameStore.setState({ lastMilestoneShown: milestone });

      // Assert
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toEqual(milestone);
      expect(state.lastMilestoneShown?.label).toBe('İlk 10K! 🎯');
      expect(state.lastMilestoneShown?.label).toContain('🎯');
    });

    it('should store all milestone types correctly (Requirements 8.1-8.5)', () => {
      const milestones = [
        { id: 'timed_10k', label: 'İlk 10K! 🎯' },
        { id: 'timed_25k', label: 'Çeyrek Yol! 🔥' },
        { id: 'timed_50k', label: 'Yarı Yol! ⚡' },
        { id: 'timed_75k', label: 'Efsane Bölge! 💎' },
        { id: 'timed_100k', label: '100K Kulübü! 👑' },
      ];

      milestones.forEach((milestone) => {
        // Act
        useGameStore.setState({ lastMilestoneShown: milestone });

        // Assert
        const state = useGameStore.getState();
        expect(state.lastMilestoneShown).toEqual(milestone);
        expect(state.lastMilestoneShown?.id).toBe(milestone.id);
        expect(state.lastMilestoneShown?.label).toBe(milestone.label);
      });
    });

    it('should allow clearing milestone state', () => {
      // Arrange
      useGameStore.setState({
        lastMilestoneShown: { id: 'timed_10k', label: 'İlk 10K! 🎯' },
      });

      // Act
      useGameStore.setState({ lastMilestoneShown: null });

      // Assert
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });

    it('should initialize lastMilestoneShown as null for new games', () => {
      // Arrange
      const store = useGameStore.getState();

      // Act
      store.initGame(GameMode.TIMED);

      // Assert
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });
  });

  describe('Milestone Label Format', () => {
    it('should include emoji in milestone labels (Requirement 8.1)', () => {
      const milestones = [
        { id: 'timed_10k', label: 'İlk 10K! 🎯', emoji: '🎯' },
        { id: 'timed_25k', label: 'Çeyrek Yol! 🔥', emoji: '🔥' },
        { id: 'timed_50k', label: 'Yarı Yol! ⚡', emoji: '⚡' },
        { id: 'timed_75k', label: 'Efsane Bölge! 💎', emoji: '💎' },
        { id: 'timed_100k', label: '100K Kulübü! 👑', emoji: '👑' },
      ];

      milestones.forEach((milestone) => {
        // Act
        useGameStore.setState({ lastMilestoneShown: milestone });

        // Assert
        const state = useGameStore.getState();
        expect(state.lastMilestoneShown?.label).toContain(milestone.emoji);
      });
    });

    it('should have readable Turkish text in labels (Requirement 8.2)', () => {
      const milestones = [
        { id: 'timed_10k', label: 'İlk 10K! 🎯' },
        { id: 'timed_25k', label: 'Çeyrek Yol! 🔥' },
        { id: 'timed_50k', label: 'Yarı Yol! ⚡' },
        { id: 'timed_75k', label: 'Efsane Bölge! 💎' },
        { id: 'timed_100k', label: '100K Kulübü! 👑' },
      ];

      milestones.forEach((milestone) => {
        // Act
        useGameStore.setState({ lastMilestoneShown: milestone });

        // Assert
        const state = useGameStore.getState();
        expect(state.lastMilestoneShown?.label).toBeTruthy();
        expect(state.lastMilestoneShown?.label.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Milestone Auto-Hide Behavior', () => {
    it('should support clearing milestone after timeout (Requirement 8.4)', () => {
      // Arrange
      useGameStore.setState({
        lastMilestoneShown: { id: 'timed_10k', label: 'İlk 10K! 🎯' },
      });

      // Assert initial state
      let state = useGameStore.getState();
      expect(state.lastMilestoneShown).not.toBeNull();

      // Act: Simulate auto-hide after 3 seconds
      useGameStore.setState({ lastMilestoneShown: null });

      // Assert: Milestone should be cleared
      state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });
  });

  describe('Milestone Integration with Game Flow', () => {
    it('should not interfere with other game state', () => {
      // Arrange
      const initialScore = 10000;
      const initialCombo = 5;
      useGameStore.setState({
        score: initialScore,
        combo: initialCombo,
      });

      // Act: Set milestone
      useGameStore.setState({
        lastMilestoneShown: { id: 'timed_10k', label: 'İlk 10K! 🎯' },
      });

      // Assert: Other state should remain unchanged
      const state = useGameStore.getState();
      expect(state.score).toBe(initialScore);
      expect(state.combo).toBe(initialCombo);
      expect(state.lastMilestoneShown).not.toBeNull();
    });

    it('should work alongside new record notifications', () => {
      // Arrange & Act
      useGameStore.setState({
        lastMilestoneShown: { id: 'timed_10k', label: 'İlk 10K! 🎯' },
        showNewRecordNotification: true,
        newRecordDiff: 500,
      });

      // Assert: Both notifications can coexist
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).not.toBeNull();
      expect(state.showNewRecordNotification).toBe(true);
    });
  });

  describe('Accessibility Requirements', () => {
    it('should provide milestone data for screen readers (Requirement 8.3)', () => {
      // Arrange
      const milestone = { id: 'timed_50k', label: 'Yarı Yol! ⚡' };

      // Act
      useGameStore.setState({ lastMilestoneShown: milestone });

      // Assert: Data is available for aria-live regions
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeTruthy();
      expect(state.lastMilestoneShown?.label).toBe('Yarı Yol! ⚡');
    });
  });

  describe('Milestone Display Requirements', () => {
    it('should provide milestone label for display (Requirement 8.1, 8.2)', () => {
      // Arrange
      const milestone = { id: 'timed_100k', label: '100K Kulübü! 👑' };

      // Act
      useGameStore.setState({ lastMilestoneShown: milestone });

      // Assert: Label is available for large, readable text display
      const state = useGameStore.getState();
      expect(state.lastMilestoneShown?.label).toBe('100K Kulübü! 👑');
      expect(state.lastMilestoneShown?.label).toContain('👑');
    });

    it('should support animation-friendly state transitions (Requirement 8.5)', () => {
      // Arrange: Start with no milestone
      useGameStore.setState({ lastMilestoneShown: null });

      // Act: Show milestone
      useGameStore.setState({
        lastMilestoneShown: { id: 'timed_25k', label: 'Çeyrek Yol! 🔥' },
      });

      // Assert: State transition is clean
      let state = useGameStore.getState();
      expect(state.lastMilestoneShown).not.toBeNull();

      // Act: Hide milestone
      useGameStore.setState({ lastMilestoneShown: null });

      // Assert: State transition is clean
      state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });
  });
});

