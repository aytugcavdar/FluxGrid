import { MiniEventType, MiniEventState } from '../../types';
import { MINI_EVENT_INTERVALS, MINI_EVENT_MULTIPLIERS } from '../../constants';

/**
 * Initialize mini-event state
 * 
 * Creates a fresh mini-event state object with all counters and trackers
 * set to their initial values. Used when starting a new game or when
 * save data doesn't contain mini-event state.
 * 
 * @returns A new MiniEventState object with:
 *   - activeEvents: Empty Set (no mini-events active)
 *   - moveCounters: All counters set to 0
 *   - lastActivation: All activation timestamps set to 0
 * 
 * @example
 * const state = createMiniEventState();
 * // state.activeEvents.size === 0
 * // state.moveCounters[MiniEventType.FLUX_SURGE] === 0
 * 
 * @remarks
 * - Called during game initialization
 * - Called during save data migration if miniEventState is missing
 * - All mini-events start inactive
 * - Move counters track remaining duration for active events
 * - lastActivation tracks when each event was last triggered (for interval calculation)
 * 
 * **Mini-Event Types:**
 * - FLUX_SURGE: Activates every 50 moves, lasts 10 moves, 2.0x flux multiplier
 * - SCORE_RUSH: Activates every 100 moves, lasts 10 moves, 1.5x score multiplier
 * - CLEAR_BONUS: Activates every 150 moves, single-use, 3.0x score multiplier on next line clear
 * 
 * **Validates: Requirements 5.1, 13.1**
 */
export function createMiniEventState(): MiniEventState {
  return {
    activeEvents: new Set(),
    moveCounters: {
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 0,
    },
    lastActivation: {
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 0,
    },
  };
}

/**
 * Check and activate mini-events based on move count
 * 
 * Evaluates whether any mini-events should activate based on the total
 * number of moves played and the time since each event's last activation.
 * Mini-events activate at fixed intervals to provide mid-tier variety.
 * 
 * @param totalMoves - Total moves played since game start (incremented after each piece placement)
 * @param currentState - Current mini-event state
 * @returns Updated MiniEventState with newly activated events
 * 
 * @example
 * // At 50 moves, Flux Surge activates
 * const state = checkMiniEvents(50, currentState);
 * // state.activeEvents.has(MiniEventType.FLUX_SURGE) === true
 * // state.moveCounters[MiniEventType.FLUX_SURGE] === 10
 * 
 * // At 100 moves, Score Rush activates
 * const state2 = checkMiniEvents(100, currentState);
 * // state2.activeEvents.has(MiniEventType.SCORE_RUSH) === true
 * 
 * // At 150 moves, Clear Bonus activates
 * const state3 = checkMiniEvents(150, currentState);
 * // state3.activeEvents.has(MiniEventType.CLEAR_BONUS) === true
 * // state3.moveCounters[MiniEventType.CLEAR_BONUS] === 1 (single-use)
 * 
 * @remarks
 * **Activation Intervals:**
 * - Flux Surge: Every 50 moves (50, 100, 150, 200, ...)
 * - Score Rush: Every 100 moves (100, 200, 300, ...)
 * - Clear Bonus: Every 150 moves (150, 300, 450, ...)
 * 
 * **Activation Logic:**
 * - Checks if (totalMoves - lastActivation) >= interval
 * - Multiple events can activate simultaneously (e.g., at move 300)
 * - Events can stack: Flux Surge + Score Rush both active = 2.0x flux, 1.5x score
 * 
 * **Duration:**
 * - Flux Surge: 10 moves
 * - Score Rush: 10 moves
 * - Clear Bonus: Single-use (consumed on next line clear)
 * 
 * **State Immutability:**
 * - Returns a new MiniEventState object
 * - Does not mutate currentState parameter
 * - Safe for use in React state updates
 * 
 * **Validates: Requirements 5.2, 5.3, 5.4, 5.9**
 */
