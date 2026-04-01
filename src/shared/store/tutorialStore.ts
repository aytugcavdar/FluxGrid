import { create } from 'zustand';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ForcedPieceConfig {
  shape: number[][];
  color: string;
  targetX: number;
  targetY: number;
  pieceIndex: number; // Which piece in the tray (0-2)
}

export interface TutorialStepConfig {
  targetElement: string; // CSS selector for spotlight
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  showHandAnimation: boolean;
  handPath?: { startX: number; startY: number; endX: number; endY: number };
  autoAdvance: boolean; // Auto-advance after timeout
  autoAdvanceDelay?: number; // Milliseconds
}

export interface TutorialStore {
  // State
  isActive: boolean;
  currentStep: number; // 0-6 (0 = inactive, 1-6 = active steps)
  isCompleted: boolean;
  
  // Actions
  start: () => void;
  nextStep: () => void;
  previousStep: () => void;
  complete: () => void;
  skip: () => void;
  
  // Helpers
  getForcedPiece: (step: number) => ForcedPieceConfig | null;
  getStepConfig: (step: number) => TutorialStepConfig;
}

// ============================================================================
// FORCED PIECE CONFIGURATIONS
// ============================================================================

const FORCED_PIECES: Record<number, ForcedPieceConfig> = {
  1: {
    shape: [[1, 1, 1]], // Horizontal line (3 blocks)
    color: '#3b82f6', // Blue
    targetX: 3,
    targetY: 8,
    pieceIndex: 0,
  },
  2: {
    shape: [[1], [1], [1]], // Vertical line (3 blocks)
    color: '#10b981', // Green
    targetX: 6,
    targetY: 6,
    pieceIndex: 1,
  },
  5: {
    shape: [[1, 1]], // Small horizontal (2 blocks)
    color: '#f59e0b', // Orange
    targetX: 0,
    targetY: 9,
    pieceIndex: 0,
  },
};

// ============================================================================
// TUTORIAL STEP CONFIGURATIONS
// ============================================================================

const TUTORIAL_STEPS: Record<number, TutorialStepConfig> = {
  1: {
    targetElement: '[data-piece-slot="0"]', // First piece in the tray (use data attribute)
    tooltipPosition: 'top',
    showHandAnimation: true,
    handPath: { startX: 50, startY: 80, endX: 50, endY: 40 },
    autoAdvance: false,
  },
  2: {
    targetElement: 'canvas', // The 3D grid canvas
    tooltipPosition: 'right',
    showHandAnimation: false,
    autoAdvance: false,
  },
  3: {
    targetElement: 'canvas', // The 3D grid canvas
    tooltipPosition: 'top',
    showHandAnimation: false,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
  4: {
    targetElement: 'header', // HUD header containing flux meter
    tooltipPosition: 'bottom',
    showHandAnimation: false,
    autoAdvance: true,
    autoAdvanceDelay: 3000,
  },
  5: {
    targetElement: '[data-testid="mobile-skill-button"]', // First skill button (Reroll)
    tooltipPosition: 'top',
    showHandAnimation: true,
    handPath: { startX: 20, startY: 90, endX: 20, endY: 85 },
    autoAdvance: false,
  },
  6: {
    targetElement: 'canvas', // The 3D grid canvas
    tooltipPosition: 'top',
    showHandAnimation: false,
    autoAdvance: true,
    autoAdvanceDelay: 2000,
  },
};

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const TUTORIAL_STORAGE_KEY = 'flux_onboard_v1';

const safeLocalStorageWrite = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write to localStorage: ${key}`, error);
    // Continue execution - tutorial completion still tracked in memory
  }
};

const safeLocalStorageRead = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read from localStorage: ${key}`, error);
    return null; // Safe default - assume tutorial not completed
  }
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  // Initial State
  isActive: false,
  currentStep: 0,
  isCompleted: safeLocalStorageRead(TUTORIAL_STORAGE_KEY) === 'true',
  
  // Actions
  start: () => {
    console.log('[Tutorial] Starting tutorial - step 1');
    set({
      isActive: true,
      currentStep: 1,
      isCompleted: false,
    });
  },
  
  nextStep: () => {
    const { currentStep, isActive } = get();
    
    if (!isActive) return;
    
    // Validate state
    if (currentStep < 1 || currentStep > 6) {
      console.error(`Invalid tutorial state: step ${currentStep}`);
      set({ isActive: false, currentStep: 0 });
      return;
    }
    
    if (currentStep === 6) {
      // Last step - complete tutorial
      get().complete();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },
  
  previousStep: () => {
    const { currentStep, isActive } = get();
    
    if (!isActive) return;
    
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },
  
  complete: () => {
    set({
      isActive: false,
      isCompleted: true,
      currentStep: 0,
    });
    
    // Persist completion to localStorage
    safeLocalStorageWrite(TUTORIAL_STORAGE_KEY, 'true');
    
    // Trigger confetti effect via custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-complete'));
      
      // Return to home screen after tutorial completes
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tutorial-return-home'));
      }, 2500); // Wait for confetti to finish
    }
  },
  
  skip: () => {
    set({
      isActive: false,
      isCompleted: true,
      currentStep: 0,
    });
    
    // Persist completion to localStorage
    safeLocalStorageWrite(TUTORIAL_STORAGE_KEY, 'true');
    
    // Return to home screen immediately when skipped
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tutorial-return-home'));
    }
  },
  
  // Helpers
  getForcedPiece: (step: number): ForcedPieceConfig | null => {
    const config = FORCED_PIECES[step];
    
    if (!config) {
      console.warn(`No forced piece configuration for step ${step}`);
      return null;
    }
    
    return config;
  },
  
  getStepConfig: (step: number): TutorialStepConfig => {
    const config = TUTORIAL_STEPS[step];
    
    if (!config) {
      console.warn(`No step configuration for step ${step}`);
      // Return default config
      return {
        targetElement: '.grid',
        tooltipPosition: 'top',
        showHandAnimation: false,
        autoAdvance: false,
      };
    }
    
    return config;
  },
}));
