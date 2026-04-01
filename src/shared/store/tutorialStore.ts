import { create } from 'zustand';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TutorialStore {
  // State
  isActive: boolean;           // Tutorial is currently running
  currentStep: number;         // 0 = inactive, 1-4 = active steps
  isCompleted: boolean;        // Tutorial has been completed (persisted)
  
  // Actions
  start: () => void;           // Initialize tutorial (set step to 1)
  nextStep: () => void;        // Advance to next step
  skip: () => void;            // Skip tutorial and mark as completed
  complete: () => void;        // Complete tutorial and persist
  shouldShow: () => boolean;   // Check if tutorial should be shown
  reset: () => void;           // Reset tutorial (for testing)
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const TUTORIAL_STORAGE_KEY = 'flux_onboard_v1';

const safeLocalStorageWrite = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`[Tutorial] Failed to write to localStorage: ${key}`, error);
    // Continue execution - tutorial completion still tracked in memory
  }
};

const safeLocalStorageRead = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`[Tutorial] Failed to read from localStorage: ${key}`, error);
    return null; // Safe default - assume tutorial not completed
  }
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  // Initial State - load completion status from localStorage
  isActive: false,
  currentStep: 0,
  isCompleted: safeLocalStorageRead(TUTORIAL_STORAGE_KEY) === 'true',
  
  // Actions
  start: () => {
    const { isCompleted } = get();
    
    // Don't start if already completed
    if (isCompleted) {
      console.log('[Tutorial] Already completed, skipping');
      return;
    }
    
    console.log('[Tutorial] Starting tutorial - step 1');
    set({
      isActive: true,
      currentStep: 1,
      isCompleted: false,
    });
  },
  
  nextStep: () => {
    const { currentStep, isActive } = get();
    
    // Ignore if tutorial not active
    if (!isActive) {
      console.warn('[Tutorial] nextStep called but tutorial not active');
      return;
    }
    
    // Validate current step
    if (currentStep < 1 || currentStep > 4) {
      console.error(`[Tutorial] Invalid step: ${currentStep}, resetting`);
      set({ isActive: false, currentStep: 0 });
      return;
    }
    
    // If on step 4, complete tutorial
    if (currentStep === 4) {
      console.log('[Tutorial] Reached final step, completing');
      get().complete();
      return;
    }
    
    // Advance to next step
    const nextStep = currentStep + 1;
    console.log(`[Tutorial] Advancing from step ${currentStep} to ${nextStep}`);
    set({ currentStep: nextStep });
  },
  
  skip: () => {
    console.log('[Tutorial] Skipping tutorial');
    set({
      isActive: false,
      isCompleted: true,
      currentStep: 0,
    });
    
    // Persist completion to localStorage
    safeLocalStorageWrite(TUTORIAL_STORAGE_KEY, 'true');
    
    // Dispatch custom event for any listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-complete'));
    }
  },
  
  complete: () => {
    console.log('[Tutorial] Completing tutorial');
    set({
      isActive: false,
      isCompleted: true,
      currentStep: 0,
    });
    
    // Persist completion to localStorage
    safeLocalStorageWrite(TUTORIAL_STORAGE_KEY, 'true');
    
    // Dispatch custom event for any listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-complete'));
    }
  },
  
  shouldShow: (): boolean => {
    return safeLocalStorageRead(TUTORIAL_STORAGE_KEY) !== 'true';
  },
  
  reset: () => {
    console.log('[Tutorial] Resetting tutorial (for testing)');
    
    // Remove from localStorage
    try {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    } catch (error) {
      console.error('[Tutorial] Failed to remove from localStorage', error);
    }
    
    // Reset state
    set({
      isActive: false,
      currentStep: 0,
      isCompleted: false,
    });
  },
}));