export function checkMiniEvents(
  totalMoves: number,
  currentState: MiniEventState
): MiniEventState {
  const newState = {
    activeEvents: new Set(currentState.activeEvents),
    moveCounters: { ...currentState.moveCounters },
    lastActivation: { ...currentState.lastActivation },
  };
  
  // Check Flux Surge (every 50 moves)
  if (totalMoves - currentState.lastActivation[MiniEventType.FLUX_SURGE] >= MINI_EVENT_INTERVALS.FLUX_SURGE) {
    newState.activeEvents.add(MiniEventType.FLUX_SURGE);
    newState.moveCounters[MiniEventType.FLUX_SURGE] = 10;
    newState.lastActivation[MiniEventType.FLUX_SURGE] = totalMoves;
  }
  
  // Check Score Rush (every 100 moves)
  if (totalMoves - currentState.lastActivation[MiniEventType.SCORE_RUSH] >= MINI_EVENT_INTERVALS.SCORE_RUSH) {
    newState.activeEvents.add(MiniEventType.SCORE_RUSH);
    newState.moveCounters[MiniEventType.SCORE_RUSH] = 10;
    newState.lastActivation[MiniEventType.SCORE_RUSH] = totalMoves;
  }
  
  // Check Clear Bonus (every 150 moves)
  if (totalMoves - currentState.lastActivation[MiniEventType.CLEAR_BONUS] >= MINI_EVENT_INTERVALS.CLEAR_BONUS) {
    newState.activeEvents.add(MiniEventType.CLEAR_BONUS);
    newState.moveCounters[MiniEventType.CLEAR_BONUS] = 1; // Single use
    newState.lastActivation[MiniEventType.CLEAR_BONUS] = totalMoves;
  }
  
  return newState;
}

/**
 * Tick mini-event durations after piece placement
 * 
 * Decrements the duration counters for all active mini-events and
 * deactivates events that have expired. Clear Bonus is handled specially:
 * it's consumed immediately when a line is cleared.
 * 
 * @param currentState - Current mini-event state
 * @param linesCleared - Number of lines cleared in this move (0 if none)
 * @returns Updated MiniEventState with decremented counters and expired events removed
 * 
 * @example
 * // Flux Surge with 3 moves remaining
 * const state = tickMiniEvents(currentState, 0);
 * // state.moveCounters[MiniEventType.FLUX_SURGE] === 2
 * 
 * // Clear Bonus consumed when line is cleared
 * const state2 = tickMiniEvents(currentState, 1);
 * // state2.activeEvents.has(MiniEventType.CLEAR_BONUS) === false
 * 
 * // Event expires when counter reaches 0
 * const state3 = tickMiniEvents(currentState, 0);
 * // If counter was 1, event is now removed from activeEvents
 * 
 * @remarks
 * **Duration-Based Events (Flux Surge, Score Rush):**
 * - Counter decrements by 1 each move
 * - Event deactivates when counter reaches 0
 * - Duration is independent of line clears
 * 
 * **Consumption-Based Events (Clear Bonus):**
 * - Counter is 1 when activated
 * - Consumed immediately when linesCleared > 0
 * - Deactivates after consumption
 * - If no lines cleared, remains active for next move
 * 
 * **State Immutability:**
 * - Returns a new MiniEventState object
 * - Does not mutate currentState parameter
 * - Safe for use in React state updates
 * 
 * **Call Order:**
 * 1. checkMiniEvents() - Check for new activations
 * 2. Apply mini-event effects (multipliers)
 * 3. tickMiniEvents() - Decrement counters
 * 
 * **Validates: Requirements 5.7, 5.8**
 */
export function tickMiniEvents(
  currentState: MiniEventState,
  linesCleared: number
): MiniEventState {
  const newState = {
    activeEvents: new Set(currentState.activeEvents),
    moveCounters: { ...currentState.moveCounters },
    lastActivation: { ...currentState.lastActivation },
  };
  
  // Decrement counters for active events
  for (const eventType of newState.activeEvents) {
    if (eventType === MiniEventType.CLEAR_BONUS) {
      // Clear Bonus is consumed on line clear
      if (linesCleared > 0) {
        newState.moveCounters[eventType] = 0;
        newState.activeEvents.delete(eventType);
      }
    } else {
      // Duration-based events
      newState.moveCounters[eventType]--;
      if (newState.moveCounters[eventType] <= 0) {
        newState.activeEvents.delete(eventType);
      }
    }
  }
  
  return newState;
}

