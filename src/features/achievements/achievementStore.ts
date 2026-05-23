/**
 * Achievement Store
 * 
 * Manages game achievements and unlocks.
 * Requirements: 8.9
 */

import { create } from 'zustand';

// Achievement Types
export type AchievementId = 
  | 'first_game'
  | 'score_1000'
  | 'score_5000'
  | 'score_10000'
  | 'lines_10'
  | 'lines_50'
  | 'lines_100'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'ability_master'
  | 'combo_master';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  target: number;
}

interface AchievementStore {
  // State
  achievements: Record<AchievementId, Achievement>;
  recentUnlock: Achievement | null;
  
  // Actions
  initializeAchievements: () => void;
  checkAchievement: (id: AchievementId, currentValue: number) => void;
  unlockAchievement: (id: AchievementId) => void;
  clearRecentUnlock: () => void;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
}

// Achievement Definitions
const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>> = {
  first_game: {
    id: 'first_game',
    title: 'İlk Adım',
    description: 'İlk oyununu tamamla',
    icon: '🎮',
    target: 1,
  },
  score_1000: {
    id: 'score_1000',
    title: 'Başlangıç',
    description: '1,000 puan kazan',
    icon: '⭐',
    target: 1000,
  },
  score_5000: {
    id: 'score_5000',
    title: 'Yükselen Yıldız',
    description: '5,000 puan kazan',
    icon: '🌟',
    target: 5000,
  },
  score_10000: {
    id: 'score_10000',
    title: 'Efsane',
    description: '10,000 puan kazan',
    icon: '💫',
    target: 10000,
  },
  lines_10: {
    id: 'lines_10',
    title: 'Temizlikçi',
    description: '10 satır temizle',
    icon: '🧹',
    target: 10,
  },
  lines_50: {
    id: 'lines_50',
    title: 'Usta Temizlikçi',
    description: '50 satır temizle',
    icon: '✨',
    target: 50,
  },
  lines_100: {
    id: 'lines_100',
    title: 'Temizlik Ustası',
    description: '100 satır temizle',
    icon: '🏆',
    target: 100,
  },
  streak_3: {
    id: 'streak_3',
    title: 'Kararlı',
    description: '3 gün üst üste oyna',
    icon: '🔥',
    target: 3,
  },
  streak_7: {
    id: 'streak_7',
    title: 'Bağımlı',
    description: '7 gün üst üste oyna',
    icon: '🔥🔥',
    target: 7,
  },
  streak_30: {
    id: 'streak_30',
    title: 'Efsane Seri',
    description: '30 gün üst üste oyna',
    icon: '🔥🔥🔥',
    target: 30,
  },
  ability_master: {
    id: 'ability_master',
    title: 'Yetenek Ustası',
    description: 'Tüm yetenekleri kullan',
    icon: '🎯',
    target: 8,
  },
  combo_master: {
    id: 'combo_master',
    title: 'Kombo Ustası',
    description: '5x kombo yap',
    icon: '💥',
    target: 5,
  },
};

const STORAGE_KEY = 'flux_achievement_store';

// localStorage helpers
function loadAchievements(): Record<AchievementId, Achievement> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function saveAchievements(achievements: Record<AchievementId, Achievement>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
  } catch (error) {
    // Silent fail
  }
}

// Initialize achievements
function initializeAchievementData(): Record<AchievementId, Achievement> {
  const saved = loadAchievements();
  
  if (saved) {
    // Check if saved data has corrupted encoding (contains mojibake characters)
    let hasCorruptedData = false;
    try {
      hasCorruptedData = Object.values(saved).some(ach => {
        if (!ach || typeof ach !== 'object') return false;
        const title = String(ach.title || '');
        const description = String(ach.description || '');
        // Check for common mojibake characters from UTF-8 corruption
        const mojibakePattern = /[ÃÄÅâ]/;
        return mojibakePattern.test(title) || mojibakePattern.test(description);
      });
    } catch (error) {
      hasCorruptedData = true; // If error, assume corrupted
    }
    
    // If corrupted, clear and reinitialize
    if (hasCorruptedData) {
      localStorage.removeItem(STORAGE_KEY);
      // Fall through to create fresh achievements
    } else {
      // Merge with definitions (in case new achievements were added)
      const merged: Record<AchievementId, Achievement> = {} as any;
      
      Object.keys(ACHIEVEMENT_DEFINITIONS).forEach((key) => {
        const id = key as AchievementId;
        const def = ACHIEVEMENT_DEFINITIONS[id];
        
        if (saved[id]) {
          // Keep unlocked status but refresh title/description from definitions
          merged[id] = {
            ...def,
            unlocked: saved[id].unlocked,
            unlockedAt: saved[id].unlockedAt,
            progress: saved[id].progress,
          };
        } else {
          merged[id] = {
            ...def,
            unlocked: false,
            progress: 0,
          };
        }
      });
      
      return merged;
    }
  }
  
  // Create fresh achievements
  const fresh: Record<AchievementId, Achievement> = {} as any;
  
  Object.keys(ACHIEVEMENT_DEFINITIONS).forEach((key) => {
    const id = key as AchievementId;
    const def = ACHIEVEMENT_DEFINITIONS[id];
    
    fresh[id] = {
      ...def,
      unlocked: false,
      progress: 0,
    };
  });
  
  return fresh;
}

// Create Store
export const useAchievementStore = create<AchievementStore>((set, get) => ({
  achievements: initializeAchievementData(),
  recentUnlock: null,
  
  initializeAchievements: () => {
    const achievements = initializeAchievementData();
    set({ achievements });
  },
  
  checkAchievement: (id: AchievementId, currentValue: number) => {
    const state = get();
    const achievement = state.achievements[id];
    
    if (!achievement || achievement.unlocked) return;
    
    // Update progress
    const newProgress = Math.min(currentValue, achievement.target);
    
    if (newProgress !== achievement.progress) {
      const updated = {
        ...achievement,
        progress: newProgress,
      };
      
      const newAchievements = {
        ...state.achievements,
        [id]: updated,
      };
      
      set({ achievements: newAchievements });
      saveAchievements(newAchievements);
    }
    
    // Check if unlocked
    if (currentValue >= achievement.target) {
      get().unlockAchievement(id);
    }
  },
  
  unlockAchievement: (id: AchievementId) => {
    const state = get();
    const achievement = state.achievements[id];
    
    // CRITICAL FIX: Double-check if already unlocked (race condition protection)
    if (!achievement || achievement.unlocked) {
      return;
    }
    
    const unlocked = {
      ...achievement,
      unlocked: true,
      unlockedAt: Date.now(),
      progress: achievement.target,
    };
    
    const newAchievements = {
      ...state.achievements,
      [id]: unlocked,
    };
    
    set({
      achievements: newAchievements,
      recentUnlock: unlocked,
    });
    
    saveAchievements(newAchievements);
    
    // Auto-clear recent unlock after 5 seconds
    setTimeout(() => {
      const currentState = get();
      if (currentState.recentUnlock?.id === id) {
        set({ recentUnlock: null });
      }
    }, 5000);
  },
  
  clearRecentUnlock: () => {
    set({ recentUnlock: null });
  },
  
  getUnlockedCount: () => {
    const state = get();
    return Object.values(state.achievements).filter(a => a.unlocked).length;
  },
  
  getTotalCount: () => {
    return Object.keys(ACHIEVEMENT_DEFINITIONS).length;
  },
}));
