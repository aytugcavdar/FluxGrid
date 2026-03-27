import { MiniEventState, MultiplierBreakdown, MiniEventType } from '../../types';
import { POINTS, MINI_EVENT_MULTIPLIERS } from '../../constants';
import { getTierScoreMultiplier, getTierFluxMultiplier } from './tierSystem';
import { getEventScoreMultiplier } from './eventSystem';
import { getMiniEventMultiplier } from './miniEventSystem';

/**
 * Calculate final score with all multipliers
 * 
 * Computes the final score for a piece placement by applying all active
 * multipliers in the correct order: base × color × surge × tier × event × mini-event × passive.
 * Also generates a breakdown of active multipliers for UI display.
 * 
 * @param basePoints - Base points from blocks placed and lines cleared
 * @param colorBonus - Whether color bonus is active (all blocks same color)
 * @param surgeActive - Whether surge mode is active (combo chain)
 * @param tier - Current tier level (0-6)
 * @param activeEvent - Currently active event (null if none)
 * @param miniEventState - Current mini-event state
 * @param linesCleared - Number of lines cleared in this move
 * @param passiveScoreMultiplier - Multiplier from passive abilities
 * @returns Object containing:
 *   - score: Final score (integer, rounded down)
 *   - breakdown: MultiplierBreakdown object for UI display
 * 
 * @example
 * // Basic calculation with no bonuses
 * calculateScore(100, false, false, 0, null, miniEventState, 0, 1.0)
 * // Returns { score: 100, breakdown: { tier: 1.0, event: 1.0, miniEvents: [], total: 1.0 } }
 * 
 * // Tier 3 with QUAKE event
 * calculateScore(100, false, false, 3, 'QUAKE', miniEventState, 1, 1.0)
 * // Returns { score: 208, breakdown: { tier: 1.6, event: 1.3, miniEvents: [], total: 2.08 } }
 * // Calculation: 100 × 1.6 (tier) × 1.3 (QUAKE) = 208
 * 
 * // Tier 2 with Score Rush mini-event
 * const state = { activeEvents: new Set([MiniEventType.SCORE_RUSH]), ... };
 * calculateScore(100, false, false, 2, null, state, 1, 1.0)
 * // Returns { score: 202, breakdown: { tier: 1.35, event: 1.0, miniEvents: [{type: SCORE_RUSH, multiplier: 1.5}], total: 2.025 } }
 * // Calculation: 100 × 1.35 (tier) × 1.5 (Score Rush) = 202 (rounded down)
 * 
 * // Multiple multipliers stacking
 * const state2 = { activeEvents: new Set([MiniEventType.SCORE_RUSH, MiniEventType.CLEAR_BONUS]), ... };
 * calculateScore(100, true, true, 4, 'QUAKE', state2, 2, 1.2)
 * // Calculation: 100 × 1.5 (color) × 1.5 (surge) × 2.0 (tier 4) × 1.3 (QUAKE) × 1.5 (Score Rush) × 3.0 (Clear Bonus) × 1.2 (passive)
 * // Returns very high score with full breakdown
 * 
 * @remarks
 * **Multiplier Application Order:**
 * 1. Color bonus (1.5x if all blocks same color)
 * 2. Surge multiplier (1.5x during combo chain)
 * 3. Tier multiplier (1.0x - 3.0x based on tier)
 * 4. Event multiplier (1.2x or 1.3x for QUAKE)
 * 5. Mini-event multipliers (1.5x - 3.0x, can stack)
 * 6. Passive ability multiplier (from purchased abilities)
 * 
 * **Multiplier Stacking:**
 * - All multipliers are multiplicative (not additive)
 * - Example: 1.5x tier × 1.2x event = 1.8x total
 * - Multiple mini-events multiply together
 * 
 * **Breakdown Object:**
 * - Contains tier, event, and mini-event multipliers
 * - Used by UI to display active bonuses
 * - Only includes mini-events that actually affect score
 * - Flux Surge is excluded (doesn't affect score)
 * - Clear Bonus excluded if no lines cleared
 * 
 * **Rounding:**
 * - Final score is rounded down (Math.floor)
 * - Ensures integer score values
 * - Prevents floating-point display issues
 * 
 * **Edge Cases:**
 * - basePoints = 0: Returns 0 regardless of multipliers
 * - No active multipliers: Returns basePoints unchanged
 * - Clear Bonus with 0 lines cleared: Bonus not applied
 * - Invalid tier: Defaults to 1.0x multiplier
 * 
 * **Validates: Requirements 5.6, 5.9, 5.10, 6.1, 6.2, 6.3, 6.4, 18.1, 18.2, 18.6**
 */
