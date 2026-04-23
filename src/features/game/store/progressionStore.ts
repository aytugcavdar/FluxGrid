/**
 * Progression Store
 * 
 * Manages level, experience, and progression operations
 * Part of the gameStore split refactoring
 */

import { create } from 'zustand';
import { ProgressionState } from '../types';
import { createProgressionState, updateStreak, getStreakMultiplier, checkMilestones } from './helpers/progressionSystem';

export interface ProgressionStore {
  // State
  progressionState: ProgressionState;
  difficultyTier: number;
  maxLevelReached: number;
  
  // Alias for backward compatibility
  progression: ProgressionState;
  
  // Actions
  updateStreak: (linesCleared: number, comboShieldActive: boolean) => void;
  getStreakMultiplier: () => number;
  checkMilestones: (score: number) => { milestones: any[]; newMilestone: any | null };
  setDifficultyTier: (tier: number) => void;
  setMaxLevelReached: (level: number) => void;
  setProgressionState: (state: ProgressionState) => void;
  resetProgressionState: () => void;
}

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  // Initial state
  progressionState: createProgressionState(),
  difficultyTier: 0,
  maxLevelReached: 0,
  
  // Alias getter for backward compatibility
  get progression() {
    return get().progressionState;
  },
  
  /**
   * Update streak
   */
  updateStreak: (linesCleared, comboShieldActive) => {
    const currentState = get().progressionState;
    const newStreak = updateStreak(currentState.currentStreak, linesCleared, comboShieldActive);
    
    set({
      progressionState: {
        ...currentState,
        currentStreak: newStreak,
      },
    });
  },
  
  /**
   * Get streak multiplier
   */
  getStreakMultiplier: () => {
    const currentStreak = get().progressionState.currentStreak;
    return getStreakMultiplier(currentStreak);
  },
  
  /**
   * Check milestones
   */
  checkMilestones: (score) => {
    const currentState = get().progressionState;
    const result = checkMilestones(score, currentState.milestones);
    
    if (result.newMilestone) {
      set({
        progressionState: {
          ...currentState,
          milestones: result.milestones,
          lastMilestoneShown: result.newMilestone.id,
        },
      });
    }
    
    return result;
  },
  
  /**
   * Set difficulty tier
   */
  setDifficultyTier: (tier) => {
    set({ difficultyTier: tier });
  },
  
  /**
   * Set max level reached
   */
  setMaxLevelReached: (level) => {
    set({ maxLevelReached: level });
  },
  
  /**
   * Set progression state (for loading saved games)
   */
  setProgressionState: (state) => {
    set({ progressionState: state });
  },
  
  /**
   * Reset progression state (for new game)
   */
  resetProgressionState: () => {
    set({
      progressionState: createProgressionState(),
      difficultyTier: 0,
    });
  },
}));
