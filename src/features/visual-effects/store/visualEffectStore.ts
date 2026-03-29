import { create } from 'zustand';
import { PerformanceMonitor } from '../utils/performanceMonitor';

export interface VisualEffect {
  id: string;
  type: 'explosion' | 'pulse' | 'flash' | 'glow';
  timestamp: number;
  duration: number;
  target?: string; // DOM element ID or grid coordinate
  props: Record<string, any>;
}

export interface VisualEffectStore {
  // State
  activeEffects: VisualEffect[];
  maxActiveEffects: number;
  prefersReducedMotion: boolean;
  performanceMode: 'high' | 'medium' | 'low';
  currentFPS: number;
  
  // Actions
  addEffect: (effect: Omit<VisualEffect, 'id' | 'timestamp'>) => void;
  removeEffect: (id: string) => void;
  clearCompletedEffects: () => void;
  updatePerformanceMode: (fps: number) => void;
  setReducedMotion: (enabled: boolean) => void;
}

// Create performance monitor instance
const performanceMonitor = new PerformanceMonitor();

export const useVisualEffectStore = create<VisualEffectStore>((set, get) => {
  // Initialize prefers-reduced-motion listener
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialReducedMotion = mediaQuery.matches;
  
  // Listen for changes
  const handleReducedMotionChange = (e: MediaQueryListEvent) => {
    set({ prefersReducedMotion: e.matches });
  };
  
  mediaQuery.addEventListener('change', handleReducedMotionChange);
  
  // Start performance monitoring
  performanceMonitor.startMonitoring((metrics) => {
    const { fps, activeEffectCount } = metrics;
    
    // Update FPS and performance mode
    get().updatePerformanceMode(fps);
    
    // Update active effect count
    performanceMonitor.setActiveEffectCount(get().activeEffects.length);
  });
  
  return {
    // Initial state
    activeEffects: [],
    maxActiveEffects: 10, // Further reduced from 15 to 10 for better performance
    prefersReducedMotion: initialReducedMotion,
    performanceMode: 'high',
    currentFPS: 60,
    
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
    },
    
    removeEffect: (id) => {
      set((state) => ({
        activeEffects: state.activeEffects.filter((effect) => effect.id !== id),
      }));
    },
    
    clearCompletedEffects: () => {
      const now = Date.now();
      set((state) => ({
        activeEffects: state.activeEffects.filter(
          (effect) => now - effect.timestamp < effect.duration
        ),
      }));
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
    },
  };
});
