import { create } from 'zustand';

export interface VisualEffect {
  id: string;
  type: 'explosion' | 'pulse' | 'flash' | 'glow' | 'lightning-line' | 'particle-burst' | 'circle-expand' | 'area-clear' | 'glow-pulse' | 'sparkle-burst' | 'score-popup';
  timestamp: number;
  duration: number;
  target?: string; // DOM element ID or grid coordinate
  props: Record<string, any>;
}

export interface ScorePopup {
  id: number;
  value: number;
  combo: number;
  timestamp: number;
}

export interface VisualEffectStore {
  // State
  activeEffects: VisualEffect[];
  maxActiveEffects: number;
  prefersReducedMotion: boolean;
  performanceMode: 'high' | 'medium' | 'low';
  currentFPS: number;
  
  // New state for game juice improvements
  activeScorePopups: ScorePopup[];
  maxScorePopups: number;
  comboMilestoneActive: boolean;
  perfectClearActive: boolean;
  
  // Actions
  addEffect: (effect: Omit<VisualEffect, 'id' | 'timestamp'>) => void;
  removeEffect: (id: string) => void;
  clearCompletedEffects: () => void;
  updatePerformanceMode: (fps: number) => void;
  setReducedMotion: (enabled: boolean) => void;
  
  // New actions for game juice improvements
  addScorePopup: (value: number, combo: number) => void;
  removeScorePopup: (id: number) => void;
  setComboMilestoneActive: (active: boolean) => void;
  setPerfectClearActive: (active: boolean) => void;
}

export const useVisualEffectStore = create<VisualEffectStore>((set, get) => {
  // Initialize prefers-reduced-motion listener
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialReducedMotion = mediaQuery.matches;
  
  // Listen for changes
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    set({ prefersReducedMotion: e.matches });
  };
  
  mediaQuery.addEventListener('change', handleReducedMotionChange);
  
  return {
    // Initial state
    activeEffects: [],
    maxActiveEffects: 10, // Further reduced from 15 to 10 for better performance
    prefersReducedMotion: initialReducedMotion,
    performanceMode: 'high',
    currentFPS: 60,
    
    // New state for game juice improvements
    activeScorePopups: [],
    maxScorePopups: 8, // Requirements: 2.8
    comboMilestoneActive: false,
    perfectClearActive: false,
    
    // Actions
    addEffect: (effect) => {
      const { activeEffects, maxActiveEffects, performanceMode } = get();
      
      // Skip effects if performance is too low
      if (performanceMode === 'low' && effect.type !== 'explosion') {
        return; // Only allow explosions in low performance mode
      }
      
      const newEffect: VisualEffect = {
        ...effect,
        id: `${effect.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      // If at max capacity, remove oldest effect
      let updatedEffects = [...activeEffects, newEffect];
      if (updatedEffects.length > maxActiveEffects) {
        updatedEffects = updatedEffects.slice(1);
      }
      
      set({ activeEffects: updatedEffects });

      // Effects are short-lived. A per-effect timeout avoids permanent store
      // intervals and the hidden FPS tracking loop when debug monitoring is off.
      window.setTimeout(() => {
        const isStillActive = get().activeEffects.some((activeEffect) => activeEffect.id === newEffect.id);
        if (!isStillActive) return;

        window.dispatchEvent(new CustomEvent('dispose-effect', {
          detail: { effectId: newEffect.id }
        }));
        get().removeEffect(newEffect.id);
      }, Math.max(0, newEffect.duration));
    },
    
    removeEffect: (id) => {
      set((state) => ({
        activeEffects: state.activeEffects.filter((effect) => effect.id !== id),
      }));
    },
    
    clearCompletedEffects: () => {
      const now = Date.now();
      set((state) => {
        // Get completed effects for disposal
        const completedEffects = state.activeEffects.filter(
          (effect) => now - effect.timestamp >= effect.duration
        );
        
        // Dispose Babylon.js resources for completed effects
        completedEffects.forEach((effect) => {
          // Dispatch disposal event for Babylon.js cleanup
          window.dispatchEvent(new CustomEvent('dispose-effect', {
            detail: { effectId: effect.id }
          }));
        });
        
        return {
          activeEffects: state.activeEffects.filter(
            (effect) => now - effect.timestamp < effect.duration
          ),
        };
      });
    },
    
    updatePerformanceMode: (fps) => {
      set({ currentFPS: fps });
      
      // Adjust performance mode based on FPS
      if (fps < 30) {
        set({ performanceMode: 'low' });
      } else if (fps < 45) {
        set({ performanceMode: 'medium' });
      } else {
        set({ performanceMode: 'high' });
      }
    },
    
    setReducedMotion: (enabled) => {
      set({ prefersReducedMotion: enabled });
      
      // Persist to localStorage
      // Requirements: 15.7
      try {
        localStorage.setItem('flux_reduced_motion', String(enabled));
      } catch {
        // Ignore localStorage errors
      }
    },
    
    // New actions for game juice improvements
    addScorePopup: (value, combo) => {
      const { activeScorePopups, maxScorePopups } = get();
      
      const newPopup: ScorePopup = {
        id: Date.now() + Math.random(),
        value,
        combo,
        timestamp: Date.now()
      };
      
      // If at max capacity, remove oldest popup
      // Requirements: 2.8
      let updatedPopups = [...activeScorePopups, newPopup];
      if (updatedPopups.length > maxScorePopups) {
        updatedPopups = updatedPopups.slice(1);
      }
      
      set({ activeScorePopups: updatedPopups });
      
      // Auto-remove after 1000ms
      setTimeout(() => {
        get().removeScorePopup(newPopup.id);
      }, 1000);
    },
    
    removeScorePopup: (id) => {
      set((state) => ({
        activeScorePopups: state.activeScorePopups.filter((popup) => popup.id !== id),
      }));
    },
    
    setComboMilestoneActive: (active) => {
      set({ comboMilestoneActive: active });
    },
    
    setPerfectClearActive: (active) => {
      set({ perfectClearActive: active });
    },
  };
});
