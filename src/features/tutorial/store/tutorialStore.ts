/**
 * Tutorial Store
 * 
 * Manages tutorial state and progressive feature disclosure
 */

import { create } from 'zustand';
import type { FeatureFlags, TutorialMetrics, FeatureType, TutorialSaveData } from '../types';

interface TutorialStore {
  // State
  isActive: boolean;
  currentStep: number;
  isCompleted: boolean;
  gamesCompleted: number;
  featuresUnlocked: FeatureFlags;
  tutorialMetrics: TutorialMetrics;
  
  // Interactive feedback state
  currentHint: string | null;
  achievements: string[];
  startTime: number | null;
  
  // Analytics state
  stepStartTime: number | null;
  interactionCount: number;
  
  // Actions
  start: () => void;
  nextStep: () => void;
  skip: () => void;
  complete: () => void;
  incrementGamesCompleted: () => void;
  unlockFeature: (feature: FeatureType) => void;
  shouldShowFeature: (feature: FeatureType) => boolean;
  shouldShow: () => boolean;
  trackStepTime: (step: number, duration: number) => void;
  markAsReturningPlayer: () => void;
  reset: () => void;
  
  // Interactive actions
  setHint: (hint: string | null) => void;
  addAchievement: (achievement: string) => void;
  
  // Analytics actions
  trackStepStart: (step: number) => void;
  trackStepComplete: (step: number) => void;
  trackInteraction: (type: string) => void;
  getAnalytics: () => TutorialMetrics & { interactionCount: number };
}

const STORAGE_KEY = 'flux_tutorial_v2';

/**
 * Load tutorial data from localStorage
 */
function loadTutorialData(): Partial<TutorialStore> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const data: TutorialSaveData = JSON.parse(stored);
    
    return {
      isCompleted: data.isCompleted,
      gamesCompleted: data.gamesCompleted,
      featuresUnlocked: data.featuresUnlocked,
      tutorialMetrics: data.metrics
    };
  } catch (error) {
    console.error('[TutorialStore] Failed to load data:', error);
    return {};
  }
}

/**
 * Save tutorial data to localStorage
 */
