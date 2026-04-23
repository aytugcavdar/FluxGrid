/**
 * Multiplier Store
 * 
 * Manages multiplier state and calculations
 * Part of the gameStore split refactoring
 */

import { create } from 'zustand';
import { GameMode } from '@shared/types';
import { createMiniEventState, checkMiniEvents, shouldPreventComboBreak, getMiniEventMultiplier, isPieceBlessingActive, tickMiniEvents } from './helpers/miniEventSystem';

export interface MultiplierStore {
  // State
  miniEventState: ReturnType<typeof createMiniEventState>;
  totalMovesPlayed: number;
  timedBoostMovesLeft: number;
  
  // Event System State
  activeEvent: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null;
  eventMovesRemaining: number;
  
  // Actions
  checkMiniEvents: (difficultyTier: number) => void;
  shouldPreventComboBreak: (linesCleared: number) => boolean;
  getMiniEventMultiplier: (linesCleared: number) => number;
  isPieceBlessingActive: () => boolean;
  incrementTotalMoves: () => void;
  setTimedBoostMoves: (moves: number) => void;
  decrementTimedBoostMoves: () => void;
  setActiveEvent: (event: 'ICE_STORM' | 'GRAVITY_RUSH' | 'QUAKE' | 'MIRROR' | 'CHAOS' | 'VOID' | null) => void;
  setEventMovesRemaining: (moves: number) => void;
  decrementEventMoves: () => void;
  setMiniEventState: (state: ReturnType<typeof createMiniEventState>) => void;
  resetMultiplierState: (gameMode: GameMode) => void;
}

export const useMultiplierStore = create<MultiplierStore>((set, get) => ({
  // Initial state
  miniEventState: createMiniEventState(),
  totalMovesPlayed: 0,
  timedBoostMovesLeft: 0,
  
  // Event System Initial State
  activeEvent: null,
  eventMovesRemaining: 0,
  
  /**
   * Check and activate mini-events
   */
  checkMiniEvents: (difficultyTier) => {
    const totalMoves = get().totalMovesPlayed;
    const currentState = get().miniEventState;
    
    const updatedState = checkMiniEvents(totalMoves, currentState, difficultyTier);
    set({ miniEventState: updatedState });
  },
  
  /**
   * Check if combo break should be prevented
   */
  shouldPreventComboBreak: (linesCleared) => {
    const state = get().miniEventState;
    return shouldPreventComboBreak(state, linesCleared);
  },
  
  /**
   * Get mini-event multiplier
   */
  getMiniEventMultiplier: (linesCleared) => {
    const state = get().miniEventState;
    return getMiniEventMultiplier(state.activeEvents, false, linesCleared);
  },
  
  /**
   * Check if piece blessing is active
   */
  isPieceBlessingActive: () => {
    const state = get().miniEventState;
    return isPieceBlessingActive(state);
  },
  
  /**
   * Increment total moves played
   */
  incrementTotalMoves: () => {
    set({ totalMovesPlayed: get().totalMovesPlayed + 1 });
  },
  
  /**
   * Set timed boost moves
   */
  setTimedBoostMoves: (moves) => {
    set({ timedBoostMovesLeft: moves });
  },
  
  /**
   * Decrement timed boost moves
   */
  decrementTimedBoostMoves: () => {
    set({ timedBoostMovesLeft: Math.max(0, get().timedBoostMovesLeft - 1) });
  },
  
  /**
   * Set active event
   */
  setActiveEvent: (event) => {
    set({ activeEvent: event });
  },
  
  /**
   * Set event moves remaining
   */
  setEventMovesRemaining: (moves) => {
    set({ eventMovesRemaining: moves });
  },
  
  /**
   * Decrement event moves
   */
  decrementEventMoves: () => {
    set({ eventMovesRemaining: Math.max(0, get().eventMovesRemaining - 1) });
  },
  
  /**
   * Set mini-event state (for loading saved games)
   */
  setMiniEventState: (state) => {
    set({ miniEventState: state });
  },
  
  /**
   * Reset multiplier state (for new game)
   */
  resetMultiplierState: (gameMode) => {
    set({
      miniEventState: gameMode === GameMode.ENDLESS ? get().miniEventState : createMiniEventState(),
      totalMovesPlayed: 0,
      timedBoostMovesLeft: 0,
      activeEvent: null,
      eventMovesRemaining: 0,
    });
  },
}));
