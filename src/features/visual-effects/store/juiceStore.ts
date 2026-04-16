import { create } from 'zustand';

export interface ScreenShake {
  intensity: number;
  duration: number;
  timestamp: number;
}

export interface LineClearAnimation {
  id: string;
  type: 'row' | 'column';
  index: number;
  color: string;
  timestamp: number;
  chainIndex: number;
}

export interface ParticleExplosion {
  id: string;
  x: number;
  y: number;
  color: string;
  intensity: number;
  timestamp: number;
}

export interface ComboGlow {
  intensity: number;
  color: string;
  timestamp: number;
}

export interface PlacementFeedback {
  type: 'valid' | 'invalid';
  timestamp: number;
}

interface JuiceState {
  // Screen shake
  screenShake: ScreenShake | null;
  triggerScreenShake: (intensity: number, duration: number) => void;
  
  // Line clear animations
  lineClearAnimations: LineClearAnimation[];
  addLineClearAnimation: (animation: Omit<LineClearAnimation, 'id' | 'timestamp'>) => void;
  removeLineClearAnimation: (id: string) => void;
  
  // Particle explosions
  particleExplosions: ParticleExplosion[];
  addParticleExplosion: (explosion: Omit<ParticleExplosion, 'id' | 'timestamp'>) => void;
  removeParticleExplosion: (id: string) => void;
  
  // Combo glow
  comboGlow: ComboGlow | null;
  triggerComboGlow: (intensity: number, color: string) => void;
  clearComboGlow: () => void;
  
  // Placement feedback
  placementFeedback: PlacementFeedback | null;
  triggerPlacementFeedback: (type: 'valid' | 'invalid') => void;
  
  // Clear all effects
  clearAllEffects: () => void;
}

export const useJuiceStore = create<JuiceState>((set) => ({
  // Screen shake
  screenShake: null,
  triggerScreenShake: (intensity, duration) => {
    set({
      screenShake: {
        intensity,
        duration,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after duration
    setTimeout(() => {
      set({ screenShake: null });
    }, duration);
  },
  
  // Line clear animations
  lineClearAnimations: [],
  addLineClearAnimation: (animation) => {
    const id = `line-${Date.now()}-${Math.random()}`;
    set((state) => ({
      lineClearAnimations: [
        ...state.lineClearAnimations,
        { ...animation, id, timestamp: Date.now() },
      ],
    }));
    
    // Auto-remove after animation completes (500ms)
    setTimeout(() => {
      set((state) => ({
        lineClearAnimations: state.lineClearAnimations.filter((a) => a.id !== id),
      }));
    }, 500);
  },
  removeLineClearAnimation: (id) => {
    set((state) => ({
      lineClearAnimations: state.lineClearAnimations.filter((a) => a.id !== id),
    }));
  },
  
  // Particle explosions
  particleExplosions: [],
  addParticleExplosion: (explosion) => {
    const id = `particle-${Date.now()}-${Math.random()}`;
    set((state) => ({
      particleExplosions: [
        ...state.particleExplosions,
        { ...explosion, id, timestamp: Date.now() },
      ],
    }));
    
    // Auto-remove after animation completes (800ms)
    setTimeout(() => {
      set((state) => ({
        particleExplosions: state.particleExplosions.filter((p) => p.id !== id),
      }));
    }, 800);
  },
  removeParticleExplosion: (id) => {
    set((state) => ({
      particleExplosions: state.particleExplosions.filter((p) => p.id !== id),
    }));
  },
  
  // Combo glow
  comboGlow: null,
  triggerComboGlow: (intensity, color) => {
    set({
      comboGlow: {
        intensity,
        color,
        timestamp: Date.now(),
      },
    });
  },
  clearComboGlow: () => {
    set({ comboGlow: null });
  },
  
  // Placement feedback
  placementFeedback: null,
  triggerPlacementFeedback: (type) => {
    set({
      placementFeedback: {
        type,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation
    setTimeout(() => {
      set({ placementFeedback: null });
    }, 300);
  },
  
  // Clear all effects
  clearAllEffects: () => {
    set({
      screenShake: null,
      lineClearAnimations: [],
      particleExplosions: [],
      comboGlow: null,
      placementFeedback: null,
    });
  },
}));