function saveTutorialData(state: TutorialStore): void {
  try {
    const data: TutorialSaveData = {
      version: 1,
      isCompleted: state.isCompleted,
      gamesCompleted: state.gamesCompleted,
      featuresUnlocked: state.featuresUnlocked,
      metrics: state.tutorialMetrics,
      lastUpdated: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[TutorialStore] Failed to save data:', error);
  }
}

/**
 * Get initial feature flags
 */
function getInitialFeatureFlags(): FeatureFlags {
  return {
    comboTimer: false,
    basicSkills: false,
    allSkills: false,
    events: false,
    miniEvents: false
  };
}

/**
 * Get initial metrics
 */
function getInitialMetrics(): TutorialMetrics {
  return {
    startTime: null,
    completionTime: null,
    stepDurations: {},
    skipped: false,
    skipStep: null
  };
}

export const useTutorialStore = create<TutorialStore>((set, get) => {
  // Load saved data
  const savedData = loadTutorialData();
  
  return {
    // Initial state
    isActive: false,
    currentStep: 0,
    isCompleted: savedData.isCompleted || false,
    gamesCompleted: savedData.gamesCompleted || 0,
    featuresUnlocked: savedData.featuresUnlocked || getInitialFeatureFlags(),
    tutorialMetrics: savedData.tutorialMetrics || getInitialMetrics(),
    
    // Interactive feedback state
    currentHint: null,
    achievements: [],
    startTime: null,
    
    // Analytics state
    stepStartTime: null,
    interactionCount: 0,
    
    /**
     * Start tutorial
     */
    start: () => {
      const state = get();
      
      // Don't start if already completed
      if (state.isCompleted) {
        console.log('[TutorialStore] Tutorial already completed');
        return;
      }
      
      set({
        isActive: true,
        currentStep: 0, // Start from 0 to match array index
        startTime: Date.now(),
        achievements: [],
        currentHint: null,
        tutorialMetrics: {
          ...state.tutorialMetrics,
          startTime: Date.now()
        }
      });
      
      console.log('[TutorialStore] Tutorial started');
    },
    
    /**
     * Advance to next step
     */
    nextStep: () => {
      const state = get();
      const nextStep = state.currentStep + 1;
      
      console.log(`[TutorialStore] nextStep called: ${state.currentStep} -> ${nextStep}`);
      
      // Track step duration
      if (state.tutorialMetrics.startTime) {
        const duration = Date.now() - state.tutorialMetrics.startTime;
        state.trackStepTime(state.currentStep, duration);
      }
      
      // Just advance the step - completion will be handled by TutorialOverlay
      set({ currentStep: nextStep });
      console.log(`[TutorialStore] Advanced to step ${nextStep}`);
    },
    
    /**
     * Skip tutorial
     */
    skip: () => {
      const state = get();
      
      set({
        isActive: false,
        isCompleted: true,
        tutorialMetrics: {
          ...state.tutorialMetrics,
          skipped: true,
          skipStep: state.currentStep
        }
      });
      
      saveTutorialData(get());
      console.log(`[TutorialStore] Tutorial skipped at step ${state.currentStep}`);
    },
    
    /**
     * Complete tutorial
     */
    complete: () => {
      const state = get();
      const completionTime = Date.now();
      const duration = state.startTime ? (completionTime - state.startTime) / 1000 : 0;
      
      // Check for speed achievement
      if (duration < 30 && duration > 0) {
        state.addAchievement('speed');
      }
      
      set({
        isActive: false,
        isCompleted: true,
        tutorialMetrics: {
          ...state.tutorialMetrics,
          completionTime
        }
      });
      
      saveTutorialData(get());
      console.log('[TutorialStore] Tutorial completed in', duration, 'seconds');
    },
    
    /**
     * Set current hint
     */
    setHint: (hint: string | null) => {
      set({ currentHint: hint });
    },
    
    /**
     * Add achievement
     */
    addAchievement: (achievement: string) => {
      const state = get();
      if (!state.achievements.includes(achievement)) {
        set({ achievements: [...state.achievements, achievement] });
        console.log('[TutorialStore] Achievement unlocked:', achievement);
      }
    },
    
    /**
     * Increment games completed
     */
    incrementGamesCompleted: () => {
      const state = get();
      const newCount = state.gamesCompleted + 1;
      
      set({ gamesCompleted: newCount });
      
      // Auto-unlock features based on games completed
      if (newCount === 2 && !state.featuresUnlocked.comboTimer) {
        state.unlockFeature('comboTimer');
      }
      if (newCount === 3 && !state.featuresUnlocked.basicSkills) {
        state.unlockFeature('basicSkills');
      }
      if (newCount === 5) {
        if (!state.featuresUnlocked.allSkills) state.unlockFeature('allSkills');
        if (!state.featuresUnlocked.events) state.unlockFeature('events');
        if (!state.featuresUnlocked.miniEvents) state.unlockFeature('miniEvents');
      }
      
      saveTutorialData(get());
      console.log(`[TutorialStore] Games completed: ${newCount}`);
    },
    
    /**
     * Unlock a feature
     */
    unlockFeature: (feature: FeatureType) => {
      const state = get();
      
      set({
        featuresUnlocked: {
          ...state.featuresUnlocked,
          [feature]: true
        }
      });
      
      saveTutorialData(get());
      console.log(`[TutorialStore] Feature unlocked: ${feature}`);
    },
    
    /**
     * Check if a feature should be shown
     */
    shouldShowFeature: (feature: FeatureType) => {
      const state = get();
      return state.featuresUnlocked[feature];
    },
    
    /**
     * Check if tutorial should be shown (first launch)
     * Returns true if tutorial has never been completed
     */
    shouldShow: () => {
      const state = get();
      return !state.isCompleted && !state.isActive;
    },
    
    /**
     * Track step duration
     */
    trackStepTime: (step: number, duration: number) => {
      const state = get();
      
      set({
        tutorialMetrics: {
          ...state.tutorialMetrics,
          stepDurations: {
            ...state.tutorialMetrics.stepDurations,
            [step]: duration
          }
        }
      });
    },
    
    /**
     * Mark player as returning player (for migration)
     */
    markAsReturningPlayer: () => {
      set({
        isCompleted: true,
        gamesCompleted: 100,
        featuresUnlocked: {
          comboTimer: true,
          basicSkills: true,
          allSkills: true,
          events: true,
          miniEvents: true
        }
      });
      
      saveTutorialData(get());
      console.log('[TutorialStore] Marked as returning player with all features unlocked');
    },
    
    /**
     * Reset tutorial (for testing)
     */
    reset: () => {
      set({
        isActive: false,
        currentStep: 0,
        isCompleted: false,
        gamesCompleted: 0,
        featuresUnlocked: getInitialFeatureFlags(),
        tutorialMetrics: getInitialMetrics(),
        stepStartTime: null,
        interactionCount: 0
      });
      
      localStorage.removeItem(STORAGE_KEY);
      console.log('[TutorialStore] Tutorial reset');
    },
    
    /**
     * Track step start time
     */
    trackStepStart: (step: number) => {
      set({ stepStartTime: Date.now() });
      console.log(`[TutorialStore] Step ${step} started`);
    },
    
    /**
     * Track step completion
     */
    trackStepComplete: (step: number) => {
      const state = get();
      if (state.stepStartTime) {
        const duration = Date.now() - state.stepStartTime;
        state.trackStepTime(step, duration);
        console.log(`[TutorialStore] Step ${step} completed in ${duration}ms`);
      }
    },
    
    /**
     * Track user interaction
     */
    trackInteraction: (type: string) => {
      const state = get();
      set({ interactionCount: state.interactionCount + 1 });
      console.log(`[TutorialStore] Interaction: ${type} (total: ${state.interactionCount + 1})`);
    },
    
    /**
     * Get analytics data
     */
    getAnalytics: () => {
      const state = get();
      return {
        ...state.tutorialMetrics,
        interactionCount: state.interactionCount
      };
    }
  };
});
