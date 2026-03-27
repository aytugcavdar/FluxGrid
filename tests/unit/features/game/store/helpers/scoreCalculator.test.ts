import { describe, it, expect } from 'vitest';
import { calculateScore, calculateFluxGain } from '@features/game/store/helpers/scoreCalculator';
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

  describe('calculateFluxGain', () => {
    it('should calculate base flux from blocks placed', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(5, 0, 0, miniEventState, 1.0);
      
      expect(result).toBe(10); // 5 * 2
    });

    it('should calculate base flux from lines cleared', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(0, 2, 0, miniEventState, 1.0);
      
      expect(result).toBe(20); // 2 * 10
    });

    it('should combine blocks placed and lines cleared', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
      
      expect(result).toBe(30); // (5 * 2) + (2 * 10)
    });

    it('should apply tier multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(5, 2, 2, miniEventState, 1.0);
      
      expect(result).toBe(36); // 30 * 1.2 (tier 2 flux multiplier)
    });

    it('should apply Flux Surge mini-event multiplier', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.FLUX_SURGE);
      
      const result = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
      
      expect(result).toBe(60); // 30 * 2.0
    });

    it('should not apply Score Rush to flux calculation', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.SCORE_RUSH);
      
      const result = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
      
      expect(result).toBe(30); // No multiplier applied
    });

    it('should not apply Clear Bonus to flux calculation', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.CLEAR_BONUS);
      
      const result = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
      
      expect(result).toBe(30); // No multiplier applied
    });

    it('should apply passive multiplier', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(5, 2, 0, miniEventState, 1.5);
      
      expect(result).toBe(45); // 30 * 1.5
    });

    it('should combine all flux multipliers correctly', () => {
      const miniEventState = createMiniEventState();
      miniEventState.activeEvents.add(MiniEventType.FLUX_SURGE);
      
      const result = calculateFluxGain(5, 2, 3, miniEventState, 1.2);
      
      // (5 * 2 + 2 * 10) * 1.3 (tier 3) * 2.0 (Flux Surge) * 1.2 (passive)
      const expected = Math.floor(30 * 1.3 * 2.0 * 1.2);
      expect(result).toBe(expected);
    });

    it('should floor final flux to integer', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(5, 2, 1, miniEventState, 1.0);
      
      // 30 * 1.1 = 33, should be integer
      expect(result).toBe(33);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle zero blocks and lines', () => {
      const miniEventState = createMiniEventState();
      const result = calculateFluxGain(0, 0, 0, miniEventState, 1.0);
      
      expect(result).toBe(0);
    });

    describe('Game Mode Isolation (Requirement 9.3)', () => {
      it('should apply tier 0 multiplier (1.0) for non-ENDLESS modes', () => {
        const miniEventState = createMiniEventState();
        
        // Simulate non-ENDLESS mode by passing tier 0
        const result = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
        
        // Base flux: (5 * 2) + (2 * 10) = 30
        // Tier 0 multiplier: 1.0
        // Expected: 30 * 1.0 = 30
        expect(result).toBe(30);
      });

      it('should apply tier multiplier only for ENDLESS mode (tier > 0)', () => {
        const miniEventState = createMiniEventState();
        
        // Simulate ENDLESS mode with tier 3
        const resultEndless = calculateFluxGain(5, 2, 3, miniEventState, 1.0);
        
        // Base flux: (5 * 2) + (2 * 10) = 30
        // Tier 3 multiplier: 1.3
        // Expected: 30 * 1.3 = 39
        expect(resultEndless).toBe(39);
        
        // Simulate non-ENDLESS mode (tier 0)
        const resultNonEndless = calculateFluxGain(5, 2, 0, miniEventState, 1.0);
        
        // Base flux: 30
        // Tier 0 multiplier: 1.0
        // Expected: 30 * 1.0 = 30
        expect(resultNonEndless).toBe(30);
        
        // Verify the difference
        expect(resultEndless).toBeGreaterThan(resultNonEndless);
      });

      it('should not apply tier flux multipliers when tier is 0', () => {
        const miniEventState = createMiniEventState();
        
        // Test with various block/line combinations
        const testCases = [
          { blocks: 10, lines: 0, expected: 20 },  // 10 * 2 * 1.0
          { blocks: 0, lines: 5, expected: 50 },   // 5 * 10 * 1.0
          { blocks: 3, lines: 2, expected: 26 },   // (3*2 + 2*10) * 1.0
        ];
        
        testCases.forEach(({ blocks, lines, expected }) => {
          const result = calculateFluxGain(blocks, lines, 0, miniEventState, 1.0);
          expect(result).toBe(expected);
        });
      });
    });
  });
});
