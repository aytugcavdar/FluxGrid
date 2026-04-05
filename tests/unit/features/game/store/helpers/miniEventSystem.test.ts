import { describe, it, expect } from 'vitest';
import {
  createMiniEventState,
  checkMiniEvents,
  tickMiniEvents,
  getMiniEventMultiplier,
} from '@features/game/store/helpers/miniEventSystem';
import { MiniEventType } from '@features/game/types';

describe('miniEventSystem', () => {
  describe('createMiniEventState', () => {
    it('should initialize with empty active events', () => {
      const state = createMiniEventState();
      expect(state.activeEvents.size).toBe(0);
    });

    it('should initialize all move counters to 0', () => {
      const state = createMiniEventState();
      expect(state.moveCounters[MiniEventType.FLUX_SURGE]).toBe(0);
      expect(state.moveCounters[MiniEventType.SCORE_RUSH]).toBe(0);
      expect(state.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(0);
    });

    it('should initialize all last activation to 0', () => {
      const state = createMiniEventState();
      expect(state.lastActivation[MiniEventType.FLUX_SURGE]).toBe(0);
      expect(state.lastActivation[MiniEventType.SCORE_RUSH]).toBe(0);
      expect(state.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(0);
    });
  });

  describe('checkMiniEvents', () => {
    it('should activate Flux Surge at move 50', () => {
      const state = createMiniEventState();
      const result = checkMiniEvents(50, state, 0); // tier 0
      
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(result.moveCounters[MiniEventType.FLUX_SURGE]).toBe(10);
      expect(result.lastActivation[MiniEventType.FLUX_SURGE]).toBe(50);
    });

    it('should activate Score Rush at move 100', () => {
      const state = createMiniEventState();
      const result = checkMiniEvents(100, state, 0); // tier 0
      
      expect(result.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(result.moveCounters[MiniEventType.SCORE_RUSH]).toBe(10);
      expect(result.lastActivation[MiniEventType.SCORE_RUSH]).toBe(100);
    });

    it('should activate Clear Bonus at move 150', () => {
      const state = createMiniEventState();
      const result = checkMiniEvents(150, state, 0); // tier 0
      
      expect(result.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(result.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
      expect(result.lastActivation[MiniEventType.CLEAR_BONUS]).toBe(150);
    });

    it('should activate multiple events at move 300', () => {
      const state = createMiniEventState();
      const result = checkMiniEvents(300, state, 0); // tier 0
      
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(result.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
      expect(result.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
    });

    it('should not reactivate Flux Surge before 50 moves elapsed', () => {
      const state = createMiniEventState();
      state.lastActivation[MiniEventType.FLUX_SURGE] = 50;
      
      const result = checkMiniEvents(99, state, 0); // tier 0
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(false);
    });

    it('should reactivate Flux Surge after 50 moves elapsed', () => {
      const state = createMiniEventState();
      state.lastActivation[MiniEventType.FLUX_SURGE] = 50;
      
      const result = checkMiniEvents(100, state, 0); // tier 0
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(result.lastActivation[MiniEventType.FLUX_SURGE]).toBe(100);
    });
  });

  describe('tickMiniEvents', () => {
    it('should decrement Flux Surge counter', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.FLUX_SURGE);
      state.moveCounters[MiniEventType.FLUX_SURGE] = 5;
      
      const result = tickMiniEvents(state, 0, false);
      expect(result.moveCounters[MiniEventType.FLUX_SURGE]).toBe(4);
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
    });

    it('should deactivate Flux Surge when counter reaches 0', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.FLUX_SURGE);
      state.moveCounters[MiniEventType.FLUX_SURGE] = 1;
      
      const result = tickMiniEvents(state, 0, false);
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(false);
    });

    it('should decrement Score Rush counter', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.SCORE_RUSH);
      state.moveCounters[MiniEventType.SCORE_RUSH] = 5;
      
      const result = tickMiniEvents(state, 0, false);
      expect(result.moveCounters[MiniEventType.SCORE_RUSH]).toBe(4);
      expect(result.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
    });

    it('should consume Clear Bonus on line clear', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.CLEAR_BONUS);
      state.moveCounters[MiniEventType.CLEAR_BONUS] = 1;
      
      const result = tickMiniEvents(state, 2, false);
      expect(result.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(false);
      expect(result.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(0);
    });

    it('should not consume Clear Bonus without line clear', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.CLEAR_BONUS);
      state.moveCounters[MiniEventType.CLEAR_BONUS] = 1;
      
      const result = tickMiniEvents(state, 0, false);
      expect(result.activeEvents.has(MiniEventType.CLEAR_BONUS)).toBe(true);
      expect(result.moveCounters[MiniEventType.CLEAR_BONUS]).toBe(1);
    });

    it('should handle multiple active events', () => {
      const state = createMiniEventState();
      state.activeEvents.add(MiniEventType.FLUX_SURGE);
      state.activeEvents.add(MiniEventType.SCORE_RUSH);
      state.moveCounters[MiniEventType.FLUX_SURGE] = 3;
      state.moveCounters[MiniEventType.SCORE_RUSH] = 2;
      
      const result = tickMiniEvents(state, 0, false);
      expect(result.moveCounters[MiniEventType.FLUX_SURGE]).toBe(2);
      expect(result.moveCounters[MiniEventType.SCORE_RUSH]).toBe(1);
      expect(result.activeEvents.has(MiniEventType.FLUX_SURGE)).toBe(true);
      expect(result.activeEvents.has(MiniEventType.SCORE_RUSH)).toBe(true);
    });
  });

  describe('getMiniEventMultiplier', () => {
    it('should return 1.0 for no active events', () => {
      const activeEvents = new Set<MiniEventType>();
      expect(getMiniEventMultiplier(activeEvents, false, 0)).toBe(1.0);
    });

    it('should apply Flux Surge multiplier for flux calculation', () => {
      const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
      expect(getMiniEventMultiplier(activeEvents, true, 0)).toBe(2.0);
    });

    it('should not apply Flux Surge multiplier for score calculation', () => {
      const activeEvents = new Set([MiniEventType.FLUX_SURGE]);
      expect(getMiniEventMultiplier(activeEvents, false, 0)).toBe(1.0);
    });

    it('should apply Score Rush multiplier for score calculation', () => {
      const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
      expect(getMiniEventMultiplier(activeEvents, false, 0)).toBe(1.5);
    });

    it('should not apply Score Rush multiplier for flux calculation', () => {
      const activeEvents = new Set([MiniEventType.SCORE_RUSH]);
      expect(getMiniEventMultiplier(activeEvents, true, 0)).toBe(1.0);
    });

    it('should apply Clear Bonus multiplier for score with line clears', () => {
      const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
      expect(getMiniEventMultiplier(activeEvents, false, 2)).toBe(3.0);
    });

    it('should not apply Clear Bonus multiplier without line clears', () => {
      const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
      expect(getMiniEventMultiplier(activeEvents, false, 0)).toBe(1.0);
    });

    it('should not apply Clear Bonus multiplier for flux calculation', () => {
      const activeEvents = new Set([MiniEventType.CLEAR_BONUS]);
      expect(getMiniEventMultiplier(activeEvents, true, 2)).toBe(1.0);
    });

    it('should combine multiple multipliers correctly', () => {
      const activeEvents = new Set([
        MiniEventType.SCORE_RUSH,
        MiniEventType.CLEAR_BONUS,
      ]);
      expect(getMiniEventMultiplier(activeEvents, false, 2)).toBe(4.5); // 1.5 * 3.0
    });

    it('should handle all events active with appropriate context', () => {
      const activeEvents = new Set([
        MiniEventType.FLUX_SURGE,
        MiniEventType.SCORE_RUSH,
        MiniEventType.CLEAR_BONUS,
      ]);
      
      // For flux calculation, only Flux Surge applies
      expect(getMiniEventMultiplier(activeEvents, true, 2)).toBe(2.0);
      
      // For score calculation with lines cleared, Score Rush and Clear Bonus apply
      expect(getMiniEventMultiplier(activeEvents, false, 2)).toBe(4.5); // 1.5 * 3.0
    });
  });
});
