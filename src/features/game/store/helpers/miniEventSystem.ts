import { MiniEventType, MiniEventState } from '../../types';
import { MINI_EVENT_INTERVALS, MINI_EVENT_MULTIPLIERS, MINI_EVENT_DURATIONS } from '../../constants';

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
      [MiniEventType.COMBO_SHIELD]: 0,     // YENİ
      [MiniEventType.PIECE_BLESSING]: 0,   // YENİ
    },
    lastActivation: {
      [MiniEventType.FLUX_SURGE]: 0,
      [MiniEventType.SCORE_RUSH]: 0,
      [MiniEventType.CLEAR_BONUS]: 0,
      [MiniEventType.COMBO_SHIELD]: 0,     // YENİ
      [MiniEventType.PIECE_BLESSING]: 0,   // YENİ
    },
    comboShieldActive: false,  // YENİ
  };
}

/**
 * Get tier-based interval for a mini-event type
 * 
 * @param type - Mini-event type
 * @param tier - Current difficulty tier (0-6)
 * @returns Interval in moves for the given event type and tier
 */
function getMiniEventInterval(type: MiniEventType, tier: number): number {
  const tierGroup = tier <= 2 ? 'TIER_0_2' : tier <= 4 ? 'TIER_3_4' : 'TIER_5_6';
  return MINI_EVENT_INTERVALS[tierGroup][type];
}

/**
 * Check and activate mini-events based on move count and tier
 * 
 * GÜNCELLEME: tier parametresi eklendi
 * 
 * Evaluates whether any mini-events should activate based on the total
 * number of moves played and the time since each event's last activation.
 * Mini-events activate at fixed intervals to provide mid-tier variety.
 * 
 * @param totalMoves - Total moves played since game start (incremented after each piece placement)
 * @param currentState - Current mini-event state
 * @param tier - Current difficulty tier (0-6) for tier-based intervals
 * @returns Updated MiniEventState with newly activated events
 * 
 * @example
 * // At tier 0, 50 moves, Flux Surge activates
 * const state = checkMiniEvents(50, currentState, 0);
 * // state.activeEvents.has(MiniEventType.FLUX_SURGE) === true
 * 
 * // At tier 5, Flux Surge activates every 30 moves instead of 50
 * const state2 = checkMiniEvents(30, currentState, 5);
 * // state2.activeEvents.has(MiniEventType.FLUX_SURGE) === true
 * 
 * @remarks
 * **Activation Intervals (Tier-Based):**
 * - Tier 0-2: FLUX_SURGE: 50, SCORE_RUSH: 100, CLEAR_BONUS: 150, COMBO_SHIELD: 200, PIECE_BLESSING: 250
 * - Tier 3-4: FLUX_SURGE: 40, SCORE_RUSH: 80, CLEAR_BONUS: 120, COMBO_SHIELD: 160, PIECE_BLESSING: 200
 * - Tier 5-6: FLUX_SURGE: 30, SCORE_RUSH: 60, CLEAR_BONUS: 90, COMBO_SHIELD: 120, PIECE_BLESSING: 150
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 3.1**
 */
export function checkMiniEvents(
  totalMoves: number,
  currentState: MiniEventState,
  tier: number  // YENİ parametre
): MiniEventState {
  const newState = {
    activeEvents: new Set(currentState.activeEvents),
    moveCounters: { ...currentState.moveCounters },
    lastActivation: { ...currentState.lastActivation },
    comboShieldActive: currentState.comboShieldActive,
  };
  
  // Check each mini-event type
  Object.values(MiniEventType).forEach((eventType) => {
    const interval = getMiniEventInterval(eventType, tier);
    const lastActivation = currentState.lastActivation[eventType];
    
    if (totalMoves - lastActivation >= interval) {
      newState.activeEvents.add(eventType);
      
      // Set duration based on event type
      if (eventType === MiniEventType.COMBO_SHIELD) {
        newState.moveCounters[eventType] = MINI_EVENT_DURATIONS.COMBO_SHIELD; // Single-use
        newState.comboShieldActive = true;
      } else if (eventType === MiniEventType.PIECE_BLESSING) {
        newState.moveCounters[eventType] = MINI_EVENT_DURATIONS.PIECE_BLESSING; // 5 moves
      } else if (eventType === MiniEventType.CLEAR_BONUS) {
        newState.moveCounters[eventType] = MINI_EVENT_DURATIONS.CLEAR_BONUS; // Single-use
      } else {
        newState.moveCounters[eventType] = MINI_EVENT_DURATIONS[eventType]; // Duration-based
      }
      
      newState.lastActivation[eventType] = totalMoves;
    }
  });
  
  return newState;
}