export function calculateScore(
  basePoints: number,
  colorBonus: boolean,
  surgeActive: boolean,
  tier: number,
  activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null,
  miniEventState: MiniEventState,
  linesCleared: number,
  passiveScoreMultiplier: number
): { score: number; breakdown: MultiplierBreakdown } {
  const colorMultiplier = colorBonus ? POINTS.COLOR_BONUS_MULTIPLIER : 1.0;
  const surgeMultiplier = surgeActive ? POINTS.SURGE_MULTIPLIER : 1.0;
  const tierMultiplier = getTierScoreMultiplier(tier);
  const eventMultiplier = getEventScoreMultiplier(activeEvent);
  const miniEventMultiplier = getMiniEventMultiplier(miniEventState.activeEvents, false, linesCleared);
  
  const totalMultiplier = colorMultiplier * surgeMultiplier * tierMultiplier * eventMultiplier * miniEventMultiplier * passiveScoreMultiplier;
  const finalScore = Math.floor(basePoints * totalMultiplier);
  
  const breakdown: MultiplierBreakdown = {
    tier: tierMultiplier,
    event: eventMultiplier,
    miniEvents: Array.from(miniEventState.activeEvents)
      .filter(type => {
        // Only include mini-events that actually affect score
        if (type === MiniEventType.FLUX_SURGE) return false;
        if (type === MiniEventType.CLEAR_BONUS && linesCleared === 0) return false;
        return true;
      })
      .map(type => ({
        type,
        multiplier: MINI_EVENT_MULTIPLIERS[type],
      })),
    total: totalMultiplier,
  };
  
  return { score: finalScore, breakdown };
}

/**
 * Calculate flux gain with tier multiplier
 * 
 * Computes the flux gained from a piece placement by applying tier and
 * mini-event multipliers to the base flux calculation. Flux is the resource
 * used to activate abilities in the game.
 * 
 * @param blocksPlaced - Number of blocks placed in this move (typically 3-5)
 * @param linesCleared - Number of lines cleared in this move (0 if none)
 * @param tier - Current tier level (0-6)
 * @param miniEventState - Current mini-event state
 * @param passiveMultiplier - Multiplier from passive abilities
 * @returns Flux gained (integer, rounded down, capped at 100)
 * 
 * @example
 * // Basic calculation: 4 blocks, no lines, tier 0
 * calculateFluxGain(4, 0, 0, miniEventState, 1.0)
 * // Returns 8 (4 × 2 = 8)
 * 
 * // With line clear: 4 blocks, 1 line, tier 0
 * calculateFluxGain(4, 1, 0, miniEventState, 1.0)
 * // Returns 18 (4 × 2 + 1 × 10 = 18)
 * 
 * // Tier 3 with line clear
 * calculateFluxGain(4, 1, 3, miniEventState, 1.0)
 * // Returns 23 (18 × 1.3 = 23.4 → 23)
 * 
 * // Tier 6 with Flux Surge mini-event
 * const state = { activeEvents: new Set([MiniEventType.FLUX_SURGE]), ... };
 * calculateFluxGain(4, 2, 6, state, 1.0)
 * // Base: 4 × 2 + 2 × 10 = 28
 * // With multipliers: 28 × 2.0 (tier 6) × 2.0 (Flux Surge) = 112
 * // Returns 100 (capped at maximum)
 * 
 * // With passive ability multiplier
 * calculateFluxGain(4, 1, 2, miniEventState, 1.5)
 * // Base: 18, Tier: 1.2x, Passive: 1.5x
 * // Returns 32 (18 × 1.2 × 1.5 = 32.4 → 32)
 * 
 * @remarks
 * **Base Flux Calculation:**
 * - Blocks: 2 flux per block placed
 * - Lines: 10 flux per line cleared
 * - Formula: (blocksPlaced × 2) + (linesCleared × 10)
 * 
 * **Multiplier Application:**
 * 1. Tier multiplier (1.0x - 2.0x based on tier)
 * 2. Mini-event multiplier (2.0x if Flux Surge active)
 * 3. Passive ability multiplier (from purchased abilities)
 * 
 * **Flux Cap:**
 * - Maximum flux is 100 (enforced in gameStore)
 * - This function can return values > 100
 * - Cap is applied by the caller (gameStore.placePiece)
 * 
 * **Rounding:**
 * - Result is rounded down (Math.floor)
 * - Ensures integer flux values
 * - Applied after all multipliers
 * 
 * **Mini-Event Interaction:**
 * - Only Flux Surge affects flux calculation (2.0x)
 * - Score Rush and Clear Bonus do not affect flux
 * - Flux Surge stacks with tier multiplier
 * 
 * **Edge Cases:**
 * - 0 blocks and 0 lines: Returns 0
 * - Invalid tier: Defaults to 1.0x multiplier
 * - Negative values: Not possible (inputs are non-negative)
 * - Very high multipliers: Result capped at 100 by caller
 * 
 * **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 5.5**
 */
export function calculateFluxGain(
  blocksPlaced: number,
  linesCleared: number,
  tier: number,
  miniEventState: MiniEventState,
  passiveMultiplier: number
): number {
  const baseFlux = (blocksPlaced * 2) + (linesCleared * 10);
  const tierMultiplier = getTierFluxMultiplier(tier);
  const miniEventMultiplier = getMiniEventMultiplier(miniEventState.activeEvents, true, linesCleared);
  
  return Math.floor(baseFlux * tierMultiplier * miniEventMultiplier * passiveMultiplier);
}
