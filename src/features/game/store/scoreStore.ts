/**
 * Score Store
 * 
 * Manages score, combo, and scoring operations
 * Part of the gameStore split refactoring
 */

import { create } from 'zustand';
import { MultiplierBreakdown } from '../types';
import { GameMode } from '@shared/types';
import { storageService as LocalStorageService } from '@core/services/storage/StorageService';
import { COMBO_TIMER } from '../constants';

export interface ScoreStore {
  // State
  score: number;
  highScore: number;
  highScores: { [key: string]: number };
  combo: number;
  maxCombo: number;
  lastMultiplierBreakdown: MultiplierBreakdown | null;
  
  // Combo Timer State
  comboTimerStartTime: number | null;
  comboTimerDuration: number;
  comboTimeLeft: number;
  
  // Timed Mode State
  finalSprintBonus: number;
  
  // Actions
  addScore: (points: number, breakdown?: MultiplierBreakdown) => void;
  resetCombo: () => void;
  incrementCombo: (linesCleared: number) => void;
  updateHighScore: (gameMode: GameMode, score: number) => void;
  getScoreBreakdown: () => MultiplierBreakdown | null;
  getComboMultiplier: () => number;
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  setMaxCombo: (maxCombo: number) => void;
  setComboTimer: (startTime: number | null, timeLeft: number) => void;
  addSprintBonus: (points: number) => void;
  resetScoreState: () => void;
  loadHighScores: () => void;
}

export const useScoreStore = create<ScoreStore>((set, get) => {
  // Initial state - will be loaded async
  const initialState = {
    score: 0,
    highScore: 0,
    highScores: {} as { [key: string]: number },
    combo: 0,
    maxCombo: 0,
    lastMultiplierBreakdown: null,
    comboTimerStartTime: null,
    comboTimerDuration: COMBO_TIMER.DURATION,
    comboTimeLeft: 0,
    finalSprintBonus: 0,
  };
  
  // Load high scores async
  LocalStorageService.loadHighScores().then(savedHighScores => {
    set({ highScores: savedHighScores });
  }).catch(err => {
    console.error('[ScoreStore] Failed to load high scores:', err);
  });
  
  return {
    ...initialState,
    
    /**
     * Add points to score
     */
    addScore: (points, breakdown) => {
      const newScore = get().score + points;
      set({ 
        score: newScore,
        lastMultiplierBreakdown: breakdown || get().lastMultiplierBreakdown
      });
    },
    
    /**
     * Reset combo to 0
     */
    resetCombo: () => {
      set({ 
        combo: 0,
        comboTimerStartTime: null,
        comboTimeLeft: 0
      });
    },
    
    /**
     * Increment combo by lines cleared
     */
    incrementCombo: (linesCleared) => {
      const newCombo = get().combo + linesCleared;
      const now = Date.now();
      
      set({ 
        combo: newCombo,
        maxCombo: Math.max(get().maxCombo, newCombo),
        comboTimerStartTime: now,
        comboTimeLeft: get().comboTimerDuration / 1000
      });
    },
    
    /**
     * Update high score for a game mode
     */
    updateHighScore: (gameMode, score) => {
      const currentHighScores = get().highScores;
      const modeHighScore = currentHighScores[gameMode] || 0;
      
      if (score > modeHighScore) {
        const newHighScores = { ...currentHighScores, [gameMode]: score };
        set({ 
          highScores: newHighScores,
          highScore: score
        });
        
        // Save to localStorage
        LocalStorageService.saveHighScore(gameMode, score);
      }
    },
    
    /**
     * Get score breakdown
     */
    getScoreBreakdown: () => {
      return get().lastMultiplierBreakdown;
    },
    
    /**
     * Get combo multiplier
     */
    getComboMultiplier: () => {
      return get().combo;
    },
    
    /**
     * Set score (for loading saved games)
     */
    setScore: (score) => {
      set({ score });
    },
    
    /**
     * Set combo (for loading saved games)
     */
    setCombo: (combo) => {
      set({ combo });
    },
    
    /**
     * Set max combo (for loading saved games)
     */
    setMaxCombo: (maxCombo) => {
      set({ maxCombo });
    },
    
    /**
     * Set combo timer
     */
    setComboTimer: (startTime, timeLeft) => {
      set({ 
        comboTimerStartTime: startTime,
        comboTimeLeft: timeLeft
      });
    },
    
    /**
     * Add sprint bonus points
     */
    addSprintBonus: (points) => {
      set({ finalSprintBonus: get().finalSprintBonus + points });
    },
    
    /**
     * Reset score state (for new game)
     */
    resetScoreState: () => {
      set({
        score: 0,
        combo: 0,
        maxCombo: 0,
        lastMultiplierBreakdown: null,
        comboTimerStartTime: null,
        comboTimeLeft: 0,
        finalSprintBonus: 0,
      });
    },
    
    /**
     * Load high scores from localStorage
     */
    loadHighScores: async () => {
      const savedHighScores = await LocalStorageService.loadHighScores();
      set({ highScores: savedHighScores });
    },
  };
});