/**
 * Tick mini-event durations after piece placement
 * 
 * GÜNCELLEME: COMBO_SHIELD ve PIECE_BLESSING logic eklendi
 * 
 * Decrements the duration counters for all active mini-events and
 * deactivates events that have expired. Clear Bonus is handled specially:
 * it's consumed immediately when a line is cleared.
 * 
 * @param currentState - Current mini-event state
 * @param linesCleared - Number of lines cleared in this move (0 if none)
 * @param comboWouldBreak - YENİ parametre - combo kırılacak mıydı?
 * @returns Updated MiniEventState with decremented counters and expired events removed
 * 
 * @example
 * // COMBO_SHIELD consumed when combo would break
 * const state = tickMiniEvents(currentState, 0, true);
 * // state.activeEvents.has(MiniEventType.COMBO_SHIELD) === false
 * // state.comboShieldActive === false
 * 
 * // PIECE_BLESSING decrements each move
 * const state2 = tickMiniEvents(currentState, 0, false);
 * // state2.moveCounters[MiniEventType.PIECE_BLESSING] === 4 (was 5)
 * 
 * @remarks
 * **Validates: Requirements 1.5, 2.2, 2.3, 2.5, 3.3**
 */
export function tickMiniEvents(
  currentState: MiniEventState,
  linesCleared: number,
  comboWouldBreak: boolean  // YENİ parametre - combo kırılacak mıydı?
): MiniEventState {
  const newState = {
    activeEvents: new Set(currentState.activeEvents),
    moveCounters: { ...currentState.moveCounters },
    lastActivation: { ...currentState.lastActivation },
    comboShieldActive: currentState.comboShieldActive,
  };
  
  // Decrement counters for active events
  for (const eventType of newState.activeEvents) {
    if (eventType === MiniEventType.CLEAR_BONUS) {
      // Clear Bonus consumed on line clear
      if (linesCleared > 0) {
        newState.moveCounters[eventType] = 0;
        newState.activeEvents.delete(eventType);
      }
    } else if (eventType === MiniEventType.COMBO_SHIELD) {
      // COMBO_SHIELD consumed when combo would break
      if (comboWouldBreak && linesCleared === 0) {
        newState.moveCounters[eventType] = 0;
        newState.activeEvents.delete(eventType);
        newState.comboShieldActive = false;
      }
    } else {
      // Duration-based events (FLUX_SURGE, SCORE_RUSH, PIECE_BLESSING)
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

/**
 * Check if COMBO_SHIELD should prevent combo break
 * 
 * @param miniEventState - Current mini-event state
 * @param linesCleared - Number of lines cleared in this move
 * @returns True if COMBO_SHIELD is active and should prevent combo break
 * 
 * @remarks
 * **Validates: Requirements 2.2, 2.3**
 */
export function shouldPreventComboBreak(
  miniEventState: MiniEventState,
  linesCleared: number
): boolean {
  return miniEventState.comboShieldActive && 
         miniEventState.activeEvents.has(MiniEventType.COMBO_SHIELD) &&
         linesCleared === 0;
}

/**
 * Check if PIECE_BLESSING is active (for piece generation)
 * 
 * @param miniEventState - Current mini-event state
 * @returns True if PIECE_BLESSING is currently active
 * 
 * @remarks
 * **Validates: Requirements 3.2, 3.5**
 */
export function isPieceBlessingActive(
  miniEventState: MiniEventState
): boolean {
  return miniEventState.activeEvents.has(MiniEventType.PIECE_BLESSING);
}
