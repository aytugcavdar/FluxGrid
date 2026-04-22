import { describe, it, expect } from 'vitest';
import { calculateScore } from '@features/game/store/helpers/scoreCalculator';
import { createMiniEventState } from '@features/game/store/helpers/miniEventSystem';
import { MiniEventType } from '@features/game/types';

describe('scoreCalculator', () => {
  describe('calculateScore', () => {
    it('should calculate base score without any multipliers', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, false, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(100);
      expect(result.breakdown.total).toBe(1.0);
    });

    it('should apply color bonus multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, true, false, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(150); // 100 * 1.5
      expect(result.breakdown.total).toBe(1.5);
    });

    it('should apply surge multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, true, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(200); // 100 * 2.0
      expect(result.breakdown.total).toBe(2.0);
    });

    it('should apply tier multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, false, 2, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(135); // 100 * 1.35 (tier 2 multiplier)
      expect(result.breakdown.tier).toBe(1.35);
    });

    it('should apply event multiplier for QUAKE', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, false, 0, 'QUAKE', miniEventState, 0, 1.0);
      
      expect(result.score).toBe(130); // 100 * 1.3
      expect(result.breakdown.event).toBe(1.3);
    });

    it('should apply event multiplier for other events', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, false, 0, 'ICE_STORM', miniEventState, 0, 1.0);
      
      expect(result.score).toBe(120); // 100 * 1.2
      expect(result.breakdown.event).toBe(1.2);
    });

    it('should apply mini-event multiplier for Score Rush', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.SCORE_RUSH);
      
      const result = calculateScore(100, false, false, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(150); // 100 * 1.5
      expect(result.breakdown.miniEvents).toHaveLength(1);
      expect(result.breakdown.miniEvents[0].type).toBe(MiniEventType.SCORE_RUSH);
      expect(result.breakdown.miniEvents[0].multiplier).toBe(1.5);
    });

    it('should apply mini-event multiplier for Clear Bonus with lines cleared', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.CLEAR_BONUS);
      
      const result = calculateScore(100, false, false, 0, null, miniEventState, 2, 1.0);
      
      expect(result.score).toBe(300); // 100 * 3.0
      expect(result.breakdown.miniEvents).toHaveLength(1);
      expect(result.breakdown.miniEvents[0].type).toBe(MiniEventType.CLEAR_BONUS);
    });

    it('should not include Clear Bonus in breakdown without lines cleared', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.CLEAR_BONUS);
      
      const result = calculateScore(100, false, false, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(100);
      expect(result.breakdown.miniEvents).toHaveLength(0);
    });

    it('should not include Flux Surge in score breakdown', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.FLUX_SURGE);
      
      const result = calculateScore(100, false, false, 0, null, miniEventState, 0, 1.0);
      
      expect(result.score).toBe(100);
      expect(result.breakdown.miniEvents).toHaveLength(0);
    });

    it('should apply passive score multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, false, false, 0, null, miniEventState, 0, 1.25);
      
      expect(result.score).toBe(125); // 100 * 1.25
    });

    it('should combine all multipliers correctly', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.SCORE_RUSH);
      miniEventState.activeEvents.add(MiniEventType.CLEAR_BONUS);
      
      const result = calculateScore(100, true, true, 2, 'QUAKE', miniEventState, 2, 1.2);
      
      // 100 * 1.5 (color) * 2.0 (surge) * 1.35 (tier 2) * 1.3 (QUAKE) * 1.5 (Score Rush) * 3.0 (Clear Bonus) * 1.2 (passive)
      const expected = Math.floor(100 * 1.5 * 2.0 * 1.35 * 1.3 * 1.5 * 3.0 * 1.2);
      expect(result.score).toBe(expected);
    });

    it('should floor final score to integer', () => {
      const miniEventState = createMiniEventState();
      const result = calculateScore(100, true, false, 1, null, miniEventState, 0, 1.0);
      
      // 100 * 1.5 * 1.15 = 172.5, should floor to 172
      expect(result.score).toBe(172);
      expect(Number.isInteger(result.score)).toBe(true);
    });

    it('should include multiple mini-events in breakdown', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.SCORE_RUSH);
      miniEventState.activeEvents.add(MiniEventType.CLEAR_BONUS);
      
      const result = calculateScore(100, false, false, 0, null, miniEventState, 2, 1.0);
      
      expect(result.breakdown.miniEvents).toHaveLength(2);
      expect(result.breakdown.miniEvents.some(e => e.type === MiniEventType.SCORE_RUSH)).toBe(true);
      expect(result.breakdown.miniEvents.some(e => e.type === MiniEventType.CLEAR_BONUS)).toBe(true);
    });
  });
});