/**
 * Calculate combined mini-event multiplier
 * 
 * Computes the total multiplier from all active mini-events for either
 * flux or score calculations. Mini-events have different effects:
 * - Flux Surge: 2.0x flux (only affects flux)
 * - Score Rush: 1.5x score (only affects score)
 * - Clear Bonus: 3.0x score (only affects score, only when lines cleared)
 * 
 * @param activeEvents - Set of currently active mini-event types
 * @param isFluxCalculation - True for flux calculation, false for score calculation
 * @param linesCleared - Number of lines cleared in this move (0 if none)
 * @returns Combined multiplier (1.0 if no applicable events active)
 * 
 * @example
 * // Flux Surge active, calculating flux
 * getMiniEventMultiplier(new Set([MiniEventType.FLUX_SURGE]), true, 0)
 * // Returns 2.0
 * 
 * // Score Rush active, calculating score
 * getMiniEventMultiplier(new Set([MiniEventType.SCORE_RUSH]), false, 1)
 * // Returns 1.5
 * 
 * // Clear Bonus active, calculating score with line clear
 * getMiniEventMultiplier(new Set([MiniEventType.CLEAR_BONUS]), false, 2)
 * // Returns 3.0
 * 
 * // Clear Bonus active, but no lines cleared
 * getMiniEventMultiplier(new Set([MiniEventType.CLEAR_BONUS]), false, 0)
 * // Returns 1.0 (Clear Bonus not applied)
 * 
 * // Multiple events active (Flux Surge + Score Rush), calculating score
 * getMiniEventMultiplier(new Set([MiniEventType.FLUX_SURGE, MiniEventType.SCORE_RUSH]), false, 1)
 * // Returns 1.5 (only Score Rush affects score)
 * 
 * // Multiple events active, calculating flux
 * getMiniEventMultiplier(new Set([MiniEventType.FLUX_SURGE, MiniEventType.SCORE_RUSH]), true, 0)
 * // Returns 2.0 (only Flux Surge affects flux)
 * 
 * // All events active, calculating score with line clear
 * getMiniEventMultiplier(new Set([MiniEventType.FLUX_SURGE, MiniEventType.SCORE_RUSH, MiniEventType.CLEAR_BONUS]), false, 1)
 * // Returns 4.5 (1.5 × 3.0)
 * 
 * @remarks
 * **Multiplier Stacking:**
 * - Multiple applicable events multiply together (not add)
 * - Example: Score Rush (1.5x) + Clear Bonus (3.0x) = 4.5x total
 * - Non-applicable events are ignored (e.g., Flux Surge during score calculation)
 * 
 * **Event Applicability:**
 * - Flux Surge: Only applies when isFluxCalculation = true
 * - Score Rush: Only applies when isFluxCalculation = false
 * - Clear Bonus: Only applies when isFluxCalculation = false AND linesCleared > 0
 * 
 * **Integration:**
 * - Used in calculateScore() for score multiplier
 * - Used in calculateFluxGain() for flux multiplier
 * - Stacks multiplicatively with tier and event multipliers
 * 
 * **Edge Cases:**
 * - Empty activeEvents set: Returns 1.0 (no bonus)
 * - Clear Bonus with 0 lines cleared: Returns 1.0 (bonus not applied)
 * - Flux calculation with only score events active: Returns 1.0
 * - Score calculation with only flux events active: Returns 1.0
 * 
 * **Validates: Requirements 5.5, 5.6, 5.7, 5.9, 5.10**
 */
export function getMiniEventMultiplier(
  activeEvents: Set<MiniEventType>,
  isFluxCalculation: boolean,
  linesCleared: number
): number {
  let multiplier = 1.0;
  
  for (const eventType of activeEvents) {
    if (eventType === MiniEventType.FLUX_SURGE && isFluxCalculation) {
      multiplier *= MINI_EVENT_MULTIPLIERS.FLUX_SURGE;
    } else if (eventType === MiniEventType.SCORE_RUSH && !isFluxCalculation) {
      multiplier *= MINI_EVENT_MULTIPLIERS.SCORE_RUSH;
    } else if (eventType === MiniEventType.CLEAR_BONUS && !isFluxCalculation && linesCleared > 0) {
      multiplier *= MINI_EVENT_MULTIPLIERS.CLEAR_BONUS;
    }
  }
  
  return multiplier;
}
