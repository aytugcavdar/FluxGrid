import { create } from 'zustand';
import { shouldEnablePerformanceMode } from '../../../utils/devicePerformance';

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

export interface TierTransition {
  fromTier: number;
  toTier: number;
  timestamp: number;
}

export interface ScoreMilestone {
  score: number;
  label: string;
  timestamp: number;
}

export interface AbilityUnlock {
  abilityName: string;
  abilityIcon: string;
  timestamp: number;
}

export interface StreakIndicator {
  count: number;
  type: 'combo' | 'perfect' | 'daily';
  timestamp: number;
}

export interface NearMissWarning {
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface PauseResumeAnimation {
  type: 'pause' | 'resume';
  timestamp: number;
}

export interface GameOverSequence {
  finalScore: number;
  highScore: boolean;
  timestamp: number;
}

export interface VictoryCelebration {
  reason: string;
  score: number;
  timestamp: number;
}

export interface ModeChangeTransition {
  fromMode: string;
  toMode: string;
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
  
  // Tier transition
  tierTransition: TierTransition | null;
  triggerTierTransition: (fromTier: number, toTier: number) => void;
  
  // Score milestone
  scoreMilestone: ScoreMilestone | null;
  triggerScoreMilestone: (score: number, label: string) => void;
  
  // Ability unlock
  abilityUnlock: AbilityUnlock | null;
  triggerAbilityUnlock: (abilityName: string, abilityIcon: string) => void;
  
  // Streak indicator
  streakIndicator: StreakIndicator | null;
  triggerStreakIndicator: (count: number, type: 'combo' | 'perfect' | 'daily') => void;
  clearStreakIndicator: () => void;
  
  // Near miss warning
  nearMissWarning: NearMissWarning | null;
  triggerNearMissWarning: (severity: 'low' | 'medium' | 'high') => void;
  
  // Pause/Resume animation
  pauseResumeAnimation: PauseResumeAnimation | null;
  triggerPauseResumeAnimation: (type: 'pause' | 'resume') => void;
  
  // Game over sequence
  gameOverSequence: GameOverSequence | null;
  triggerGameOverSequence: (finalScore: number, highScore: boolean) => void;
  
  // Victory celebration
  victoryCelebration: VictoryCelebration | null;
  triggerVictoryCelebration: (reason: string, score: number) => void;
  
  // Mode change transition
  modeChangeTransition: ModeChangeTransition | null;
  triggerModeChangeTransition: (fromMode: string, toMode: string) => void;
  
  // Performance mode
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  
  // Clear all effects
  clearAllEffects: () => void;
}

export const useJuiceStore = create<JuiceState>((set) => ({
  // Screen shake
  screenShake: null,
  triggerScreenShake: () => {
    set({ screenShake: null });
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
  
  // Tier transition
  tierTransition: null,
  triggerTierTransition: (fromTier, toTier) => {
    set({
      tierTransition: {
        fromTier,
        toTier,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (3s)
    setTimeout(() => {
      set({ tierTransition: null });
    }, 3000);
  },
  
  // Score milestone
  scoreMilestone: null,
  triggerScoreMilestone: (score, label) => {
    set({
      scoreMilestone: {
        score,
        label,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (2.5s)
    setTimeout(() => {
      set({ scoreMilestone: null });
    }, 2500);
  },
  
  // Ability unlock
  abilityUnlock: null,
  triggerAbilityUnlock: (abilityName, abilityIcon) => {
    set({
      abilityUnlock: {
        abilityName,
        abilityIcon,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (3s)
    setTimeout(() => {
      set({ abilityUnlock: null });
    }, 3000);
  },
  
  // Streak indicator
  streakIndicator: null,
  triggerStreakIndicator: (count, type) => {
    set({
      streakIndicator: {
        count,
        type,
        timestamp: Date.now(),
      },
    });
  },
  clearStreakIndicator: () => {
    set({ streakIndicator: null });
  },
  
  // Near miss warning
  nearMissWarning: null,
  triggerNearMissWarning: (severity) => {
    set({
      nearMissWarning: {
        severity,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (2s)
    setTimeout(() => {
      set({ nearMissWarning: null });
    }, 2000);
  },
  
  // Pause/Resume animation
  pauseResumeAnimation: null,
  triggerPauseResumeAnimation: (type) => {
    set({
      pauseResumeAnimation: {
        type,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (0.8s)
    setTimeout(() => {
      set({ pauseResumeAnimation: null });
    }, 800);
  },
  
  // Game over sequence
  gameOverSequence: null,
  triggerGameOverSequence: (finalScore, highScore) => {
    set({
      gameOverSequence: {
        finalScore,
        highScore,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (4s)
    setTimeout(() => {
      set({ gameOverSequence: null });
    }, 4000);
  },
  
  // Victory celebration
  victoryCelebration: null,
  triggerVictoryCelebration: (reason, score) => {
    set({
      victoryCelebration: {
        reason,
        score,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (4s)
    setTimeout(() => {
      set({ victoryCelebration: null });
    }, 4000);
  },
  
  // Mode change transition
  modeChangeTransition: null,
  triggerModeChangeTransition: (fromMode, toMode) => {
    set({
      modeChangeTransition: {
        fromMode,
        toMode,
        timestamp: Date.now(),
      },
    });
    
    // Auto-clear after animation (1.5s)
    setTimeout(() => {
      set({ modeChangeTransition: null });
    }, 1500);
  },
  
  // Performance mode
  // Load from localStorage on init, or auto-enable on low-end devices
  performanceMode: (() => {
    const saved = localStorage.getItem('performanceMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return shouldEnablePerformanceMode();
  })(),
  setPerformanceMode: (enabled) => {
    set({ performanceMode: enabled });
    localStorage.setItem('performanceMode', String(enabled));
  },
  
  // Clear all effects
  clearAllEffects: () => {
    set({
      screenShake: null,
      lineClearAnimations: [],
      particleExplosions: [],
      comboGlow: null,
      placementFeedback: null,
      tierTransition: null,
      scoreMilestone: null,
      abilityUnlock: null,
      streakIndicator: null,
      nearMissWarning: null,
      pauseResumeAnimation: null,
      gameOverSequence: null,
      victoryCelebration: null,
      modeChangeTransition: null,
    });
  },
}));
