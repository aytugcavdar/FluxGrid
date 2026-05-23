import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@features/game/store/gameStore';
import { GameMode } from '@shared/types';

describe('Milestone Tracking State - Task 3.2', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      timedMilestones: new Set<string>(),
      lastMilestoneShown: null,
    });
  });

  describe('GameStore interface', () => {
    it('should have timedMilestones field in GameStore state', () => {
      const store = useGameStore.getState();
      expect(store).toHaveProperty('timedMilestones');
      expect(store.timedMilestones).toBeInstanceOf(Set);
    });

    it('should have lastMilestoneShown field in GameStore state', () => {
      const store = useGameStore.getState();
      expect(store).toHaveProperty('lastMilestoneShown');
    });
  });

  describe('initGame() for TIMED mode', () => {
    it('should initialize timedMilestones as empty Set for TIMED mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);

      const state = useGameStore.getState();
      expect(state.timedMilestones).toBeInstanceOf(Set);
      expect(state.timedMilestones.size).toBe(0);
    });

    it('should initialize lastMilestoneShown as null for TIMED mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);

      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });

    it('should reset milestone state on each new game', () => {
      const store = useGameStore.getState();
      
      // First game - add some milestones
      store.initGame(GameMode.TIMED);
      store.setState({
        timedMilestones: new Set(['timed_10k', 'timed_25k']),
        lastMilestoneShown: { id: 'timed_25k', label: 'Çeyrek Yol! 🔥' }
      });

      // Verify milestones were set
      let state = useGameStore.getState();
      expect(state.timedMilestones.size).toBe(2);
      expect(state.lastMilestoneShown).not.toBeNull();

      // Start new game - should reset
      store.initGame(GameMode.TIMED);
      state = useGameStore.getState();
      
      expect(state.timedMilestones.size).toBe(0);
      expect(state.lastMilestoneShown).toBeNull();
    });
  });

  describe('initGame() for non-TIMED modes', () => {
    it('should initialize timedMilestones as empty Set for ENDLESS mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);

      const state = useGameStore.getState();
      expect(state.timedMilestones).toBeInstanceOf(Set);
      expect(state.timedMilestones.size).toBe(0);
    });

    it('should initialize lastMilestoneShown as null for ENDLESS mode', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.ENDLESS);

      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toBeNull();
    });
  });

  describe('Milestone state manipulation', () => {
    it('should allow adding milestones to the Set', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);

      const milestones = new Set(store.timedMilestones);
      milestones.add('timed_10k');
      store.setState({ timedMilestones: milestones });

      const state = useGameStore.getState();
      expect(state.timedMilestones.has('timed_10k')).toBe(true);
      expect(state.timedMilestones.size).toBe(1);
    });

    it('should allow setting lastMilestoneShown', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);

      const milestone = { id: 'timed_10k', label: 'İlk 10K! 🎯' };
      store.setState({ lastMilestoneShown: milestone });

      const state = useGameStore.getState();
      expect(state.lastMilestoneShown).toEqual(milestone);
      expect(state.lastMilestoneShown?.id).toBe('timed_10k');
      expect(state.lastMilestoneShown?.label).toBe('İlk 10K! 🎯');
    });

    it('should prevent duplicate milestones in Set', () => {
      const store = useGameStore.getState();
      store.initGame(GameMode.TIMED);

      const milestones = new Set(store.timedMilestones);
      milestones.add('timed_10k');
      milestones.add('timed_10k'); // Duplicate
      store.setState({ timedMilestones: milestones });

      const state = useGameStore.getState();
      expect(state.timedMilestones.size).toBe(1); // Set prevents duplicates
    });
  });
});
